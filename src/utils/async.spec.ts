import { describe, expect, it } from 'vitest';

import { processInParallel } from './async';

describe('processInParallel()', () => {
  it('handles empty iterable', async () => {
    const processed: number[] = [];

    await processInParallel([], 2, async (item) => {
      processed.push(item);
    });

    expect(processed).toEqual([]);
  });

  it('processes all items successfully', async () => {
    const items = [1, 2, 3, 4, 5];
    const processed: number[] = [];

    await processInParallel(items, 2, async (item) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      processed.push(item);
    });

    expect(processed).toEqual([1, 2, 3, 4, 5]);
  });

  it('stops immediately when an error occurs', async () => {
    const items = [1, 2, 3, 4, 5];
    const processed: number[] = [];

    await expect(
      processInParallel(items, 2, async (item) => {
        if (item === 3) {
          throw new Error('test error');
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        processed.push(item);
      })
    ).rejects.toThrow('test error');

    // With maxParallel=2, items 1 and 2 start first, then 3 fails
    // Items 4 and 5 should never be processed
    expect(processed).toEqual([1, 2]);
  });

  it('respects maxParallel limit', async () => {
    const items = [1, 2, 3, 4, 5, 6];
    let concurrentCount = 0;
    let maxConcurrentCount = 0;

    await processInParallel(items, 2, async () => {
      concurrentCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      maxConcurrentCount = Math.max(maxConcurrentCount, concurrentCount);
      concurrentCount--;
    });

    expect(maxConcurrentCount).toEqual(2);
  });

  it('does not create unhandled rejections', async () => {
    const unhandledRejections: unknown[] = [];
    const handler = (reason: unknown) => {
      unhandledRejections.push(reason);
    };

    process.on('unhandledRejection', handler);

    try {
      await expect(
        processInParallel([1, 2, 3], 2, async (item) => {
          if (item === 2) {
            throw new Error('test error');
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        })
      ).rejects.toThrow('test error');

      // Wait a bit to ensure no unhandled rejections occur
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(unhandledRejections).toEqual([]);
    } finally {
      process.removeListener('unhandledRejection', handler);
    }
  });
});
