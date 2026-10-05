import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { type FileScanResult, parseClamdResponse } from './scanner';

describe('parseClamdResponse', () => {
  const cases: TestCase<string, FileScanResult>[] = [
    { expectedOutput: { status: 'clean' }, input: 'stream: OK\0', label: 'clean stream' },
    { expectedOutput: { status: 'clean' }, input: 'stream: OK', label: 'clean stream without terminator' },
    {
      expectedOutput: { details: 'Eicar-Test-Signature', status: 'infected' },
      input: 'stream: Eicar-Test-Signature FOUND\0',
      label: 'infected stream names the signature',
    },
    {
      expectedOutput: { details: 'INSTREAM size limit exceeded. ERROR', status: 'error' },
      input: 'INSTREAM size limit exceeded. ERROR\0',
      label: 'daemon error',
    },
    { expectedOutput: { details: 'empty response', status: 'error' }, input: '', label: 'empty response' },
  ];

  it.each(cases)('$label', ({ input, expectedOutput }) => {
    expect(parseClamdResponse(input)).toStrictEqual(expectedOutput);
  });
});
