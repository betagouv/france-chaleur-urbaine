import archiver from 'archiver';
import base64 from 'base64-stream';
import getStream from 'get-stream';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import XLSX from 'xlsx';

const convertToStringArray = (columns: string[], data: any[]): string[][] => {
  return [columns].concat(data.map((d) => columns.map((c) => d[c])));
};

export const getSpreadSheet = (
  columns: string[],
  data: any[],
  format: EXPORT_FORMAT
): any => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(convertToStringArray(columns, data));
  XLSX.utils.book_append_sheet(wb, ws);

  return XLSX.write(wb, { bookType: format, type: 'string' });
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
