import { resolveRules } from "./config.js";
import { applyChanges, selectEdits, sortSignals } from "./edits.js";
import { overlapsProtected, scanProtectedRanges } from "./scanner.js";
import type {
  AnalyzeResult,
  HumanizeOptions,
  HumanizeResult,
  RuleContext,
  Signal,
} from "./types.js";

function createContext(
  text: string,
  protectedRanges: ReturnType<typeof scanProtectedRanges>,
  options: Record<string, unknown>,
): RuleContext<never> {
  return {
    text,
    protectedRanges,
    locale: "en",
    options: options as never,
    isProtected: (range) => overlapsProtected(range, protectedRanges),
  };
}

export function runTransform(
  text: string,
  options: HumanizeOptions = {},
): HumanizeResult {
  const resolved = resolveRules(options);
  const protectedRanges = scanProtectedRanges(text);
  const proposals = [];
  const signals: Signal[] = [];

  for (let order = 0; order < resolved.length; order++) {
    const entry = resolved[order];
    if (!entry) continue;
    const context = createContext(text, protectedRanges, entry.options);
    for (const edit of entry.rule.transform?.(context) ?? [])
      proposals.push({ rule: entry.rule, edit, order });
    for (const signal of entry.rule.detect?.(context) ?? []) {
      signals.push({
        rule: entry.rule.id,
        category: entry.rule.category,
        confidence: signal.confidence ?? entry.rule.confidence,
        range: signal.range,
        text: text.slice(signal.range.start, signal.range.end),
        ...(signal.explanation ? { explanation: signal.explanation } : {}),
      });
    }
  }
  const changes = selectEdits(text, proposals);
  return {
    text: applyChanges(text, changes),
    changes,
    signals: sortSignals(signals),
  };
}

export function runAnalysis(
  text: string,
  options: HumanizeOptions = {},
): AnalyzeResult {
  const signals: Signal[] = [];
  const protectedRanges = scanProtectedRanges(text);
  for (const entry of resolveRules(options)) {
    const context = createContext(text, protectedRanges, entry.options);
    const findings = [
      ...(entry.rule.transform?.(context) ?? []),
      ...(entry.rule.detect?.(context) ?? []),
    ];
    for (const finding of findings) {
      signals.push({
        rule: entry.rule.id,
        category: entry.rule.category,
        confidence: finding.confidence ?? entry.rule.confidence,
        range: finding.range,
        text: text.slice(finding.range.start, finding.range.end),
        ...(finding.explanation ? { explanation: finding.explanation } : {}),
      });
    }
  }
  const unique = new Map(
    signals.map((signal) => [
      `${signal.rule}:${signal.range.start}:${signal.range.end}`,
      signal,
    ]),
  );
  return { text, signals: sortSignals([...unique.values()]) };
}
