export async function sleep(durationMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, durationMs));
}

/**
 * Exécute une fonction, mais ne retourne le résultat qu'après un délai minimum.
 */
export async function workMinimum<Func extends () => any>(action: Func, minimumDurationMs: number): Promise<ReturnType<Func>> {
  const start = Date.now();
  const result = await action();
  const duration = Date.now() - start;
  await sleep(minimumDurationMs - duration);
  return result;
}
