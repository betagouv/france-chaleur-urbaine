import XLSX from 'xlsx';

import { downloadFile } from '@/utils/browser';

interface ExportColumn<T extends Record<string, any>> {
  accessorKey: keyof T;
  name: string;
  precision?: number;
}

interface SheetData<T extends Record<string, any>> {
  data: T[];
  name: string;
  columns?: ExportColumn<T>[];
}

const processData = <T extends Record<string, any>>(items: T[], columns: ExportColumn<T>[]): Record<string, any>[] => {
  const data: Record<string, any>[] = [];

  items.forEach((item) => {
    const row: Record<string, any> = {};

    columns.forEach((col) => {
      let value: string | string[] | number[] | number | boolean = item[col.accessorKey];
      if (Array.isArray(value)) {
        value = value.join(',');
      } else if (typeof value === 'boolean') {
        value = value ? 'Oui' : 'Non';
      } else if (typeof value === 'number') {
        value = parseFloat(value.toFixed(typeof col.precision === 'number' ? col.precision : 0));
      } else {
        value = value?.toString();
      }

      row[col.name] = value;
    });

    data.push(row);
  });

  return data;
};

const exportAsXLSX = <T extends any[]>(
  fileName: string = `${new Date().toISOString().split('T')[0]}_export.xlsx`,
  sheets: { [I in keyof T]: SheetData<T[I]> }
) => {
  if (!fileName.endsWith('.xlsx')) {
    throw new Error('Le nom du fichier doit se terminer par .xlsx');
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    const processedData = sheet.columns ? processData(sheet.data, sheet.columns) : sheet.data;
    const xlsxSheet = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(workbook, xlsxSheet, sheet.name);
  });

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  downloadFile(url, fileName);
};

export { exportAsXLSX, type ExportColumn, processData, type SheetData };
