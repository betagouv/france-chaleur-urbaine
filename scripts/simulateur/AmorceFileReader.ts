import XLSX from 'xlsx';

export type Communes = Commune[];

export interface Commune {
  'Code commune INSEE': number;
  'Code postal': number;
  Commune: string;
  Département: number;
  'Nom département': string;
  'Altitude moyenne': number;
  'T°C réf / altitude_moyenne': number;
  'Source ': string;
  'Sous-zones climatiques': string;
}

export interface Departement {
  'Nom département'?: string;
  'Code département': any;
  'DJU chaud moyen'?: number;
  'DJU froid moyen'?: number;
  'Zone climatique'?: string;
  'Source '?: string;
  Année: string;
}

export default class AmorceFileReader {
  private filePath: string;
  private workbook: XLSX.WorkBook;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.workbook = XLSX.readFile(this.filePath);
  }

  public getSheetData(sheetName: string): (string | number)[][] {
    const sheet = this.workbook.Sheets[sheetName];

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    return XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  public getDataFromRow<T>(rawData: ReturnType<typeof this.getSheetData>, rowIndex: number) {
    const headers = rawData[rowIndex] as string[];

    const data = rawData.slice(rowIndex + 1).map((row) => {
      const lineData: any = {};
      headers.forEach((header: string, index: number) => {
        lineData[header] = row[index] || null;
      });
      return lineData as T;
    });

    return data;
  }

  public getCityData() {
    const rawData = this.getSheetData('Communes');
    return this.getDataFromRow<Commune>(rawData, 4);
  }

  public getDepartementData() {
    const rawData = this.getSheetData('Départements');
    return this.getDataFromRow<Departement>(rawData, 4).filter((d) => d['Code département'] !== null);
  }
}
