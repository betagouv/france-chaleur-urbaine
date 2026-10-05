import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';

import { bufferZipReader, listZipEntries } from './zip-inspection';

const buildZip = async (entries: Record<string, string>) => {
  const zip = new JSZip();
  Object.entries(entries).forEach(([name, content]) => zip.file(name, content));
  return zip.generateAsync({ compression: 'DEFLATE', type: 'nodebuffer' });
};

describe('listZipEntries', () => {
  it('lists the entries (directories included) with their uncompressed size without inflating the archive', async () => {
    const archive = await buildZip({ 'reseau.prj': 'PROJCS["RGF93"]', 'reseau.shp': 'x'.repeat(5000), 'sous-dossier/reseau.dbf': 'abc' });

    expect(await listZipEntries(bufferZipReader(archive))).toStrictEqual([
      { name: 'reseau.prj', uncompressedSize: 15 },
      { name: 'reseau.shp', uncompressedSize: 5000 },
      { name: 'sous-dossier/', uncompressedSize: 0 },
      { name: 'sous-dossier/reseau.dbf', uncompressedSize: 3 },
    ]);
  });

  it('lists an empty archive', async () => {
    expect(await listZipEntries(bufferZipReader(await buildZip({})))).toStrictEqual([]);
  });

  it('rejects content that is not a zip archive', async () => {
    await expect(listZipEntries(bufferZipReader(Buffer.from('PK\x03\x04 definitely not a full archive')))).rejects.toThrow(
      'end of central directory not found'
    );
  });

  it('rejects a truncated central directory', async () => {
    const archive = await buildZip({ 'reseau.shp': 'x'.repeat(100) });
    // keep the end record but corrupt the central directory offset it points to
    archive.writeUInt32LE(2, archive.length - 6);

    await expect(listZipEntries(bufferZipReader(archive))).rejects.toThrow('malformed zip central directory');
  });
});
