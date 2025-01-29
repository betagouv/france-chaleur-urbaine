export interface ImportAdapter {
  importData(filepath?: string): Promise<any>;
}
