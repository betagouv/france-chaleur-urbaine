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

export type ColumnDef<T extends GridValidRowModel> = GridColDef<T>;

export type AdditionalTableProps = {
  paginationProps?: Omit<
    PaginationProps,
    'count' | 'defaultPage' | 'getPageLinkProps'
  >;
};

export function CustomPagination({
  className,
  ...props
}: AdditionalTableProps['paginationProps']) {
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Pagination
      className={fr.cx('fr-mt-3w', className)}
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
  paginationProps,
  ...props
}: DataGridProps<T> & AdditionalTableProps) => {
  return (
    <DataGrid
      style={{ width: '100%', ...style }}
      autoHeight={autoHeight}
      slots={{
        pagination: () => <CustomPagination {...paginationProps} />,
      }}
      sx={{
        '& .MuiDataGrid-columnHeaders div[role=row]': {
          'background-color': 'var(--background-default-grey)',
          'border-bottom': '1px solid #333333',
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
