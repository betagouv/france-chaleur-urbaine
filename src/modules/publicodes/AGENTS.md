# publicodes module

Client-side tooling around the publicodes engine (`@betagouv/france-chaleur-urbaine-publicodes`): calculation explanation UI and shared formatters.

## Structure

```
publicodes/
  AGENTS.md
  format.ts               # pure formatters: formatUnit, formatNodeValue
  explanation-model.ts    # pure AST walker: evaluated publicodes AST → display-oriented explanation tree
  client/
    ExplainedValue.tsx        # clickable rule value that opens the explanation dialog
    RuleExplanationDialog.tsx # dialog: rule name, value, provenance, formula tree
    ExplanationNodeView.tsx   # recursive formula renderer (operations, references, variations, conditions)
    dev/
      ExplanationDemo.tsx     # demo used by /dev/publicodes (fixed situation, bilan table)
```

## Purpose & boundaries

- Owns: explaining how a publicodes rule value is computed (formula tree with real values, provenance badges saisie/défaut, drill-down), and publicodes display formatting.
- `explanation-model.ts` and `format.ts` are pure TypeScript (no React) — keep them that way so they stay testable and server-usable.
- The explanation model normalizes away compiler noise: `$SITUATION` / `par défaut` wrappers, `variable manquante`, unit conversions, fold-seed constants of somme/produit/et/ou. It works on `Engine.evaluate()` output; publicodes exports no usable AST types, hence the internal loose `PublicodesNode` type.
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

Demo: `/dev/publicodes` (not in navigation).
