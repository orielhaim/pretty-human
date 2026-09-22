import type { RuleId, RuleSettings } from "../core/types.js";

const safe = {
  "unicode.bom": true,
  "unicode.zero-width-space": true,
  "unicode.soft-hyphen": true,
  "unicode.nbsp": true,
  "unicode.spacing": true,
  "unicode.smart-quotes": true,
  "unicode.ellipsis": true,
  "unicode.non-breaking-hyphen": true,
  "whitespace.trailing": true,
  "artifact.chatgpt-citation": true,
  "artifact.gemini-citation": true,
  "artifact.grok-card": true,
  "artifact.perplexity": true,
  "artifact.placeholder": true,
} satisfies RuleSettings;

const natural = {
  ...safe,
  "unicode.bidi-control": true,
  "punctuation.em-dash": { enabled: true, strategy: "contextual" },
  "punctuation.en-dash": { enabled: true, strategy: "contextual" },
  "punctuation.semicolon": true,
  "artifact.response-preamble": true,
  "artifact.response-closing": true,
  "formatting.bold-label-list": true,
  "formatting.excessive-bold": true,
  "formatting.horizontal-rule": true,
  "phrasing.not-just": true,
  "phrasing.not-only": true,
  "phrasing.utilize": true,
  "phrasing.formal-vocabulary": true,
  "phrasing.serves-as": true,
  "phrasing.transition-word": { enabled: true, strategy: "simplify" },
  "structure.rule-of-three": true,
  "structure.repetitive-list": true,
  "structure.uniform-paragraphs": true,
  "structure.repeated-transitions": true,
  "structure.excessive-sectioning": true,
  "structure.adjective-stack": true,
} satisfies RuleSettings;

const aggressive = {
  ...natural,
  "punctuation.semicolon": { enabled: true, splitHowever: true },
  "formatting.decorative-heading": true,
  "phrasing.boasts": true,
  "phrasing.transition-word": { enabled: true, strategy: "remove" },
} satisfies RuleSettings;

export const presets = Object.freeze({
  safe: Object.freeze(safe),
  natural: Object.freeze(natural),
  aggressive: Object.freeze(aggressive),
});

export type PresetRuleMap = Partial<Record<RuleId, RuleSettings[RuleId]>>;
