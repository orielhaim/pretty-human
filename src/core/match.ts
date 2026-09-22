import type {
  ProposedEdit,
  ProposedSignal,
  RuleContext,
  TextRange,
} from "./types.js";

export function regexEdits<O>(
  context: RuleContext<O>,
  expression: RegExp,
  replacement: string | ((match: RegExpExecArray) => string),
  explanation?: string,
): ProposedEdit[] {
  const edits: ProposedEdit[] = [];
  expression.lastIndex = 0;
  for (const match of context.text.matchAll(expression)) {
    const range = { start: match.index, end: match.index + match[0].length };
    if (!context.isProtected(range)) {
      const value =
        typeof replacement === "string" ? replacement : replacement(match);
      if (value !== match[0])
        edits.push({
          range,
          replacement: value,
          ...(explanation ? { explanation } : {}),
        });
    }
  }
  return edits;
}

export function regexSignals<O>(
  context: RuleContext<O>,
  expression: RegExp,
  explanation?: string,
): ProposedSignal[] {
  const signals: ProposedSignal[] = [];
  expression.lastIndex = 0;
  for (const match of context.text.matchAll(expression)) {
    const range: TextRange = {
      start: match.index,
      end: match.index + match[0].length,
    };
    if (!context.isProtected(range))
      signals.push({ range, ...(explanation ? { explanation } : {}) });
  }
  return signals;
}
