import { fr } from '@codegouvfr/react-dsfr';
import {
  Pagination,
  type PaginationProps,
} from '@codegouvfr/react-dsfr/Pagination';
import {
  DataGrid,
  GridValidRowModel,
  gridPageCountSelector,
  gridPaginationModelSelector,
  useGridApiContext,
  useGridSelector,
  type DataGridProps,
  type GridColDef,
} from '@mui/x-data-grid';
import { ColHeader } from './Table.style';

export type ColumnDef<T extends GridValidRowModel> = GridColDef<T>;

type CustomPaginationProps = Omit<
  PaginationProps,
  'count' | 'defaultPage' | 'getPageLinkProps'
>;

export type AdditionalTableProps = {
  paginationProps?: CustomPaginationProps;
  pageSize?: number;
};

export function CustomPagination({
  className,
  ...props
}: CustomPaginationProps) {
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Pagination
      className={`${fr.cx('fr-mt-3w', 'fr-mx-auto')} ${className ?? ''}`}
      count={pageCount}
      defaultPage={paginationModel.page + 1}
      getPageLinkProps={(page) => ({
        onClick: () => apiRef.current.setPage(page - 1),
        href: '#',
      })}
      {...props}
    />
  );
}

export const Table = <T extends GridValidRowModel>({
  sx,
  style,
  autoHeight = true,
  pageSize = 10,
  paginationProps,
  autoPageSize = false,
  columns,
  ...props
}: DataGridProps<T> & AdditionalTableProps) => {
  return (
    <DataGrid
      style={{ width: '100%', ...style }}
      autoHeight={autoHeight}
      autoPageSize={autoPageSize}
      columns={columns.map((column) => ({
        ...column,
        renderHeader:
          column.renderHeader ??
          (() => <ColHeader>{column?.headerName}</ColHeader>),
      }))}
      initialState={{
        pagination: { paginationModel: { pageSize } },
      }}
      slots={{
        pagination: () => <CustomPagination {...paginationProps} />,
      }}
      sx={{
        '& .MuiDataGrid-cell': {
          display: 'flex',
          alignItems: 'center',
        },
        '& .MuiDataGrid-columnHeaders div[role=row]': {
          backgroundColor: 'var(--background-default-grey)',
          borderBottom: '1px solid #333333',
        },
        '& .MuiDataGrid-columnHeaders': {
          borderBottom: '1px solid #333333',
        },
        '& .MuiDataGrid-columnHeader': {
          overflow: 'visible',
        },
        ...sx,
      }}
      {...props}
    />
  );
};
