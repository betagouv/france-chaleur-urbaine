import cx from '@/utils/cx';

import type { CSVAnalysis } from '../utils/csvColumnDetection';

export interface ColumnMapping {
  addressColumn?: number;
  latitudeColumn?: number;
  longitudeColumn?: number;
}

export type CSVImportTableProps = {
  analysis: CSVAnalysis;
  mapping: ColumnMapping;
  hasHeaders: boolean;
  dataType: 'address' | 'coordinates';
  className?: string;
};

const MAX_ROWS = 10;

const CSVImportTable = ({ analysis, hasHeaders, mapping, dataType, className }: CSVImportTableProps) => {
  const { headers, rows } = analysis;

  return (
    <section className={cx('space-y-2 border-t border-gray-200 pt-4', className)}>
      <div className="overflow-x-auto">
        <table className="fr-table fr-table--bordered min-w-full mb-0!">
          <thead>
            <tr>
              {headers.map((headerName, index) => {
                const isAddress = dataType === 'address' && mapping.addressColumn === index;
                const isLatitude = dataType === 'coordinates' && mapping.latitudeColumn === index;
                const isLongitude = dataType === 'coordinates' && mapping.longitudeColumn === index;
                const isHighlighted = isAddress || isLatitude || isLongitude;

                return (
                  <th
                    key={index}
                    className={cx(
                      'p-2 text-xs font-medium',
                      isAddress && 'bg-purple-100 text-purple-700',
                      isLatitude && 'bg-green-100 text-green-700',
                      isLongitude && 'bg-amber-100 text-amber-700',
                      !isHighlighted && 'bg-gray-100 text-gray-700'
                    )}
                  >
                    {hasHeaders ? headerName : String.fromCharCode(65 + index)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(hasHeaders ? 1 : 0, hasHeaders ? MAX_ROWS + 1 : MAX_ROWS).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((_, colIndex) => {
                  const cellValue = row[colIndex] || '';
                  const isAddress = dataType === 'address' && mapping.addressColumn === colIndex;
                  const isLatitude = dataType === 'coordinates' && mapping.latitudeColumn === colIndex;
                  const isLongitude = dataType === 'coordinates' && mapping.longitudeColumn === colIndex;
                  const isHighlighted = isAddress || isLatitude || isLongitude;

                  return (
                    <td
                      key={colIndex}
                      className={cx(
                        'p-2 text-xs max-w-32',
                        isAddress && 'bg-purple-50 text-purple-700',
                        isLatitude && 'bg-green-50 text-green-700',
                        isLongitude && 'bg-amber-50 text-amber-700',
                        !isHighlighted && 'text-gray-600'
                      )}
                    >
                      <div className="truncate" title={cellValue}>
                        {cellValue || <em className={isHighlighted ? '' : 'text-gray-400'}>vide</em>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CSVImportTable;
