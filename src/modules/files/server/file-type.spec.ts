import { describe, expect, it } from 'vitest';

import type { TestCase } from '@/tests/trpc-helpers';

import { detectFileType } from './file-type';

const pdf = Buffer.from('%PDF-1.7\n%âãÏÓ\n1 0 obj');
const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00]);
const sqlite = Buffer.from('SQLite format 3\0more');
const shape = Buffer.from([0x00, 0x00, 0x27, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const dbf = Buffer.concat([Buffer.from([0x03]), Buffer.alloc(40)]);
const executable = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
const geojson = Buffer.from('{"type":"FeatureCollection","features":[]}');

describe('detectFileType', () => {
  const cases: TestCase<[string, Buffer], ReturnType<typeof detectFileType>>[] = [
    {
      expectedOutput: { contentType: 'application/pdf', extension: '.pdf' },
      input: ['schema.pdf', pdf],
      label: 'pdf with the PDF signature',
    },
    { expectedOutput: null, input: ['schema.pdf', executable], label: 'pdf extension on an executable is rejected' },
    {
      expectedOutput: { contentType: 'application/pdf', extension: '.pdf' },
      input: ['SCHEMA.PDF', pdf],
      label: 'extension check is case-insensitive',
    },
    { expectedOutput: { contentType: 'application/zip', extension: '.zip' }, input: ['trace.zip', zip], label: 'zip archive' },
    {
      expectedOutput: { contentType: 'application/vnd.google-earth.kmz', extension: '.kmz' },
      input: ['trace.kmz', zip],
      label: 'kmz is a zip container',
    },
    { expectedOutput: null, input: ['schema.doc', ole], label: 'office document (no request kind accepts it)' },
    {
      expectedOutput: { contentType: 'application/geopackage+sqlite3', extension: '.gpkg' },
      input: ['trace.gpkg', sqlite],
      label: 'geopackage (SQLite)',
    },
    {
      expectedOutput: { contentType: 'application/x-esri-shape', extension: '.shp' },
      input: ['trace.shp', shape],
      label: 'shapefile main file',
    },
    {
      expectedOutput: { contentType: 'application/x-esri-shape-index', extension: '.shx' },
      input: ['trace.shx', shape],
      label: 'shapefile index',
    },
    { expectedOutput: null, input: ['trace.shp', zip], label: 'shapefile with a wrong signature is rejected' },
    { expectedOutput: { contentType: 'application/x-dbf', extension: '.dbf' }, input: ['trace.dbf', dbf], label: 'dBase attributes' },
    {
      expectedOutput: { contentType: 'application/geo+json', extension: '.geojson' },
      input: ['trace.geojson', geojson],
      label: 'geojson object',
    },
    { expectedOutput: null, input: ['trace.kml', Buffer.from('not xml')], label: 'kml without xml content is rejected' },
    { expectedOutput: null, input: ['trace.prj', shape], label: 'prj with binary content is rejected' },
    { expectedOutput: null, input: ['trace.cpg', Buffer.alloc(0)], label: 'empty text file is rejected' },
    { expectedOutput: null, input: ['virus.exe', executable], label: 'unknown extension is rejected' },
    { expectedOutput: null, input: ['trace', geojson], label: 'no extension is rejected' },
  ];

  it.each(cases)('$label', ({ input: [filename, content], expectedOutput }) => {
    expect(detectFileType(filename, content)).toStrictEqual(expectedOutput);
  });
});
