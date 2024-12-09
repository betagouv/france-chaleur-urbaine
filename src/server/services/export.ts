import archiver from 'archiver';
import base64 from 'base64-stream';
import getStream from 'get-stream';
import XLSX from 'xlsx';

import { EXPORT_FORMAT } from '@/types/enum/ExportFormat';
import { type ExportColumn } from '@/types/ExportColumn';

const convertToStringArray = (columns: ExportColumn<any>[], data: any[]): string[][] => {
  return [columns.map((column) => column.header)].concat(
    data.map((d) => columns.map((column) => (typeof column.value === 'function' ? column.value(d) : d[column.value])))
  );
};

export const getSpreadSheet = <T>(columns: ExportColumn<T>[], data: T[], format: EXPORT_FORMAT): any => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(convertToStringArray(columns, data));
  XLSX.utils.book_append_sheet(wb, ws);

  return XLSX.write(wb, {
    bookType: format,
    type: format === EXPORT_FORMAT.CSV ? 'string' : 'buffer',
  });
};

export const zip = async (files: any[], name: string): Promise<any> => {
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  const encoder = new base64.Base64Encode();
  const b64s = archive.pipe(encoder);
  files.forEach((file) => {
    archive.append(Buffer.from(file.sheet), { name: file.name });
  });
  archive.finalize();

  const content = await getStream(b64s);
  return { content, name: `${name}.zip` };
};
