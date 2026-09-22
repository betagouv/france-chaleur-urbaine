import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { hasPdfSignature } from './file-signature';

describe('hasPdfSignature', () => {
  const testCases: TestCase<string | Buffer, boolean>[] = [
    { expectedOutput: true, input: '%PDF-1.7\n%âãÏÓ\n1 0 obj', label: 'accepts a file starting with the PDF header' },
    { expectedOutput: false, input: '<html><body>not a pdf</body></html>', label: 'rejects an HTML file' },
    { expectedOutput: false, input: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]), label: 'rejects a zip archive' },
    { expectedOutput: false, input: '%PDF', label: 'rejects a file shorter than the signature' },
    { expectedOutput: false, input: '', label: 'rejects an empty file' },
  ];

  it.each(testCases)('$label', async ({ input, expectedOutput }) => {
    const directory = await mkdtemp(join(tmpdir(), 'fcu-file-signature-'));
    const filepath = join(directory, 'upload.bin');
    await writeFile(filepath, input);

    expect(await hasPdfSignature(filepath)).toStrictEqual(expectedOutput);
  });
});
