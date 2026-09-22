import { regexEdits, regexSignals } from "../core/match.js";
import type {
  AnyRuleDefinition,
  ProposedEdit,
  RuleContext,
} from "../core/types.js";

function wrapperLines(
  context: RuleContext,
  expression: RegExp,
  explanation: string,
): ProposedEdit[] {
  const edits: ProposedEdit[] = [];
  expression.lastIndex = 0;
  for (const match of context.text.matchAll(expression)) {
    const line = match[0];
    const trimmed = line.trimStart();
    const range = { start: match.index, end: match.index + line.length };
    if (!trimmed.startsWith(">") && !context.isProtected(range))
      edits.push({ range, replacement: "", explanation });
  }
  return edits;
}

export const artifactRules = [
  {
    id: "artifact.chatgpt-citation",
    category: "artifact",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /(?:\u3010?oaicite(?::|\u3011)|oai_citation|contentReference|turn\d+(?:search|fetch|view)\d+)(?:[^\s.,;:!?)]*)?/giu,
        "",
        "Removed a copied ChatGPT citation token.",
      ),
  },
  {
    id: "artifact.gemini-citation",
    category: "artifact",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /(?:attributableIndex|\[span_\d+\]\(start_span\)|\(end_span\))/giu,
        "",
        "Removed a copied Gemini attribution token.",
      ),
  },
  {
    id: "artifact.grok-card",
    category: "artifact",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /(?:grok_render_citation_card_json|grok_card)(?:\s*\{[^\r\n]*\})?/giu,
        "",
        "Removed a copied Grok card token.",
      ),
  },
  {
    id: "artifact.perplexity",
    category: "artifact",
    confidence: "certain",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /(?:ppl-ai-file-upload|attached_file)(?:\s*:\s*[^\s]+)?/giu,
        "",
        "Removed a copied file or source token.",
      ),
  },
  {
    id: "artifact.placeholder",
    category: "artifact",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\[(?:cite\s*:\s*\d+(?:\s*,\s*\d+)*|citation needed|source needed)\]/giu,
        "",
        "Removed a dangling citation placeholder.",
      ),
  },
  {
    id: "artifact.response-preamble",
    category: "artifact",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      wrapperLines(
        context,
        /^(?:[ \t]*)(?:(?:Sure|Certainly|Absolutely|Of course)[!,.:]?\s+)?Here(?:['’]s| is) (?:a |the )?(?:revised|polished|updated|improved)?\s*(?:version|response|draft|text)(?:\s+of\s+[^:]+)?:?[ \t]*(?:\r?\n(?:[ \t]*\r?\n)?|$)/gimu,
        "Removed a chatbot response preamble.",
      ),
  },
  {
    id: "artifact.response-closing",
    category: "artifact",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      wrapperLines(
        context,
        /^(?:[ \t]*)(?:Would you like me to|Let me know if you(?:['’]d| would) like|If you(?:['’]d| would) like,? I can|I can also)\b[^\r\n]*(?:\r?\n|$)/gimu,
        "Removed a chatbot closing prompt.",
      ),
  },
] satisfies AnyRuleDefinition[];

export const artifactDetectors = [
  {
    id: "formatting.excessive-bold",
    category: "formatting",
    confidence: "medium",
    defaultOptions: {},
    detect: (context) => {
      const matches = regexSignals(
        context,
        /\*\*[^*\r\n]{1,60}\*\*/gu,
        "Repeated bold fragments can create a templated cadence.",
      );
      return matches.length >= 3 ? matches : [];
    },
  },
] satisfies AnyRuleDefinition[];
