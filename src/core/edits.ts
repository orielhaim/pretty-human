import type {
  AnyRuleDefinition,
  Change,
  ProposedEdit,
  Signal,
} from "./types.js";

export function selectEdits(
  text: string,
  proposals: Array<{
    rule: AnyRuleDefinition;
    edit: ProposedEdit;
    order: number;
  }>,
): Change[] {
  proposals.sort(
    (a, b) =>
      a.edit.range.start - b.edit.range.start ||
      a.order - b.order ||
      b.edit.range.end - a.edit.range.end,
  );
  const changes: Change[] = [];
  let occupiedUntil = -1;
  for (const { rule, edit } of proposals) {
    if (edit.range.start < occupiedUntil || edit.range.end < edit.range.start)
      continue;
    const original = text.slice(edit.range.start, edit.range.end);
    if (original === edit.replacement) continue;
    changes.push({
      rule: rule.id,
      category: rule.category,
      original,
      replacement: edit.replacement,
      range: edit.range,
      confidence: edit.confidence ?? rule.confidence,
      ...(edit.explanation ? { explanation: edit.explanation } : {}),
    });
    occupiedUntil = edit.range.end;
  }
  return changes;
}

export function applyChanges(text: string, changes: readonly Change[]): string {
  if (changes.length === 0) return text;
  const output: string[] = [];
  let cursor = 0;
  for (const change of changes) {
    output.push(text.slice(cursor, change.range.start), change.replacement);
    cursor = change.range.end;
  }
  output.push(text.slice(cursor));
  return output.join("");
}

export function sortSignals(signals: Signal[]): Signal[] {
  return signals.sort(
    (a, b) => a.range.start - b.range.start || a.range.end - b.range.end,
  );
}
