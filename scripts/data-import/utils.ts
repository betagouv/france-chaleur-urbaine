import fs from 'fs';
import path from 'path';

import Papa from 'papaparse';

type PapaParseOptions = Parameters<typeof Papa.parse>[1];

const loadCsvFile = async (filePath: string, options: PapaParseOptions = {}): Promise<any[]> => {
  try {
    const data = await fs.promises.readFile(filePath, 'utf8'); // Utilisation de la version promesse de readFile

    return new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true, // Si le CSV a une ligne d'en-tête
        dynamicTyping: true, // Convertir les valeurs en types JavaScript (nombre, booléen, etc.)
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
  const ext = path.extname(filepath).toLowerCase();

  if (ext === '.csv') {
    const data = await loadCsvFile(filepath, options);
    return data;
  }

  throw new Error('Format de fichier non pris en charge');
};
