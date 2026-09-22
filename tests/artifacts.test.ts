import { describe, expect, test } from "bun:test";
import { humy } from "../src/index.js";

describe("model and UI artifact cleanup", () => {
  test.each([
    [
      "See turn0search0 for details.",
      "See  for details.",
      "artifact.chatgpt-citation",
    ],
    ["Text oai_citation more", "Text  more", "artifact.chatgpt-citation"],
    ["Text contentReference more", "Text  more", "artifact.chatgpt-citation"],
    [
      "Text [span_1](start_span) more",
      "Text  more",
      "artifact.gemini-citation",
    ],
    ["Text attributableIndex more", "Text  more", "artifact.gemini-citation"],
    [
      "Text grok_render_citation_card_json more",
      "Text  more",
      "artifact.grok-card",
    ],
    ["Text ppl-ai-file-upload more", "Text  more", "artifact.perplexity"],
    ["Text [cite: 1, 2] more", "Text  more", "artifact.placeholder"],
  ] as const)("cleans %s", (input, output, rule) => {
    const result = humy(input, { preset: "safe" });
    expect(result.text).toBe(output);
    expect(result.changes[0]?.rule).toBe(rule);
  });

  test("removes structural response wrappers", () => {
    const input =
      "Sure! Here's a polished version:\n\nThe actual text.\n\nIf you’d like, I can make it shorter.";
    const result = humy(input);
    expect(result.text).toBe("The actual text.\n\n");
    expect(result.changes.map((change) => change.rule)).toEqual([
      "artifact.response-preamble",
      "artifact.response-closing",
    ]);
  });

  test("safe does not remove response framing", () => {
    const input = "Here is a revised version:\nText.";
    expect(humy(input, { preset: "safe" }).text).toBe(input);
  });

  test("ordinary uses of citation words survive", () => {
    const input =
      "The citation needed careful review, and the attached file was useful.";
    expect(humy(input, { preset: "safe" }).text).toBe(input);
  });
});
