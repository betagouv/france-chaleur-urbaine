import { atom, useAtomValue, useSetAtom, useStore } from 'jotai';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getConversionSource, getTrackingContext, isTrackablePage } from '@/modules/conversion-tracking/client/trackingContext';
import trpc from '@/modules/trpc/client';

import type { SimulationOutcomeDeclaration, SimulationSnapshot, SimulationStart } from '../constants';

/**
 * Page the current simulation was started from, handed over from the form (home / landing) to the results page through
 * client-side navigation only: nothing in the URL, nothing persisted in the browser. Kept while the results page is mounted
 * (tracking and back link), released when it unmounts. Empty on a reload or a shared link, which then counts as a direct
 * arrival on the results page.
 */
const simulationStartAtom = atom<SimulationStart | null>(null);

/** The current page as a simulation start: Next route pattern, pathname and the conversion attribution of its URL. */
const getPageSimulationStart = (route: string): SimulationStart => ({
  host: getTrackingContext().host ?? null,
  page: window.location.pathname,
  route,
  source: getConversionSource(),
});

const ignoreTrackingError = () => {};

/**
 * Marks the current page as the start of the next simulation; to call right before navigating to the results page.
 */
export function useStartSimulation() {
  const router = useRouter();
  const setSimulationStart = useSetAtom(simulationStartAtom);
  return useCallback(() => {
    if (isTrackablePage()) {
      setSimulationStart(getPageSimulationStart(router.pathname));
    }
  }, [router.pathname, setSimulationStart]);
}

/** Simulation currently shown: the address and building that identify it, and the last snapshot sent. */
type CurrentSimulation = { id: string; identity: string; snapshotKey: string };

/**
 * A simulation is one building on the results page, or one address when no building is known (the typed address is
 * corrected to the building's own once it is confirmed: same simulation). Another one starts a new, chained simulation.
 */
const simulationIdentity = (snapshot: SimulationSnapshot) => snapshot.batimentConstructionId ?? snapshot.address ?? '';

/** What counts as a change of the current simulation: the address label no longer matters once a building is known. */
const snapshotChangeKey = (snapshot: SimulationSnapshot) =>
  JSON.stringify({ ...snapshot, address: snapshot.batimentConstructionId ? null : snapshot.address });

/**
 * First-party tracking of the simulations shown on the results page: a client-generated id per address or building,
 * created once the results are ready, updated on every other parameter change, chained to the previous simulation when
 * the address or the building changes. Fire-and-forget, never blocks the journey.
 */
export function useSimulationTracking() {
  const { client } = trpc.useUtils();
  const router = useRouter();
  const store = useStore();
  const [simulationStart] = useState(() => store.get(simulationStartAtom));
  // released at unmount: a results page left before its simulation is created must not leak its start to a later arrival
  useEffect(() => () => store.set(simulationStartAtom, null), [store]);
  const [simulationId, setSimulationId] = useState(() => crypto.randomUUID());
  const current = useRef<CurrentSimulation | null>(null);

  const track = useCallback(
    (snapshot: SimulationSnapshot) => {
      if (!isTrackablePage()) {
        return;
      }
      const identity = simulationIdentity(snapshot);
      const snapshotKey = snapshotChangeKey(snapshot);
      const previous = current.current;
      if (previous && previous.identity === identity) {
        if (previous.snapshotKey === snapshotKey) {
          return;
        }
        current.current = { ...previous, snapshotKey };
        void client.simulationTracking.update.mutate({ ...snapshot, id: previous.id }).catch(ignoreTrackingError);
        return;
      }
      const id = previous ? crypto.randomUUID() : simulationId;
      current.current = { id, identity, snapshotKey };
      setSimulationId(id);
      const start = simulationStart ?? getPageSimulationStart(router.pathname);
      void client.simulationTracking.create
        .mutate({ ...snapshot, ...start, id, previousSimulationId: previous?.id ?? null })
        .catch(ignoreTrackingError);
    },
    [client, router.pathname, simulationId, simulationStart]
  );

  return useMemo(() => ({ simulationId, track }), [simulationId, track]);
}

/** Route of the page the current simulation was started from (`/`, `/chaleur-renouvelable`), `null` on a direct arrival. */
export function useSimulationStartRoute() {
  return useAtomValue(simulationStartAtom)?.route ?? null;
}

/** Records the outcome of a simulation (demand confirmed by the server with its id, or France Rénov' appointment click). */
export function useRecordSimulationOutcome() {
  const { client } = trpc.useUtils();
  return useCallback(
    (simulationId: string, declaration: SimulationOutcomeDeclaration) => {
      if (!isTrackablePage()) {
        return;
      }
      void client.simulationTracking.recordOutcome.mutate({ ...declaration, id: simulationId }).catch(ignoreTrackingError);
    },
    [client]
  );
}
