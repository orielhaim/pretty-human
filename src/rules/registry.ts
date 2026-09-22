import type { AnyRuleDefinition } from "../core/types.js";
import { artifactDetectors, artifactRules } from "./artifact.js";
import { formattingRules } from "./formatting.js";
import { phrasingRules } from "./phrasing.js";
import { punctuationRules } from "./punctuation.js";
import { structureRules } from "./structure.js";
import { unicodeRules } from "./unicode.js";
import { whitespaceRules } from "./whitespace.js";

/** Stable execution order. Earlier rules win when proposed edits overlap. */
export const registry: readonly AnyRuleDefinition[] = [
  ...unicodeRules,
  ...whitespaceRules,
  ...artifactRules,
  ...formattingRules,
  ...artifactDetectors,
  ...punctuationRules,
  ...phrasingRules,
  ...structureRules,
];
