import { describe, expect, test } from "bun:test";
import { humanize } from "../src/index.js";

describe("engine invariants", () => {
  test("change offsets refer to the original input", () => {
    const input = "It’s fast — but costly…";
    const result = humanize(input);
    for (const change of result.changes)
      expect(input.slice(change.range.start, change.range.end)).toBe(
        change.original,
      );
    expect(
      result.changes.every(
        (change, index, all) =>
          index === 0 || (all[index - 1]?.range.end ?? 0) <= change.range.start,
      ),
    ).toBe(true);
  });

  test("multiple interacting rules remain idempotent", () => {
    const input =
      "Sure! Here's a polished version:\r\n\r\n- **Performance:** It’s fast — but it utilizes resources…  \r\n\r\nLet me know if you’d like more.\r\n";
    for (const preset of ["safe", "natural", "aggressive"] as const) {
      const once = humanize(input, { preset }).text;
      expect(humanize(once, { preset }).text).toBe(once);
    }
  });

  test("keeps mixed CRLF and LF delimiters unless a targeted rule changes them", () => {
    const input = "One.\r\nTwo.\nThree.\r\n";
    expect(humanize(input, { preset: "safe" }).text).toBe(input);
  });

  test("handles a large document without losing content", () => {
    const unit = "Plain content with no configured markers.\n";
    const input = unit.repeat(30_000);
    expect(input.length).toBeGreaterThan(1_000_000);
    expect(humanize(input, { preset: "safe" }).text).toBe(input);
  });

  test("does not crash on deterministic arbitrary Unicode", () => {
    let state = 0x12345678;
    const next = () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state;
    };
    for (let sample = 0; sample < 200; sample++) {
      let input = "";
      for (let index = 0; index < 100; index++) {
        const point = next() % 0x110000;
        if (point < 0xd800 || point > 0xdfff)
          input += String.fromCodePoint(point);
      }
      const once = humanize(input, { preset: "safe" }).text;
      expect(typeof once).toBe("string");
      expect(humanize(once, { preset: "safe" }).text).toBe(once);
    }
  });
});
