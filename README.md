# Humy

Humy is a deterministic text humanizer for machine-like writing patterns and copied AI-output artifacts. It applies explainable rules, returns every change with its original offset, and reports patterns that are too risky to rewrite automatically.

Humy does not use a generative model, an external API, network access, or a probabilistic AI detector. It cannot reliably determine whether a human or an AI wrote text. Its rules edit known patterns regardless of who produced them.

## Install

```sh
bun add humy
```

## Basic usage

```ts
import { humy } from "humy";

const result = humy("It’s fast — but expensive…", {
  preset: "natural",
});

console.log(result.text); // It's fast, but expensive...
console.log(result.changes); // Inspectable edits with input ranges
console.log(result.signals); // Detected patterns that may have been preserved
```

`humy()` and its alias `transform()` change text. `analyze()` returns findings without changing the input.

```ts
import { analyze } from "humy";

const result = analyze("It is fast, reliable, and scalable.");

result.text; // Original input
result.signals; // Includes structure.rule-of-three
```

## Presets

The default preset is `natural`.

| Preset | Purpose |
| --- | --- |
| `safe` | Removes low-risk Unicode, whitespace, and copied model/UI artifacts. |
| `natural` | Adds conservative punctuation, Markdown, response-wrapper, phrasing, and transition cleanup. |
| `aggressive` | Adds opt-in style changes such as formal semicolon splitting and decorative heading cleanup. |

Signals can still be emitted by an enabled rule even when that rule does not transform text.

### Override a preset

```ts
import { humy } from "humy";

humy("One — two", {
  preset: "natural",
  rules: {
    "punctuation.em-dash": false,
  },
});

humy("One — two", {
  preset: "safe",
  rules: {
    "punctuation.em-dash": {
      enabled: true,
      strategy: "hyphen",
    },
  },
});
```

Rule-specific options are inferred from the rule ID. Consumers do not need to construct a complete configuration object.

### Fully custom configuration

```ts
import { humy } from "humy";

const input = "It’s copied\u00A0text turn0search0";
const result = humy(input, {
  preset: false,
  rules: {
    "unicode.nbsp": true,
    "unicode.smart-quotes": true,
    "artifact.chatgpt-citation": true,
  },
});
```

## Inspecting changes

```ts
const result = humy("It’s fast — but expensive.");

for (const change of result.changes) {
  console.log(change.rule); // unicode.smart-quotes
  console.log(change.original); // ’
  console.log(change.replacement); // '
  console.log(change.range); // UTF-16 offsets in the original input
  console.log(change.confidence); // certain | high | medium | low
}
```

Changes never overlap. All `range` values use JavaScript UTF-16 string offsets and refer to the original input, so `input.slice(range.start, range.end) === original`.

## Rule categories

Humy exposes stable, namespaced rule IDs across these categories:

- `unicode`: BOM, safe zero-width cleanup, typography spacing, quotes, ellipsis, and hyphens
- `whitespace`: trailing whitespace
- `punctuation`: contextual em dashes, en dashes, and conservative semicolon handling
- `artifact`: copied citation tokens, source-card leakage, response preambles, and closing prompts
- `formatting`: bold list labels, redundant section rules, and decorative headings
- `phrasing`: conservative contrast, vocabulary, copula-avoidance, and transition rules
- `structure`: detection-only cadence, list, section, transition, and rule-of-three heuristics

Use the exported `rules` metadata to enumerate built-in IDs, categories, and default confidence levels. The exported `presets` object shows the built-in configurations.

## Unicode safety

Humy does not broadly delete invisible characters. The safe preset removes BOMs, soft hyphens, and zero-width spaces only in contexts where they look like prose-copying artifacts. It preserves ZWJ emoji sequences, ZWJ/ZWNJ in writing systems, numeric grouping spaces, and bidi controls by default. Explicit bidi controls are reported as signals because they can be meaningful.

Quote and English style rules currently target `en`. `locale: "auto"` is accepted as a forward-compatible request and currently resolves to English; Humy does not pretend to perform language detection. Unicode sanitation remains script-conscious.

## Protected regions

The internal scanner protects fenced code blocks, inline code, URLs, email addresses, common filesystem paths, Markdown link destinations, and HTML tags/attributes. Rules edit visible Markdown prose around those regions. This is a lightweight scanner rather than a complete Markdown or programming-language parser.

## Limitations

- Deterministic patterns cannot understand intent or full sentence semantics.
- Ambiguous patterns such as `serves as`, formulaic contrasts, repeated triples, and uniform paragraph cadence are generally reported rather than rewritten.
- Generated-looking style is not evidence of authorship. Humy makes no authorship determination.
- The scanner covers common protected syntax, not every markup language or malformed document.
- Custom third-party rules are not public in v0.1; the internal rule contract is structured so this can be added without changing built-in rule IDs.

## Development

```sh
bun install
bun test
bun run typecheck
bun run lint
bun run build
bun run bench
```

The test suite includes rule fixtures, preset behavior, protected regions, international Unicode cases, change offsets, idempotency, randomized Unicode inputs, and large documents.

## License

[MIT](LICENSE)
