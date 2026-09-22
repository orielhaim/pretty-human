import { runAnalysis, runTransform } from "./core/engine.js";
import type {
  AnalyzeResult,
  HumyOptions,
  HumyResult,
  RuleMetadata,
} from "./core/types.js";
import { presets } from "./presets/index.js";
import { registry } from "./rules/registry.js";

export function humy(text: string, options?: HumyOptions): HumyResult {
  return runTransform(text, options);
}

export const transform = humy;

export function analyze(text: string, options?: HumyOptions): AnalyzeResult {
  return runAnalysis(text, options);
}

export { presets };

/** Read-only metadata for built-in rules. Execution functions remain internal. */
export const rules: readonly RuleMetadata[] = Object.freeze(
  registry.map(({ id, category, confidence }) =>
    Object.freeze({ id, category, confidence }),
  ),
);

export type {
  AnalyzeResult,
  Change,
  Confidence,
  EmDashStrategy,
  EnDashStrategy,
  HumyOptions,
  HumyResult,
  PresetName,
  QuoteStyle,
  RuleCategory,
  RuleId,
  RuleMetadata,
  RuleOptionsMap,
  RuleSetting,
  RuleSettings,
  Signal,
  TextRange,
  TransitionStrategy,
} from "./core/types.js";
