import { regexEdits } from "../core/match.js";
import type { AnyRuleDefinition } from "../core/types.js";

export const whitespaceRules = [
  {
    id: "whitespace.trailing",
    category: "whitespace",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /[\t ]+(?=\r?$)/gm,
        "",
        "Removed trailing horizontal whitespace.",
      ),
  },
] satisfies AnyRuleDefinition[];
