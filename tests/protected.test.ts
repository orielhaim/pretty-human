import { describe, expect, test } from "bun:test";
import { humy } from "../src/index.js";

describe("protected regions", () => {
  test("preserves fenced and inline code", () => {
    const input =
      "It’s prose…\n\n```ts\nconst x = 'It’s… — [cite: 1]';\n```\n\nUse `It’s… — [cite: 1]`.";
    const result = humy(input, { preset: "natural" }).text;
    expect(result).toContain("It's prose...");
    expect(result).toContain("const x = 'It’s… — [cite: 1]';");
    expect(result).toContain("`It’s… — [cite: 1]`");
  });

  test("preserves URLs, email addresses, and paths", () => {
    const input =
      "Visit https://example.com/a—b?q=it’s or mail a—b@example.com. Open C:\\docs\\a—b.ts and /usr/local/a—b.";
    expect(humy(input).text).toBe(input);
  });

  test("preserves Markdown link destinations but edits visible labels", () => {
    const input = "[It’s useful…](https://example.com/it’s—a)";
    expect(humy(input, { preset: "safe" }).text).toBe(
      "[It's useful...](https://example.com/it’s—a)",
    );
  });

  test("preserves HTML tags and attributes while editing text nodes", () => {
    const input = '<span title="It’s — safe">It’s useful…</span>';
    expect(humy(input, { preset: "safe" }).text).toBe(
      '<span title="It’s — safe">It\'s useful...</span>',
    );
  });

  test("does not remove artifact-like source examples in code", () => {
    const input = "`turn0search0`\n\n```txt\ngrok_card [cite: 1]\n```";
    expect(humy(input, { preset: "safe" }).text).toBe(input);
  });

  test("does not treat blockquoted wrapper examples as wrappers", () => {
    const input = "> Here is a revised version:\n\nText.";
    expect(humy(input).text).toBe(input);
  });
});
