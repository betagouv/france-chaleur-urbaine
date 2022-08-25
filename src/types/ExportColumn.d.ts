export interface ExportColumn<T> {
  header: string;
  value: keyof T | ((value: T) => string);
}
