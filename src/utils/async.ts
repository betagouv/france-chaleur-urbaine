import pLimit from 'p-limit';

/**
 * Process an iterable in parallel.
 * Throws an error as soon as one operation fails.
 */
export async function processInParallel<T>(
  iterable: Iterable<T>,
  maxParallel: number,
  asyncOperation: (item: T) => Promise<void>
): Promise<void> {
  const asyncLimit = pLimit(maxParallel);

  const asyncIterator = iterable[Symbol.iterator]();
  const pendingPromises: Promise<void>[] = [];
  let hasFailed = false;
  let firstError: Error | undefined;

  const tryProcessNextOperation = async () => {
    if (hasFailed) return;
    const nextItem = asyncIterator.next();
    if (!nextItem.done) {
      const operationPromise = asyncLimit(() => asyncOperation(nextItem.value)).catch((error) => {
        if (!hasFailed) {
          hasFailed = true;
          firstError = error instanceof Error ? error : new Error(String(error));
        }
      });
      pendingPromises.push(operationPromise);
      void operationPromise.finally(() => {
        const index = pendingPromises.indexOf(operationPromise);
        if (index !== -1) {
          pendingPromises.splice(index, 1);
        }
        if (!hasFailed) {
          void tryProcessNextOperation();
        }
      });
    }
  };

  for (let i = 0; i < maxParallel; i++) {
    void tryProcessNextOperation();
  }

  while (pendingPromises.length > 0 && !hasFailed) {
    await Promise.all(pendingPromises);
  }

  if (hasFailed && firstError) {
    throw firstError;
  }
}
