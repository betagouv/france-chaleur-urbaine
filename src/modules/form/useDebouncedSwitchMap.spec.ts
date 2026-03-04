import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedSwitchMap } from './useDebouncedSwitchMap';

const DEBOUNCE = 300;

describe('useDebouncedSwitchMap()', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('appelle fn puis onSuccess après le debounce', async () => {
    const fn = vi.fn().mockResolvedValue(['result']);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError, onSuccess }));

    act(() => result.current.run('query'));

    expect(fn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('query', expect.any(AbortSignal));
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onSuccess).toHaveBeenCalledWith(['result'], 'query');
    expect(onError).not.toHaveBeenCalled();
  });

  it("ne déclenche fn qu'une fois pour des appels rapides (debounce)", async () => {
    const fn = vi.fn().mockResolvedValue([]);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError: vi.fn(), onSuccess }));

    act(() => {
      result.current.run('a');
      result.current.run('ab');
      result.current.run('abc');
    });

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('abc', expect.any(AbortSignal));
  });

  it("n'appelle pas fn si cancel() est appelé pendant le debounce", async () => {
    const fn = vi.fn().mockResolvedValue([]);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError: vi.fn(), onSuccess }));

    act(() => result.current.run('query'));
    act(() => result.current.cancel());

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(fn).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("n'appelle ni onSuccess ni onError si cancel() est appelé pendant la requête", async () => {
    let resolveRequest: (value: string[]) => void = () => {};
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveRequest = resolve;
        })
    );
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError, onSuccess }));

    act(() => result.current.run('query'));

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(fn).toHaveBeenCalledOnce();

    // Cancel while the request is in flight
    act(() => result.current.cancel());

    // Resolve the (already-aborted) request
    await act(async () => {
      resolveRequest(['late result']);
    });

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('ne relance pas fn si le même input est soumis deux fois (distinctUntilChanged)', async () => {
    const fn = vi.fn().mockResolvedValue([]);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError: vi.fn(), onSuccess }));

    act(() => result.current.run('same'));
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    act(() => result.current.run('same'));
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('relance fn après cancel() avec le même input (lastInput remis à null)', async () => {
    const fn = vi.fn().mockResolvedValue([]);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError: vi.fn(), onSuccess }));

    act(() => result.current.run('same'));
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });
    expect(fn).toHaveBeenCalledOnce();

    act(() => result.current.cancel());

    act(() => result.current.run('same'));
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('appelle onError quand fn rejette (sans abort)', async () => {
    const error = new Error('network error');
    const fn = vi.fn().mockRejectedValue(error);
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError, onSuccess }));

    act(() => result.current.run('query'));

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith(error, 'query');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('passe de false → true → false pour isRunning pendant un cycle complet', async () => {
    let resolveRequest: (value: string[]) => void = () => {};
    const fn = vi.fn().mockImplementation(
      () =>
        new Promise<string[]>((resolve) => {
          resolveRequest = resolve;
        })
    );

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError: vi.fn(), onSuccess: vi.fn() }));

    expect(result.current.isRunning).toBe(false);

    act(() => result.current.run('query'));

    // Still false during debounce
    expect(result.current.isRunning).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      resolveRequest(['done']);
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('annule la requête précédente quand run() est rappelé (switchMap)', async () => {
    const abortedSignals: AbortSignal[] = [];
    const fn = vi.fn().mockImplementation(
      (_input: string, signal: AbortSignal) =>
        new Promise<string[]>((resolve) => {
          signal.addEventListener('abort', () => {
            abortedSignals.push(signal);
            resolve([]);
          });
        })
    );
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDebouncedSwitchMap({ debounce: DEBOUNCE, fn, onError: vi.fn(), onSuccess }));

    // First run — fires immediately after debounce
    act(() => result.current.run('first'));
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });
    expect(fn).toHaveBeenCalledOnce();

    // Second run — aborts the first in-flight request
    act(() => result.current.run('second'));
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE);
    });

    expect(abortedSignals).toHaveLength(1);
    expect(abortedSignals[0]?.aborted).toBe(true);
    // onSuccess not called for aborted first request
    expect(onSuccess).not.toHaveBeenCalledWith(expect.anything(), 'first');
  });
});
