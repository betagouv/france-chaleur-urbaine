import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

import Papa from 'papaparse';
import XLSX from 'xlsx';

type PapaParseOptions = Parameters<typeof Papa.parse>[1];

const loadCsvFile = async (filePath: string, options: PapaParseOptions = {}): Promise<any[]> => {
  try {
    const data = await readFile(filePath, 'utf8');

    return new Promise((resolve, reject) => {
      Papa.parse(data, {
        dynamicTyping: true, // Convertir les valeurs en types JavaScript (nombre, booléen, etc.)
        header: true, // Si le CSV a une ligne d'en-tête
        ...options,
        complete: (result) => {
          resolve(result.data); // Retourne les données extraites
        },
        error: (error: any) => {
          reject(error.message); // En cas d'erreur lors de l'analyse
        },
      });
    });
  } catch (error: any) {
    throw new Error(`Erreur dans la lecture ou l'analyse du fichier ${filePath}: ${error.message}`);
  }
};

export const loadDataFromFile = async (filepath: string, options: Parameters<typeof loadCsvFile>[1] = {}) => {
  const ext = extname(filepath).toLowerCase();

  if (ext === '.csv') {
    const data = await loadCsvFile(filepath, options);
    return data;
  }

  throw new Error('Format de fichier non pris en charge');
};

export const loadXlsxFromFile = async (filepath: string, sheetName?: string): Promise<Record<string, unknown>[]> => {
  const buffer = await readFile(filepath);
  const workbook = XLSX.read(buffer);
  const name = sheetName ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    throw new Error(`Sheet "${name}" not found in ${filepath}. Available: ${workbook.SheetNames.join(', ')}`);
  }
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
};
