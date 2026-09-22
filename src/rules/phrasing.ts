import { regexEdits, regexSignals } from "../core/match.js";
import type { AnyRuleDefinition } from "../core/types.js";

function matchCase(source: string, replacement: string): string {
  if (source.toUpperCase() === source) return replacement.toUpperCase();
  if (/^[A-Z]/u.test(source))
    return replacement[0]?.toUpperCase() + replacement.slice(1);
  return replacement;
}

export const phrasingRules = [
  {
    id: "phrasing.not-just",
    category: "phrasing",
    confidence: "medium",
    defaultOptions: {},
    detect: (context) =>
      regexSignals(
        context,
        /\b(?:is not|isn't|are not|aren't) (?:merely|just)\b[^.!?\r\n]{1,100}[;,]\s+(?:it is|it's|they are|they're)\b/giu,
        "A formulaic contrast was preserved because rewriting it may change emphasis.",
      ),
  },
  {
    id: "phrasing.not-only",
    category: "phrasing",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\b(is|are|was|were) not only ([^,.;!?\r\n]{1,40}) but also ([^,.;!?\r\n]{1,40})(?=[,.;!?]|$)/giu,
        (match) => `${match[1]} ${match[2]?.trim()} and ${match[3]?.trim()}`,
        "Simplified a parallel not-only/but-also construction.",
      ),
  },
  {
    id: "phrasing.utilize",
    category: "phrasing",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\butiliz(?:e|es|ed|ing)\b/giu,
        (match) => {
          const forms: Record<string, string> = {
            utilize: "use",
            utilizes: "uses",
            utilized: "used",
            utilizing: "using",
          };
          return matchCase(match[0], forms[match[0].toLowerCase()] ?? match[0]);
        },
        "Replaced a formal verb with its direct equivalent.",
      ),
  },
  {
    id: "phrasing.formal-vocabulary",
    category: "phrasing",
    confidence: "high",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\b(?:in order to|due to the fact that|at this point in time|commence[ds]?|commencing)\b/giu,
        (match) => {
          const forms: Record<string, string> = {
            "in order to": "to",
            "due to the fact that": "because",
            "at this point in time": "now",
            commence: "start",
            commences: "starts",
            commenced: "started",
            commencing: "starting",
          };
          return matchCase(match[0], forms[match[0].toLowerCase()] ?? match[0]);
        },
        "Simplified a formal phrase without changing its meaning.",
      ),
  },
  {
    id: "phrasing.serves-as",
    category: "phrasing",
    confidence: "medium",
    defaultOptions: {},
    detect: (context) =>
      regexSignals(
        context,
        /\b(?:serves|stands) as (?:an?|the)\b/giu,
        "This copula-avoidance phrase may be replaceable with a direct verb, but role semantics can matter.",
      ),
  },
  {
    id: "phrasing.boasts",
    category: "phrasing",
    confidence: "medium",
    defaultOptions: {},
    transform: (context) =>
      regexEdits(
        context,
        /\bboasts(?=\s+(?:an?\s+)?\d)/giu,
        (match) => matchCase(match[0], "has"),
        "Simplified 'boasts' before a numeric specification.",
      ),
    detect: (context) =>
      regexSignals(
        context,
        /\b(?:boasts|features)\b/giu,
        "A promotional copula-avoidance verb may make prose sound formulaic.",
      ),
  },
  {
    id: "phrasing.transition-word",
    category: "phrasing",
    confidence: "medium",
    defaultOptions: { strategy: "simplify" },
    transform: (context) => {
      const strategy = context.options.strategy ?? "simplify";
      if (strategy === "preserve") return [];
      return regexEdits(
        context,
        /^(\s*)(Additionally|Moreover|Furthermore),\s+/gimu,
        (match) =>
          strategy === "remove"
            ? (match[1] ?? "")
            : `${match[1] ?? ""}${matchCase(match[2] ?? "", "Also")}, `,
        "Simplified a formal paragraph transition.",
      );
    },
    detect: (context) =>
      regexSignals(
        context,
        /^(?:\s*)(?:Additionally|Moreover|Furthermore|Consequently|Ultimately|Importantly|Notably|In conclusion|In summary),/gimu,
        "A formal transition may contribute to repetitive generated cadence.",
      ),
  },
] satisfies AnyRuleDefinition[];
