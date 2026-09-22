import { regexEdits, regexSignals } from "../core/match.js";
import type { AnyRuleDefinition, ProposedEdit } from "../core/types.js";

const invisibleExplanation =
  "Removed a formatting control that is not meaningful in this context.";

export const unicodeRules = [
  {
    id: "unicode.bom",
    category: "unicode",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\uFEFF/gu,
        "",
        "Removed a byte-order mark from text.",
      ),
  },
  {
    id: "unicode.zero-width-space",
    category: "unicode",
    confidence: "high",
    defaultOptions: {},
    transform: (context) => {
      const edits: ProposedEdit[] = [];
      for (
        let index = context.text.indexOf("\u200B");
        index >= 0;
        index = context.text.indexOf("\u200B", index + 1)
      ) {
        const before = context.text[index - 1] ?? "";
        const after = context.text[index + 1] ?? "";
        const safeContext =
          /[\p{ASCII}\s\p{P}\p{S}]/u.test(before) ||
          /[\p{ASCII}\s\p{P}\p{S}]/u.test(after);
        const range = { start: index, end: index + 1 };
        if (safeContext && !context.isProtected(range))
          edits.push({
            range,
            replacement: "",
            explanation: invisibleExplanation,
          });
      }
      return edits;
    },
  },
  {
    id: "unicode.soft-hyphen",
    category: "unicode",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\u00AD/gu,
        "",
        "Removed a discretionary soft hyphen.",
      ),
  },
  {
    id: "unicode.nbsp",
    category: "unicode",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(context, /\u00A0/gu, " ", "Normalized a non-breaking space."),
  },
  {
    id: "unicode.spacing",
    category: "unicode",
    confidence: "high",
    defaultOptions: {},
    transform: (context) => {
      const edits: ProposedEdit[] = [];
      const expression = /[\u2007\u2009\u202F]/gu;
      for (const match of context.text.matchAll(expression)) {
        const range = { start: match.index, end: match.index + 1 };
        const numericGrouping =
          /\d/u.test(context.text[match.index - 1] ?? "") &&
          /\d/u.test(context.text[match.index + 1] ?? "");
        if (!numericGrouping && !context.isProtected(range)) {
          edits.push({
            range,
            replacement: " ",
            explanation: "Normalized a typography-only space.",
          });
        }
      }
      return edits;
    },
  },
  {
    id: "unicode.smart-quotes",
    category: "unicode",
    confidence: "certain",
    defaultOptions: { style: "ascii" },
    transform: (context) =>
      context.options.style === "preserve"
        ? []
        : regexEdits(
            context,
            /[“”„‟«»‘’‚‛ʼ]/gu,
            (match) => (/[‘’‚‛ʼ]/u.test(match[0]) ? "'" : '"'),
            "Normalized a typographic quote or apostrophe.",
          ),
  },
  {
    id: "unicode.ellipsis",
    category: "unicode",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(context, /…/gu, "...", "Normalized the ellipsis character."),
  },
  {
    id: "unicode.non-breaking-hyphen",
    category: "unicode",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(context, /\u2011/gu, "-", "Normalized a non-breaking hyphen."),
  },
  {
    id: "unicode.bidi-control",
    category: "unicode",
    confidence: "low",
    defaultOptions: { removeIsolated: false },
    transform: (context) =>
      context.options.removeIsolated
        ? regexEdits(
            context,
            /[\u202A-\u202E\u2066-\u2069]/gu,
            "",
            "Removed an explicit bidirectional control.",
          )
        : [],
    detect: (context) =>
      regexSignals(
        context,
        /[\u202A-\u202E\u2066-\u2069]/gu,
        "Explicit bidirectional controls can be meaningful; they were preserved.",
      ),
  },
] satisfies AnyRuleDefinition[];
