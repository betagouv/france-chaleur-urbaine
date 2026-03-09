import { useCallback, useRef, useState } from 'react';

export type DebouncedSwitchMapOptions<TInput, TOutput> = {
  fn: (input: TInput, signal: AbortSignal) => Promise<TOutput>;
  debounce: number;
  onSuccess: (result: TOutput, input: TInput) => void;
  onError: (error: Error, input: TInput) => void;
};

export type DebouncedSwitchMapResult<TInput> = {
  run: (input: TInput) => void;
  cancel: () => void;
  isRunning: boolean;
};

/**
 * Hook qui combine debounce, dédoublonnage et annulation de requête pour les champs
 * de recherche asynchrone. Reproduit le pattern RxJS debounceTime + distinctUntilChanged
 * + switchMap sans dépendance externe.
 *
 * Garantit qu'une seule requête est en vol à la fois : les précédentes sont annulées
 * via AbortController dès qu'une nouvelle frappe arrive.
 */
export function useDebouncedSwitchMap<TInput, TOutput>({
  fn,
  debounce,
  onSuccess,
  onError,
}: DebouncedSwitchMapOptions<TInput, TOutput>): DebouncedSwitchMapResult<TInput> {
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Wrapped in an object so null means "no previous run" (distinct from TInput being null)
  const lastInputRef = useRef<{ value: TInput } | null>(null);

  // Store callbacks in refs so run/cancel remain stable even when callbacks change
  const fnRef = useRef(fn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  fnRef.current = fn;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    // Reset last input so the same value can trigger a new run after cancel
    lastInputRef.current = null;
  }, []);

  const run = useCallback(
    (input: TInput) => {
      // distinctUntilChanged: skip if input hasn't changed since last run
      if (lastInputRef.current !== null && lastInputRef.current.value === input) {
        return;
      }
      lastInputRef.current = { value: input };

      // Cancel pending debounce timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      // Abort previous in-flight request (switchMap behaviour)
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        setIsRunning(true);
        try {
          const result = await fnRef.current(input, signal);
          if (!signal.aborted) {
            onSuccessRef.current(result, input);
          }
        } catch (error) {
          if (!signal.aborted) {
            onErrorRef.current(error instanceof Error ? error : new Error(String(error)), input);
          }
        } finally {
          if (!signal.aborted) {
            setIsRunning(false);
          }
        }
      }, debounce);
    },
    [debounce]
  );

  return { cancel, isRunning, run };
}
