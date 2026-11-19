# publicodes module

Client-side tooling around the publicodes engine (`@betagouv/france-chaleur-urbaine-publicodes`): calculation explanation UI and shared formatters.

## Structure

```
publicodes/
  AGENTS.md
  format.ts               # pure formatters: formatUnit, formatNodeValue
  explanation-model.ts    # pure AST walker: evaluated publicodes AST → explanation tree, flat formula, calculation chain, contributing inputs
  client/
    ExplainedValue.tsx        # clickable rule value that opens the explanation dialog
    RuleExplanationDialog.tsx # dialog: rule name, value, provenance, "Arbre" (formula tree) / "À plat" (calculation chain) toggle
    ExplanationNodeView.tsx   # recursive formula renderer (operations, references, variations, conditions)
    FlatExplanationView.tsx   # calculation chain: one flat line per rule (active branches only, zero terms hidden) + list of contributing inputs
    RuleSourceLinks.tsx       # sources of a rule as inline external links (full note on hover), muted dash when unsourced
    RuleNote.tsx              # what justifies a rule: its sources as links, else its note as a muted remark
    dev/
      ExplanationDemo.tsx     # demo component (fixed situation, bilan table) — not mounted on any page
```

## Purpose & boundaries

- Owns: explaining how a publicodes rule value is computed (formula tree with real values, provenance badges saisie/défaut, drill-down), and publicodes display formatting.
- `explanation-model.ts` and `format.ts` are pure TypeScript (no React) — keep them that way so they stay testable and server-usable.
- The explanation model normalizes away compiler noise: `$SITUATION` / `par défaut` wrappers, `variable manquante`, unit conversions, fold-seed constants of somme/produit/et/ou, the `le maximum de` / `le minimum de` / `moyenne` compiled forms (rebuilt from `sourceMap.args`), and the `X = oui` / `X != non` comparisons compiled from `applicable si` / `est défini` (collapsed to X or its negation). It works on `Engine.evaluate()` output; publicodes exports no usable AST types, hence the internal loose `PublicodesNode` type.
- Flat view (`flattenRuleFormula`, `buildCalculationChain`, `collectContributingInputs`): only the branches actually taken are kept (conditions and variations collapse to their active result); references stay named terms; a reference is a *leaf input* when it comes from the situation, has a `par défaut`, or is a bare constant — inputs are never inlined. `hideZeroTerms` drops the 0 terms of sums/differences only.
- Sources (`getRuleSources`, `parseSourceNote`, `getRuleAnnotation`): structured `références` first, else the free-text `note` when it starts with « Source : » or contains a URL (label = text before the first URL), else the source of the rule it is a bare alias of. Any other note is a *remark* (justification of the formula, caveat) exposed by `getRuleAnnotation`. One rule, its own annotation — sources are never aggregated from the inputs of a computed value. Shown in the dialog header, on each step and each input of the flat view, and in the comparator drawer hints (`RuleNote`).
- Must NOT: access DB or server internals; know about the comparateur's UI.
- The engine hooks (`usePublicodesEngine`, `useSimulatorEngine`) still live in `src/components/ComparateurPublicodes/` (widely imported); migrating them here is a possible follow-up.

## tRPC routes / Zod schemas / DB tables

None — client-only module, all computation happens in the browser engine.

## Dependencies

- `publicodes` (engine, v1), `@betagouv/france-chaleur-urbaine-publicodes` (rules + `RuleName` type)
- `@/components/ui/*` (Dialog, Icon, Loader), Tailwind

## Usage

```tsx
import { ExplainedValue } from '@/modules/publicodes/client/ExplainedValue';

// engine = usePublicodesEngine(...).internalEngine (a publicodes Engine<RuleName>)
<ExplainedValue engine={engine} dottedName="réseau de chaleur . bilan . P3" />
```

Live usage: the debug drawer of the current comparator (`src/components/ComparateurPublicodes/DebugDrawer.tsx`) and the scenario comparator POC at `/dev/comparateur` (`src/components/ComparateurPublicodes/poc/`), where every figure opens the dialog on its own scenario engine.
