import { regexSignals } from "../core/match.js";
import type {
  AnyRuleDefinition,
  ProposedSignal,
  RuleContext,
} from "../core/types.js";

function wholeRange(
  context: RuleContext,
  explanation: string,
): ProposedSignal[] {
  return context.text.length === 0
    ? []
    : [{ range: { start: 0, end: context.text.length }, explanation }];
}

export const structureRules = [
  {
    id: "structure.rule-of-three",
    category: "structure",
    confidence: "low",
    defaultOptions: {},
    detect: (context) =>
      regexSignals(
        context,
        /\b[^,;.!?\r\n]{1,30},\s+[^,;.!?\r\n]{1,30},\s+(?:and|or)\s+[^,;.!?\r\n]{1,30}(?=[,;.!?]|$)/giu,
        "A three-part parallel list can contribute to formulaic cadence when repeated.",
      ),
  },
  {
    id: "structure.repetitive-list",
    category: "structure",
    confidence: "low",
    defaultOptions: {},
    detect: (context) => {
      const items = [
        ...context.text.matchAll(/^\s*(?:[-+*]|\d+[.)])\s+[^\r\n]+$/gmu),
      ].filter(
        (match) =>
          !context.isProtected({
            start: match.index,
            end: match.index + match[0].length,
          }),
      );
      if (items.length < 4) return [];
      const first = items[0];
      const last = items.at(-1);
      return first && last
        ? [
            {
              range: { start: first.index, end: last.index + last[0].length },
              explanation:
                "A long run of similarly shaped list items may feel templated.",
            },
          ]
        : [];
    },
  },
  {
    id: "structure.uniform-paragraphs",
    category: "structure",
    confidence: "low",
    defaultOptions: {},
    detect: (context) => {
      const paragraphs = context.text
        .split(/\r?\n\s*\r?\n/u)
        .map((value) => value.trim())
        .filter(Boolean);
      if (
        paragraphs.length < 4 ||
        !paragraphs.every(
          (value) => (value.match(/[.!?](?:["')\]]|$)/gu) ?? []).length === 1,
        )
      )
        return [];
      return wholeRange(
        context,
        "Four or more consecutive one-sentence paragraphs create a uniform cadence.",
      );
    },
  },
  {
    id: "structure.repeated-transitions",
    category: "structure",
    confidence: "medium",
    defaultOptions: {},
    detect: (context) => {
      const starts = [
        ...context.text.matchAll(
          /^(?:Additionally|Moreover|Furthermore|Consequently|Ultimately|Importantly|Notably),/gimu,
        ),
      ];
      if (starts.length < 3) return [];
      return starts.map((match) => ({
        range: { start: match.index, end: match.index + match[0].length },
        explanation: "Several paragraphs begin with formal transitions.",
      }));
    },
  },
  {
    id: "structure.excessive-sectioning",
    category: "structure",
    confidence: "low",
    defaultOptions: {},
    detect: (context) => {
      const sections = [
        ...context.text.matchAll(
          /^#{1,6}\s+[^\r\n]+\r?\n+(?!#)([^\r\n]+)(?=\r?\n|$)/gmu,
        ),
      ];
      if (
        sections.length < 4 ||
        !sections.every((match) => (match[1]?.length ?? 0) < 180)
      )
        return [];
      return wholeRange(
        context,
        "Many short heading-and-paragraph sections may indicate excessive sectioning.",
      );
    },
  },
  {
    id: "structure.adjective-stack",
    category: "structure",
    confidence: "low",
    defaultOptions: {},
    detect: (context) =>
      regexSignals(
        context,
        /\b[\p{L}-]{3,20},\s+[\p{L}-]{3,20},\s+(?:and\s+)?[\p{L}-]{3,20}\s+(?:approach|platform|solution|system|tool)\b/giu,
        "A stack of modifiers may read like promotional generated prose.",
      ),
  },
] satisfies AnyRuleDefinition[];
