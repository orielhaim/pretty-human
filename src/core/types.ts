export type Confidence = "certain" | "high" | "medium" | "low";

export type RuleCategory =
  | "unicode"
  | "whitespace"
  | "punctuation"
  | "formatting"
  | "artifact"
  | "phrasing"
  | "structure";

export interface TextRange {
  /** UTF-16 offset, matching JavaScript String#slice. */
  start: number;
  /** Exclusive UTF-16 offset. */
  end: number;
}

export interface Change {
  rule: RuleId;
  category: RuleCategory;
  original: string;
  replacement: string;
  /** Range in the original input. */
  range: TextRange;
  confidence: Confidence;
  explanation?: string;
}

export interface Signal {
  rule: RuleId;
  category: RuleCategory;
  confidence: Confidence;
  range: TextRange;
  text: string;
  explanation?: string;
}

export type EmDashStrategy = "contextual" | "hyphen" | "comma" | "preserve";
export type EnDashStrategy = "contextual" | "hyphen" | "preserve";
export type QuoteStyle = "ascii" | "preserve";
export type TransitionStrategy = "simplify" | "remove" | "preserve";

export interface RuleOptionsMap {
  "unicode.bom": never;
  "unicode.zero-width-space": never;
  "unicode.soft-hyphen": never;
  "unicode.nbsp": never;
  "unicode.spacing": never;
  "unicode.smart-quotes": { style?: QuoteStyle };
  "unicode.ellipsis": never;
  "unicode.non-breaking-hyphen": never;
  "unicode.bidi-control": { removeIsolated?: boolean };
  "whitespace.trailing": never;
  "punctuation.em-dash": { strategy?: EmDashStrategy };
  "punctuation.en-dash": { strategy?: EnDashStrategy };
  "punctuation.semicolon": { splitHowever?: boolean };
  "artifact.chatgpt-citation": never;
  "artifact.gemini-citation": never;
  "artifact.grok-card": never;
  "artifact.perplexity": never;
  "artifact.placeholder": never;
  "artifact.response-preamble": never;
  "artifact.response-closing": never;
  "formatting.bold-label-list": never;
  "formatting.excessive-bold": never;
  "formatting.horizontal-rule": never;
  "formatting.decorative-heading": never;
  "phrasing.not-just": never;
  "phrasing.not-only": never;
  "phrasing.utilize": never;
  "phrasing.formal-vocabulary": never;
  "phrasing.serves-as": never;
  "phrasing.boasts": never;
  "phrasing.transition-word": { strategy?: TransitionStrategy };
  "structure.rule-of-three": never;
  "structure.repetitive-list": never;
  "structure.uniform-paragraphs": never;
  "structure.repeated-transitions": never;
  "structure.excessive-sectioning": never;
  "structure.adjective-stack": never;
}

export type RuleId = keyof RuleOptionsMap;
export type PresetName = "safe" | "natural" | "aggressive";

export type RuleSetting<K extends RuleId> = RuleOptionsMap[K] extends never
  ? boolean | { enabled: boolean }
  : boolean | ({ enabled: boolean } & RuleOptionsMap[K]);

export type RuleSettings = { [K in RuleId]?: RuleSetting<K> };

export interface HumanizeOptions {
  /** `natural` by default. Use false to enable only explicitly configured rules. */
  preset?: PresetName | false;
  rules?: RuleSettings;
  /** English style rules are currently the only locale-specific rules. */
  locale?: "en" | "auto";
}

export interface HumanizeResult {
  text: string;
  changes: Change[];
  signals: Signal[];
}

export interface AnalyzeResult {
  text: string;
  signals: Signal[];
}

export interface RuleMetadata {
  readonly id: RuleId;
  readonly category: RuleCategory;
  readonly confidence: Confidence;
}

export interface RuleContext<O = unknown> {
  text: string;
  protectedRanges: readonly TextRange[];
  locale: "en";
  options: O;
  isProtected(range: TextRange): boolean;
}

export interface ProposedEdit {
  range: TextRange;
  replacement: string;
  confidence?: Confidence;
  explanation?: string;
}

export interface ProposedSignal {
  range: TextRange;
  confidence?: Confidence;
  explanation?: string;
}

export interface RuleDefinition<K extends RuleId> {
  id: K;
  category: RuleCategory;
  confidence: Confidence;
  defaultOptions: RuleOptionsMap[K] extends never
    ? Record<string, never>
    : RuleOptionsMap[K];
  transform?: (context: RuleContext<RuleOptionsMap[K]>) => ProposedEdit[];
  detect?: (context: RuleContext<RuleOptionsMap[K]>) => ProposedSignal[];
}

export type AnyRuleDefinition = { [K in RuleId]: RuleDefinition<K> }[RuleId];
