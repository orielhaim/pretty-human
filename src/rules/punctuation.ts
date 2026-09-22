import { regexEdits, regexSignals } from "../core/match.js";
import type { AnyRuleDefinition, ProposedEdit } from "../core/types.js";

export const punctuationRules = [
  {
    id: "punctuation.em-dash",
    category: "punctuation",
    confidence: "high",
    defaultOptions: { strategy: "contextual" },
    transform: (context) => {
      const strategy = context.options.strategy ?? "contextual";
      if (strategy === "preserve") return [];
      if (strategy === "hyphen")
        return regexEdits(
          context,
          /\s*—\s*/gu,
          " - ",
          "Normalized an em dash to a spaced hyphen.",
        );
      if (strategy === "comma")
        return regexEdits(
          context,
          /\s*—\s*/gu,
          ", ",
          "Normalized an em dash to a comma.",
        );

      const edits: ProposedEdit[] = [];
      const paired =
        /([\p{L}\p{N})])\s+—\s+([^—\r\n.!?]{1,60}?)\s+—\s+([\p{L}\p{N}(])/gu;
      for (const match of context.text.matchAll(paired)) {
        const range = {
          start: match.index,
          end: match.index + match[0].length,
        };
        if (!context.isProtected(range)) {
          edits.push({
            range,
            replacement: `${match[1]} (${match[2]?.trim()}) ${match[3]}`,
            explanation: "Converted a short paired aside to parentheses.",
          });
        }
      }
      const conjunction = /\s+—\s+(?=(?:but|yet|although|though|while)\b)/giu;
      for (const edit of regexEdits(
        context,
        conjunction,
        ", ",
        "Converted an em dash before a conjunction to a comma.",
      )) {
        edits.push(edit);
      }
      const causal = /\s+—\s+(?=(?:because|since)\b)/giu;
      for (const edit of regexEdits(
        context,
        causal,
        " ",
        "Removed an em dash before a causal clause.",
      )) {
        edits.push(edit);
      }
      for (const edit of regexEdits(
        context,
        /\s+—\s+/gu,
        ", ",
        "Normalized an ambiguous prose em dash to a comma.",
      )) {
        edits.push(edit);
      }
      return edits;
    },
  },
  {
    id: "punctuation.en-dash",
    category: "punctuation",
    confidence: "high",
    defaultOptions: { strategy: "contextual" },
    transform: (context) => {
      const strategy = context.options.strategy ?? "contextual";
      if (strategy === "preserve") return [];
      if (strategy === "hyphen")
        return regexEdits(context, /–/gu, "-", "Normalized an en dash.");
      const edits: ProposedEdit[] = [];
      for (const match of context.text.matchAll(/–/gu)) {
        const index = match.index;
        const range = { start: index, end: index + 1 };
        const numericRange =
          /\d/u.test(context.text[index - 1] ?? "") &&
          /\d/u.test(context.text[index + 1] ?? "");
        if (!numericRange && !context.isProtected(range))
          edits.push({
            range,
            replacement: "-",
            explanation: "Normalized an en dash outside a numeric range.",
          });
      }
      return edits;
    },
  },
  {
    id: "punctuation.semicolon",
    category: "punctuation",
    confidence: "medium",
    defaultOptions: { splitHowever: false },
    transform: (context) =>
      context.options.splitHowever
        ? regexEdits(
            context,
            /;\s+(?=(?:however|nevertheless|nonetheless),)/giu,
            ". ",
            "Split a formal semicolon transition into two sentences.",
          )
        : [],
    detect: (context) =>
      regexSignals(
        context,
        /;\s+(?=(?:however|nevertheless|nonetheless),)/giu,
        "A semicolon before a formal transition may create an overly formal cadence.",
      ),
  },
] satisfies AnyRuleDefinition[];
