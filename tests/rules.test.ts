import { describe, expect, test } from "bun:test";
import { analyze, humanize, type RuleId } from "../src/index.js";

function only(rule: RuleId, setting: boolean | Record<string, unknown> = true) {
  return { preset: false as const, rules: { [rule]: setting } };
}

describe("punctuation and formatting rules", () => {
  test("uses contextual em dash replacements", () => {
    expect(
      humanize("Fast — but expensive.", only("punctuation.em-dash")).text,
    ).toBe("Fast, but expensive.");
    expect(
      humanize(
        "It failed — because the disk was full.",
        only("punctuation.em-dash"),
      ).text,
    ).toBe("It failed because the disk was full.");
    expect(
      humanize(
        "The API — a small compatibility layer — handles it.",
        only("punctuation.em-dash"),
      ).text,
    ).toBe("The API (a small compatibility layer) handles it.");
  });

  test("supports explicit em dash strategies", () => {
    expect(
      humanize(
        "one — two",
        only("punctuation.em-dash", { enabled: true, strategy: "comma" }),
      ).text,
    ).toBe("one, two");
    expect(
      humanize(
        "one — two",
        only("punctuation.em-dash", { enabled: true, strategy: "preserve" }),
      ).text,
    ).toBe("one — two");
  });

  test("preserves numeric en-dash ranges in contextual mode", () => {
    expect(
      humanize("Pages 10–20 and north–south", only("punctuation.en-dash")).text,
    ).toBe("Pages 10–20 and north-south");
  });

  test("splits only formal-transition semicolons in aggressive mode", () => {
    expect(
      humanize("Simple; however, limited.", { preset: "aggressive" }).text,
    ).toBe("Simple. however, limited.");
    expect(
      humanize("Tel Aviv, Israel; Paris, France; Tokyo, Japan", {
        preset: "aggressive",
      }).text,
    ).toBe("Tel Aviv, Israel; Paris, France; Tokyo, Japan");
  });

  test("cleans bold list labels and heading separators", () => {
    const input =
      "- **Performance:** Fast.\n- **Scale:** Large.\n\n## One\n\n---\n## Two";
    expect(humanize(input).text).toBe(
      "- Performance: Fast.\n- Scale: Large.\n\n## One\n\n## Two",
    );
  });

  test("decorative heading cleanup is aggressive", () => {
    expect(humanize("## 🚀 Performance", { preset: "natural" }).text).toBe(
      "## 🚀 Performance",
    );
    expect(humanize("## 🚀 Performance", { preset: "aggressive" }).text).toBe(
      "## Performance",
    );
  });
});

describe("phrasing rules", () => {
  test("simplifies a structurally parallel not-only construction", () => {
    expect(
      humanize("The project is not only fast but also reliable.").text,
    ).toBe("The project is fast and reliable.");
  });

  test("keeps uncertain not-just contrasts as signals", () => {
    const input = "This isn't just a cache; it's a coordination layer.";
    const result = humanize(input);
    expect(result.text).toBe(input);
    expect(result.signals.map((signal) => signal.rule)).toContain(
      "phrasing.not-just",
    );
  });

  test("simplifies curated formal vocabulary with case and inflection", () => {
    const input =
      "In order to commence, utilize it due to the fact that it works at this point in time.";
    expect(humanize(input).text).toBe("To start, use it because it works now.");
  });

  test("only rewrites boasts before numeric specifications", () => {
    expect(
      humanize("The chip boasts 32 cores.", { preset: "aggressive" }).text,
    ).toBe("The chip has 32 cores.");
    expect(
      humanize("The town boasts a long history.", { preset: "aggressive" })
        .text,
    ).toBe("The town boasts a long history.");
  });

  test("simplifies or removes selected transitions by preset", () => {
    expect(humanize("Moreover, it works.").text).toBe("Also, it works.");
    expect(humanize("Moreover, it works.", { preset: "aggressive" }).text).toBe(
      "it works.",
    );
  });

  test("reports serves-as instead of rewriting it", () => {
    const result = humanize("The process serves as the parent process.");
    expect(result.text).toBe("The process serves as the parent process.");
    expect(result.signals.map((signal) => signal.rule)).toContain(
      "phrasing.serves-as",
    );
  });
});

describe("structural signals", () => {
  test("detects triples without deleting information", () => {
    const input = "It is fast, reliable, and scalable.";
    const result = humanize(input);
    expect(result.text).toBe(input);
    expect(result.signals.map((signal) => signal.rule)).toContain(
      "structure.rule-of-three",
    );
  });

  test("detects uniform one-sentence paragraphs", () => {
    const input =
      "One sentence.\n\nSecond sentence.\n\nThird sentence.\n\nFourth sentence.";
    expect(analyze(input).signals.map((signal) => signal.rule)).toContain(
      "structure.uniform-paragraphs",
    );
  });

  test("detects repeated transitions and excessive sectioning", () => {
    const transitions =
      "Additionally, one.\n\nMoreover, two.\n\nFurthermore, three.";
    expect(analyze(transitions).signals.map((signal) => signal.rule)).toContain(
      "structure.repeated-transitions",
    );
    const sections =
      "## A\nShort.\n\n## B\nShort.\n\n## C\nShort.\n\n## D\nShort.";
    expect(analyze(sections).signals.map((signal) => signal.rule)).toContain(
      "structure.excessive-sectioning",
    );
  });

  test("detects repetitive lists and adjective stacks", () => {
    const list = "- One item\n- Two item\n- Three item\n- Four item";
    expect(analyze(list).signals.map((signal) => signal.rule)).toContain(
      "structure.repetitive-list",
    );
    expect(
      analyze("A powerful, flexible, scalable solution.").signals.map(
        (signal) => signal.rule,
      ),
    ).toContain("structure.adjective-stack");
  });
});
