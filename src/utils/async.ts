import pLimit from 'p-limit';

/**
 * Process an iterable in parallel.
 * Beware: errors are unhandled.
 */
export async function processInParallel<T>(
  iterable: Iterable<T>,
  maxParallel: number,
  asyncOperation: (item: T) => Promise<void>
): Promise<void> {
  const asyncLimit = pLimit(maxParallel);

  const asyncIterator = iterable[Symbol.iterator]();
  // Array of promises that are intentionally managed manually
  const pendingPromises: Promise<void>[] = [];

  // Ajoute une nouvelle opération en cours
  const tryProcessNextOperation = async () => {
    const nextItem = asyncIterator.next();
    if (!nextItem.done) {
      const operationPromise = asyncLimit(() => asyncOperation(nextItem.value));
      pendingPromises.push(operationPromise);
      void operationPromise.finally(() => {
        // remove the promise
        const index = pendingPromises.indexOf(operationPromise);
        if (index !== -1) {
          void pendingPromises.splice(index, 1);
        }
        void tryProcessNextOperation();
      });
    }
  };

  for (let i = 0; i < maxParallel; i++) {
    void tryProcessNextOperation();
  }

  // wait for all operations
  while (pendingPromises.length > 0) {
    await Promise.all(pendingPromises);
  }
}
