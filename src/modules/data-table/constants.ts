import type { RowHeight } from './types';

/** Fixed row heights in pixels; every row of a table shares the same height (no measurement). */
export const ROW_HEIGHTS = { lg: 80, md: 56, sm: 40 } as const satisfies Record<RowHeight, number>;

/** Lines of text a default cell may show per row height. */
export const ROW_LINE_CLAMP = { lg: 'line-clamp-3', md: 'line-clamp-2', sm: 'line-clamp-1' } as const satisfies Record<RowHeight, string>;

/** Above this number of rows, `virtualize: 'auto'` switches to virtualized rendering. */
export const VIRTUALIZE_THRESHOLD = 100;

export const DEFAULT_TABLE_HEIGHT = '600px';

export const LOADING_ROWS_COUNT = 5;

/** Width reserved for columns without an explicit width when computing the table minimum width. */
export const DEFAULT_COLUMN_MIN_WIDTH = 100;

export const SELECTION_COLUMN_WIDTH = 44;
