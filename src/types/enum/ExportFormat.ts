export const EXPORT_FORMAT = {
  CSV: 'csv',
  XLSX: 'xlsx',
} as const;
export type EXPORT_FORMAT = (typeof EXPORT_FORMAT)[keyof typeof EXPORT_FORMAT];
