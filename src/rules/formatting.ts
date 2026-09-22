import { regexEdits, regexSignals } from "../core/match.js";
import type { AnyRuleDefinition } from "../core/types.js";

export const formattingRules = [
  {
    id: "formatting.bold-label-list",
    category: "formatting",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /^([ \t]*(?:[-+*]|\d+[.)])[ \t]+)\*\*([^*\r\n:]{1,60}:)\*\*/gmu,
        (match) => `${match[1]}${match[2]}`,
        "Removed repetitive bold markup from a list label.",
      ),
  },
  {
    id: "formatting.horizontal-rule",
    category: "formatting",
    confidence: "medium",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\r?\n[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*\r?\n(?=[ \t]*#{1,6}\s)/gu,
        (match) => (match[0].startsWith("\r\n") ? "\r\n" : "\n"),
        "Removed a horizontal rule between Markdown sections.",
      ),
  },
  {
    id: "formatting.decorative-heading",
    category: "formatting",
    confidence: "medium",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /^(\s*#{1,6}\s+)(?:\p{Extended_Pictographic}\uFE0F?)+\s+/gmu,
        (match) => match[1] ?? "",
        "Removed decorative emoji from a Markdown heading.",
      ),
    detect: (context) =>
      regexSignals(
        context,
        /^(?:\s*#{1,6}\s+)?(?:\p{Extended_Pictographic}\uFE0F?)+\s+[^\r\n]+$/gmu,
        "A decorative heading can be a generated formatting pattern.",
      ),
  },
] satisfies AnyRuleDefinition[];
