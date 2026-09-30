/**
 * Neutralizes spreadsheet formula injection: a cell starting with `=`, `+`, `-`, `@`, tab or carriage return is executed
 * as a formula by Excel / LibreOffice when the export is opened. Prefixing with an apostrophe keeps it as text.
 * Applies to any user-provided text ending in an export (names, comments, addresses).
 */
export const escapeSpreadsheetFormula = <T>(value: T): T | string =>
  typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
