import { describe, expect, test } from "bun:test";
import {
  analyze,
  type HumanizeOptions,
  humanize,
  presets,
  rules,
  transform,
} from "../src/index.js";

describe("configuration and public API", () => {
  test("natural is the default preset", () => {
    expect(humanize("It is fast — but costly.").text).toBe(
      "It is fast, but costly.",
    );
    expect(humanize("It is fast — but costly.")).toEqual(
      humanize("It is fast — but costly.", { preset: "natural" }),
    );
  });

  test("safe avoids stylistic rewriting", () => {
    expect(humanize("It’s fast — but costly…", { preset: "safe" }).text).toBe(
      "It's fast — but costly...",
    );
  });

  test("preset rules can be disabled", () => {
    const result = humanize("It’s fast — but costly.", {
      preset: "natural",
      rules: { "punctuation.em-dash": false },
    });
    expect(result.text).toBe("It's fast — but costly.");
    expect(
      result.changes.some((change) => change.rule === "punctuation.em-dash"),
    ).toBe(false);
  });

  test("preset rules accept inferred options", () => {
    const options: HumanizeOptions = {
      preset: "safe",
      rules: { "punctuation.em-dash": { enabled: true, strategy: "hyphen" } },
    };
    expect(humanize("one — two", options).text).toBe("one - two");
  });

  test("fully custom mode enables only selected rules", () => {
    const result = humanize("It’s fine… — really", {
      preset: false,
      rules: { "unicode.smart-quotes": true, "unicode.ellipsis": true },
    });
    expect(result.text).toBe("It's fine... — really");
    expect(result.changes.map((change) => change.rule)).toEqual([
      "unicode.smart-quotes",
      "unicode.ellipsis",
    ]);
  });

  test("transform is an alias and analyze never mutates", () => {
    expect(transform).toBe(humanize);
    const result = analyze("It’s fast — but costly.");
    expect(result.text).toBe("It’s fast — but costly.");
    expect(result.signals.map((signal) => signal.rule)).toContain(
      "unicode.smart-quotes",
    );
  });

  test("public rule and preset metadata are available", () => {
    expect(rules.some((rule) => rule.id === "unicode.bom")).toBe(true);
    expect(presets.safe["unicode.bom"]).toBe(true);
  });

  test("empty and no-op input stay unchanged", () => {
    expect(humanize("")).toEqual({ text: "", changes: [], signals: [] });
    expect(humanize("Plain text.", { preset: "safe" })).toEqual({
      text: "Plain text.",
      changes: [],
      signals: [],
    });
  });
});
