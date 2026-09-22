import type { TextRange } from "./types.js";

const URL = /\b(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()]+/giu;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const WINDOWS_PATH = /(?<![\w/])(?:[A-Z]:\\|\\\\)[^\s<>:"|?*]+/giu;
const UNIX_PATH = /(?<![\w/])(?:\.{0,2}\/|~\/|\/)[\w.@+~-]+(?:\/[\w.@+~-]+)+/gu;
const HTML_TAG = /<\/?[A-Za-z][^>]*>/gu;
const LINK_DESTINATION = /\]\((?:\\.|[^)\s])+(?:\s+["'][^"']*["'])?\)/gu;

function pushMatches(
  text: string,
  expression: RegExp,
  ranges: TextRange[],
): void {
  expression.lastIndex = 0;
  for (const match of text.matchAll(expression)) {
    const start = match.index ?? 0;
    ranges.push({ start, end: start + match[0].length });
  }
}

function mergeRanges(ranges: TextRange[]): TextRange[] {
  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: TextRange[] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range.start <= previous.end)
      previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** Finds regions where prose rules must not operate. Offsets are UTF-16 code units. */
export function scanProtectedRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  const fence = /^( {0,3})(`{3,}|~{3,})[^\r\n]*(?:\r?\n|$)/gm;
  let match = fence.exec(text);
  while (match) {
    const marker = match[2];
    if (!marker) continue;
    const close = new RegExp(
      `^(?: {0,3})${marker[0]}{${marker.length},}\\s*$`,
      "gm",
    );
    close.lastIndex = fence.lastIndex;
    const closing = close.exec(text);
    const end = closing ? closing.index + closing[0].length : text.length;
    ranges.push({ start: match.index, end });
    fence.lastIndex = end;
    match = fence.exec(text);
  }

  const code = /(`+)(?!`)([^\r\n]*?)\1(?!`)/g;
  match = code.exec(text);
  while (match) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
    match = code.exec(text);
  }

  for (const expression of [URL, EMAIL, WINDOWS_PATH, UNIX_PATH, HTML_TAG]) {
    pushMatches(text, expression, ranges);
  }
  LINK_DESTINATION.lastIndex = 0;
  for (const link of text.matchAll(LINK_DESTINATION)) {
    const base = link.index ?? 0;
    const labelStart = text.lastIndexOf("[", base);
    const label = labelStart >= 0 ? text.slice(labelStart, base + 1) : "";
    if (/^\[span_\d+\]$/u.test(label) && link[0] === "](start_span)") continue;
    ranges.push({ start: base + 2, end: base + link[0].length - 1 });
  }
  return mergeRanges(ranges);
}

export function overlapsProtected(
  range: TextRange,
  protectedRanges: readonly TextRange[],
): boolean {
  let low = 0;
  let high = protectedRanges.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    const candidate = protectedRanges[middle];
    if (candidate && candidate.end <= range.start) low = middle + 1;
    else high = middle;
  }
  const candidate = protectedRanges[low];
  return candidate !== undefined && candidate.start < range.end;
}
