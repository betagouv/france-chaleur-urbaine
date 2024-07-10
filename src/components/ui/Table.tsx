import { Pagination } from '@codegouvfr/react-dsfr/Pagination';
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

export function CustomPagination() {
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Pagination
      count={pageCount}
      defaultPage={paginationModel.page + 1}
      getPageLinkProps={(page) => ({
        onClick: () => apiRef.current.setPage(page - 1),
        href: '#',
      })}
      showFirstLast
    />
  );
}

export const Table = <T extends GridValidRowModel>({
  sx,
  style,
  autoHeight = true,
  ...props
}: DataGridProps<T>) => {
  return (
    <DataGrid
      style={{ width: '100%', ...style }}
      autoHeight={autoHeight}
      slots={
        {
          // TODO : add custom pagination when https://github.com/codegouvfr/react-dsfr/pull/273/commits is merged
          // pagination: CustomPagination,
        }
      }
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
