import Papa from 'papaparse';

export type ColumnType = 'address' | 'latitude' | 'longitude' | 'text' | 'number' | 'unknown';

export type CSVColumn = {
  index: number;
  name: string;
  type: ColumnType;
  confidence: number; // 0-1 score for type detection confidence
};

export type CSVAnalysis = ReturnType<typeof analyzeCSV>;
/**
 * Analyzes CSV content and detects column types using PapaParse
 */
export function analyzeCSV(content: string, separator?: string) {
  // Use PapaParse to auto-detect delimiter and parse
  const papaResult = Papa.parse<string[]>(content, {
    delimiter: separator,
    skipEmptyLines: true,
  });

  if (!papaResult.data || papaResult.data.length === 0) {
    throw new Error('Empty or invalid CSV file');
  }

  // PapaParse may return rows as arrays or objects, but we want arrays
  const rows: string[][] = papaResult.data as string[][];
  if (rows.length === 0) {
    throw new Error('Could not parse CSV data');
  }

  const headers = rows[0];

  const columns: CSVColumn[] = headers.map((header, index) => {
    const columnData = rows.map((row) => row[index] || '').filter((val) => val.trim() !== '');

    const type = detectColumnType(header, columnData);
    const confidence = calculateConfidence(header, columnData, type);

    return {
      confidence,
      index,
      name: header,
      type,
    };
  });

  // Find suggested columns
  const suggestedAddressColumn = findBestAddressColumn(columns);
  const suggestedLatitudeColumn = findBestLatitudeColumn(columns);
  const suggestedLongitudeColumn = findBestLongitudeColumn(columns);

  return {
    columns,
    hasCoordinateColumns: suggestedLatitudeColumn !== undefined && suggestedLongitudeColumn !== undefined,
    headers,
    nbRows: rows.length,
    rows: rows.slice(0, 10),
    separator: separator || papaResult.meta.delimiter,
    suggestedAddressColumn,
    suggestedLatitudeColumn,
    suggestedLongitudeColumn,
  };
}

/**
 * Detects the type of a column based on header name and data content
 */
function detectColumnType(header: string, values: string[]): ColumnType {
  const headerLower = header.toLowerCase().trim();

  // Address patterns
  const addressPatterns = ['adresse', 'address', 'rue', 'street', 'voie', 'lieu', 'location', 'localisation', 'addr'];

  // Latitude patterns
  const latitudePatterns = ['lat', 'latitude', 'y', 'northing', 'nord'];

  // Longitude patterns
  const longitudePatterns = ['lon', 'lng', 'longitude', 'x', 'easting', 'est'];

  // Check header patterns first
  if (addressPatterns.some((pattern) => headerLower.includes(pattern))) {
    return 'address';
  }

  if (latitudePatterns.some((pattern) => headerLower === pattern || headerLower.includes(pattern))) {
    return 'latitude';
  }

  if (longitudePatterns.some((pattern) => headerLower === pattern || headerLower.includes(pattern))) {
    return 'longitude';
  }

  // Analyze data content
  const numericValues = values.filter(isNumericValue);
  const numericRatio = values.length > 0 ? numericValues.length / values.length : 0;

  // If mostly numeric and values look like coordinates
  if (numericRatio > 0.8 && numericValues.length > 0) {
    const floatValues = numericValues.map(parseFloat).filter((v) => !Number.isNaN(v));

    if (floatValues.length > 0) {
      const minVal = Math.min(...floatValues);
      const maxVal = Math.max(...floatValues);

      // Latitude range: -90 to 90, but for France roughly 41-51
      if (minVal >= -90 && maxVal <= 90 && minVal >= 40 && maxVal <= 55) {
        return 'latitude';
      }

      // Longitude range: -180 to 180, but for France roughly -5 to 10
      if (minVal >= -180 && maxVal <= 180 && minVal >= -10 && maxVal <= 15) {
        return 'longitude';
      }

      return 'number';
    }
  }

  // Check if looks like address content
  if (values.some((value) => containsAddressKeywords(value))) {
    return 'address';
  }

  return numericRatio > 0.5 ? 'number' : 'text';
}

/**
 * Calculates confidence score for column type detection
 */
function calculateConfidence(header: string, values: string[], detectedType: ColumnType): number {
  const headerLower = header.toLowerCase().trim();
  let confidence = 0.5; // Base confidence

  // Header name boost
  switch (detectedType) {
    case 'address':
      if (['adresse', 'address'].includes(headerLower)) confidence += 0.4;
      else if (headerLower.includes('adresse') || headerLower.includes('address')) confidence += 0.2;
      break;

    case 'latitude':
      if (['lat', 'latitude', 'y'].includes(headerLower)) confidence += 0.4;
      else if (headerLower.includes('lat') || headerLower.includes('y')) confidence += 0.2;
      break;

    case 'longitude':
      if (['lon', 'lng', 'longitude', 'x'].includes(headerLower)) confidence += 0.4;
      else if (headerLower.includes('lon') || headerLower.includes('x')) confidence += 0.2;
      break;
  }

  // Data content validation boost
  if (detectedType === 'address' && values.some((v) => containsAddressKeywords(v))) {
    confidence += 0.1;
  }

  if (
    (detectedType === 'latitude' || detectedType === 'longitude') &&
    values.filter(isNumericValue).length / Math.max(values.length, 1) > 0.9
  ) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1);
}

/**
 * Checks if a value is numeric
 */
function isNumericValue(value: string): boolean {
  const trimmed = value.trim();
  return trimmed !== '' && !Number.isNaN(parseFloat(trimmed)) && Number.isFinite(parseFloat(trimmed));
}

/**
 * Checks if text contains address-like keywords
 */
function containsAddressKeywords(text: string): boolean {
  const addressKeywords = [
    'rue',
    'avenue',
    'boulevard',
    'place',
    'cours',
    'allée',
    'impasse',
    'street',
    'avenue',
    'road',
    'drive',
    'lane',
    'way',
    'résidence',
    'lotissement',
    'parc',
    'villa',
  ];

  const textLower = text.toLowerCase();
  return addressKeywords.some((keyword) => textLower.includes(keyword));
}

/**
 * Finds the best column for addresses
 */
function findBestAddressColumn(columns: CSVColumn[]): number | undefined {
  const addressColumns = columns.filter((col) => col.type === 'address');

  if (addressColumns.length === 0) {
    return undefined;
  }

  // Return the one with highest confidence
  const bestColumn = addressColumns.reduce((best, current) => (current.confidence > best.confidence ? current : best));

  return bestColumn.index;
}

/**
 * Finds the best column for latitude
 */
function findBestLatitudeColumn(columns: CSVColumn[]): number | undefined {
  const latColumns = columns.filter((col) => col.type === 'latitude');

  if (latColumns.length === 0) {
    return undefined;
  }

  const bestColumn = latColumns.reduce((best, current) => (current.confidence > best.confidence ? current : best));

  return bestColumn.index;
}

/**
 * Finds the best column for longitude
 */
function findBestLongitudeColumn(columns: CSVColumn[]): number | undefined {
  const lonColumns = columns.filter((col) => col.type === 'longitude');

  if (lonColumns.length === 0) {
    return undefined;
  }

  const bestColumn = lonColumns.reduce((best, current) => (current.confidence > best.confidence ? current : best));

  return bestColumn.index;
}

/**
 * Formats column mapping for form submission
 */
export type ColumnMapping = {
  addressColumn?: number;
  latitudeColumn?: number;
  longitudeColumn?: number;
};
