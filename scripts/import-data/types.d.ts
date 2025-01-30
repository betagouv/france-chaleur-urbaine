export interface ImportDataAdapter {
  importData(filepath?: string): Promise<any>;
}
