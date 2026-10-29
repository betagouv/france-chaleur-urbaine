import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { z } from 'zod';

import type { SimulatorSituation } from '@/modules/simulator/constants';

import { modesDeChauffage } from '../mappings';
import { getModeLabel, type ModePublicodesKey, type Scenario } from './scenario-model';

/** What a shared link must restore: the address, the shared-context inputs and the scenarios. Nothing about the UI. */
export type ComparateurUrlState = {
  address: string | null;
  baseInputs: SimulatorSituation;
  scenarios: Scenario[];
};

export type DecodedUrlState = {
  state: ComparateurUrlState;
  /** Rule or mode names present in the link but unknown to the current model: their values were dropped */
  unknownRules: string[];
};

const zSituationValue = z.union([z.number(), z.string()]);

// Short keys on purpose: this JSON is what ends up compressed in the URL. Rule names stay in clear (see decodeComparateurUrlState).
const zUrlPayload = z.object({
  a: z.string().optional(),
  b: z.record(z.string(), zSituationValue).default({}),
  s: z.array(z.object({ l: z.string().optional(), m: z.string(), o: z.record(z.string(), zSituationValue).default({}) })).min(1),
  v: z.literal(1),
});

type UrlPayload = z.infer<typeof zUrlPayload>;

const compactSituation = (situation: SimulatorSituation): Record<string, number | string> =>
  Object.fromEntries(
    Object.entries(situation).filter(
      (entry): entry is [string, number | string] => entry[1] !== null && entry[1] !== undefined && entry[1] !== ''
    )
  );

const toPayload = (state: ComparateurUrlState): UrlPayload => ({
  ...(state.address ? { a: state.address } : {}),
  b: compactSituation(state.baseInputs),
  s: state.scenarios.map((scenario) => ({
    ...(scenario.label !== getModeLabel(scenario.mode) ? { l: scenario.label } : {}),
    m: scenario.mode,
    o: compactSituation(scenario.overrides),
  })),
  v: 1,
});

const isKnownMode = (mode: string): mode is ModePublicodesKey => modesDeChauffage.some((item) => item.publicodesKey === mode);

/** Keeps only the rules the model knows; the others are reported so the user learns what the link could not restore */
const splitKnownRules = (
  situation: Record<string, number | string>,
  knownRules: ReadonlySet<string>,
  unknownRules: string[]
): SimulatorSituation =>
  Object.fromEntries(
    Object.entries(situation).filter(([rule]) => {
      const isKnown = knownRules.has(rule);
      if (!isKnown) {
        unknownRules.push(rule);
      }
      return isKnown;
    })
  );

const fromPayload = (payload: UrlPayload, knownRules: ReadonlySet<string>): DecodedUrlState => {
  const unknownRules: string[] = [];
  const scenarios = payload.s.flatMap((scenario, index): Scenario[] => {
    if (!isKnownMode(scenario.m)) {
      unknownRules.push(scenario.m);
      return [];
    }
    return [
      {
        id: `url-${index}`,
        label: scenario.l ?? getModeLabel(scenario.m),
        mode: scenario.m,
        overrides: splitKnownRules(scenario.o, knownRules, unknownRules),
      },
    ];
  });
  return {
    state: { address: payload.a ?? null, baseInputs: splitKnownRules(payload.b, knownRules, unknownRules), scenarios },
    unknownRules,
  };
};

// --- deflate-raw + base64url through the browser's native streams (zero dependency, async by nature)

const toBase64Url = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (encoded: string) =>
  Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

const compress = async (text: string): Promise<string> => {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()));
};

const decompress = async (encoded: string): Promise<string> => {
  const stream = new Blob([fromBase64Url(encoded)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
};

/** Serializes the state into one URL-safe token: compact JSON, deflate-raw, base64url. Rule names are kept in clear. */
export const encodeComparateurUrlState = (state: ComparateurUrlState): Promise<string> => compress(JSON.stringify(toPayload(state)));

/**
 * Restores a state from a token. Returns null when the token is corrupt or of another version; rules and modes unknown
 * to the current model are dropped and reported, so a renamed rule degrades the link instead of breaking it.
 */
export const decodeComparateurUrlState = async (encoded: string, knownRules: ReadonlySet<string>): Promise<DecodedUrlState | null> => {
  try {
    const parsed = zUrlPayload.safeParse(JSON.parse(await decompress(encoded)));
    return parsed.success ? fromPayload(parsed.data, knownRules) : null;
  } catch {
    return null;
  }
};

export const toKnownRules = (ruleNames: readonly RuleName[]): ReadonlySet<string> => new Set(ruleNames);
