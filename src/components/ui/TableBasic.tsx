import type React from 'react';

import cx from '@/utils/cx';

export type TableBasicProps = {
  /**
   * Table content (thead, tbody, etc.)
   */
  children: React.ReactNode;
  /**
   * Whether to add the bordered variant class
   */
  bordered?: boolean;
  /**
   * Whether to add the no-scroll variant class
   */
  noScroll?: boolean;
  /**
   * Whether to add the caption-bottom variant class
   */
  captionBottom?: boolean;
  /**
   * Whether to add the layout-fixed variant class
   */
  layoutFixed?: boolean;
  /**
   * Additional className for the fr-table div
   */
  className?: string;
  /**
   * Additional className for the table element
   */
  tableClassName?: string;
  /**
   * Additional props to pass to the table element
   */
  tableProps?: React.TableHTMLAttributes<HTMLTableElement>;
};

/**
 * TableBasic component that reproduces the structure of a classic DSFR table
 * with proper class names, while allowing full flexibility for colspan, rowspan, etc.
 *
 * Follows the DSFR structure:
 * - div.fr-table (with variants)
 *   - div.fr-table__wrapper
 *     - div.fr-table__container
 *       - div.fr-table__content
 *         - table
 *
 * @example
 * ```tsx
 * <TableBasic bordered>
 *   <thead>
 *     <tr>
 *       <th colSpan={2}>Header spanning 2 columns</th>
 *       <th>Header 3</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td rowSpan={2}>Cell spanning 2 rows</td>
 *       <td>Cell 1</td>
 *       <td>Cell 2</td>
 *     </tr>
 *     <tr>
 *       <td>Cell 3</td>
 *       <td>Cell 4</td>
 *     </tr>
 *   </tbody>
 * </TableBasic>
 * ```
 */
const TableBasic = ({
  children,
  className,
  tableClassName,
  tableProps,
  bordered = false,
  noScroll = false,
  captionBottom = false,
  layoutFixed = false,
}: TableBasicProps) => {
  const tableWrapperClasses = cx(
    'fr-table',
    bordered && 'fr-table--bordered',
    noScroll && 'fr-table--no-scroll',
    captionBottom && 'fr-table--caption-bottom',
    layoutFixed && 'fr-table--layout-fixed',
    className
  );

  const finalTableClassName = cx(
    '[&_th]:wrap-break-word! [&_td]:wrap-break-word!',
    '[&_th]:whitespace-normal! [&_td]:whitespace-normal!',
    tableClassName
  );

  return (
    <div className={tableWrapperClasses}>
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table className={finalTableClassName} {...tableProps}>
              {children}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableBasic;
