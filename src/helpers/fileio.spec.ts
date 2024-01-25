import { describe, expect, test } from 'vitest';

import { FILEIO_API_URL, FileIOClient } from './fileio';

describe('uploadTempFile()', () => {
  test('returns a link to the file', async () => {
    await expect(
      new FileIOClient(
        FILEIO_API_URL,
        'AAAAAAA.AAAAAAA-AAAAAAA-AAAAAAA-AAAAAAA'
      ).uploadTempFile('/etc/hostname', 'hostname.txt')
    ).resolves.toContain(FILEIO_API_URL);
  });

  // there is no error when the API key is invalid
});
