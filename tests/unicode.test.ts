import { describe, expect, test } from "bun:test";
import { humy } from "../src/index.js";

const custom = (
  ...ids: Array<
    | "unicode.bom"
    | "unicode.zero-width-space"
    | "unicode.soft-hyphen"
    | "unicode.nbsp"
    | "unicode.spacing"
    | "unicode.smart-quotes"
    | "unicode.ellipsis"
    | "unicode.non-breaking-hyphen"
    | "unicode.bidi-control"
  >
) => ({
  preset: false as const,
  rules: Object.fromEntries(ids.map((id) => [id, true])),
});

describe("Unicode rules", () => {
  test("normalizes common quote forms and apostrophes", () => {
    expect(
      humy(
        "“hello” „world” «yes» it’s ‘fine’ ʼkay",
        custom("unicode.smart-quotes"),
      ).text,
    ).toBe('"hello" "world" "yes" it\'s \'fine\' \'kay');
  });

  test("quote normalization can be configured to preserve", () => {
    expect(
      humy("“hello”", {
        preset: false,
        rules: { "unicode.smart-quotes": { enabled: true, style: "preserve" } },
      }).text,
    ).toBe("“hello”");
  });

  test("normalizes ellipsis, non-breaking hyphen, BOM, soft hyphen, and NBSP", () => {
    const input = "\uFEFFreal\u2011time\u00A0work\u00ADflow…";
    expect(humy(input, { preset: "safe" }).text).toBe("real-time workflow...");
  });

  test("exposes NBSP as an independently configurable stable rule", () => {
    expect(humy("hello\u00A0world…", custom("unicode.nbsp")).text).toBe(
      "hello world…",
    );
  });

  test("preserves typography spacing used as numeric grouping", () => {
    expect(
      humy("10\u202F000 and hello\u202Fworld", custom("unicode.spacing")).text,
    ).toBe("10\u202F000 and hello world");
  });

  test("removes an isolated Latin-context ZWSP but preserves script-sensitive use", () => {
    expect(humy("hel\u200Blo", custom("unicode.zero-width-space")).text).toBe(
      "hello",
    );
    expect(humy("ภาษา\u200Bไทย", custom("unicode.zero-width-space")).text).toBe(
      "ภาษา\u200Bไทย",
    );
  });

  test("preserves emoji ZWJ sequences and Indic ZWNJ", () => {
    const text = "Family 👨‍👩‍👧‍👦; Persian می‌خواهم; Hindi क्‍ष";
    expect(humy(text, { preset: "safe" }).text).toBe(text);
  });

  test("preserves bidi controls by default and reports them in natural", () => {
    const text = "עברית \u2067English\u2069";
    const result = humy(text, { preset: "natural" });
    expect(result.text).toBe(text);
    expect(
      result.signals.some((signal) => signal.rule === "unicode.bidi-control"),
    ).toBe(true);
  });

  test("explicit bidi removal remains available", () => {
    expect(
      humy("a\u2067b\u2069", {
        preset: false,
        rules: {
          "unicode.bidi-control": { enabled: true, removeIsolated: true },
        },
      }).text,
    ).toBe("ab");
  });
});
