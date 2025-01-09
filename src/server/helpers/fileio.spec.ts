import { describe, expect, test } from 'vitest';

import { FILEIO_API_URL, FileIOClient } from './fileio';

// Désactivé car l'API file.io ne semble plus fonctionner au 09/01/2024
describe.skip('uploadTempFile()', () => {
  test('returns a link to the file', async () => {
    await expect(
      new FileIOClient(FILEIO_API_URL, 'AAAAAAA.AAAAAAA-AAAAAAA-AAAAAAA-AAAAAAA').uploadTempFile('/etc/hostname', 'hostname.txt')
    ).resolves.toContain(FILEIO_API_URL);
  }, 60_000);

  // there is no error when the API key is invalid
});
