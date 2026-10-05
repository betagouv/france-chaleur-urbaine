import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { formatFileSize } from './strings';

describe('formatFileSize', () => {
  const cases: TestCase<number, string>[] = [
    { expectedOutput: '0 o', input: 0, label: 'empty file' },
    { expectedOutput: '512 o', input: 512, label: 'below one kilobyte' },
    { expectedOutput: '1 Ko', input: 1024, label: 'exactly one kilobyte' },
    { expectedOutput: '340 Ko', input: 348_160, label: 'kilobytes are rounded' },
    { expectedOutput: '1 Mo', input: 1024 * 1024, label: 'exactly one megabyte' },
    { expectedOutput: '2,5 Mo', input: 2.5 * 1024 * 1024, label: 'megabytes keep one decimal' },
    { expectedOutput: '50 Mo', input: 50 * 1024 * 1024, label: 'whole megabytes have no decimal' },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(formatFileSize(input)).toStrictEqual(expectedOutput);
  });
});
