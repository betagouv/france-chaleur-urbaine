import { fr } from '@codegouvfr/react-dsfr';
import { Pagination, type PaginationProps } from '@codegouvfr/react-dsfr/Pagination';
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

type CustomPaginationProps = Omit<PaginationProps, 'count' | 'defaultPage' | 'getPageLinkProps'>;

export type AdditionalTableProps = {
  paginationProps?: CustomPaginationProps;
  pageSize?: number;
};

export function CustomPagination({ className, ...props }: CustomPaginationProps) {
  const apiRef = useGridApiContext();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Pagination
      className={`${fr.cx('fr-mx-auto')} ${className ?? ''}`}
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
  pageSize = 10,
  paginationProps,
  columns,
  initialState,
  ...props
}: DataGridProps<T> & AdditionalTableProps) => {
  return (
    <DataGrid
      style={{ width: '100%', ...style }}
      onCellKeyDown={(params, event) => {
        // permet de ne pas utiliser la navigation clavier de MUI, qui empêche notamment les espaces
        // dans les champs Input
        event.defaultMuiPrevented = true;
      }}
      disableVirtualization
      columns={columns.map((column) => ({
        ...column,
        renderHeader: column.renderHeader ?? (() => <ColHeader>{column?.headerName}</ColHeader>),
      }))}
      initialState={{
        pagination: { paginationModel: { pageSize } },
        ...(initialState ?? {}),
      }}
      slots={{
        pagination: () => <CustomPagination {...paginationProps} />,
      }}
      sx={{
        '&': {
          gap: '20px',
        },
        // header
        '& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeaders .MuiDataGrid-filler': {
          backgroundColor: 'var(--background-alt-grey)',
          borderBottom: '2px solid #333333',
        },

        // fix tooltips in headers
        '& .MuiDataGrid-columnHeaderTitleContainer, & .MuiDataGrid-columnHeaderTitleContainerContent': {
          overflow: 'visible',
          fontWeight: 'bold',
        },
        '& .MuiDataGrid-columnHeader--last': {
          overflow: 'initial !important',
        },

        // always display sort icons, not just on hover
        '& .MuiDataGrid-iconButtonContainer': {
          visibility: 'visible',
          width: 'auto',
        },
        '& .MuiDataGrid-columnHeader:not(.MuiDataGrid-columnHeader--sorted) .MuiDataGrid-sortIcon': {
          opacity: 0.3,
        },

        '& .MuiDataGrid-footerContainer': {
          marginTop: '20px',
          borderTop: 'none',
        },

        // cell
        '& .MuiDataGrid-cell': {
          display: 'flex',
          alignItems: 'center',
          lineHeight: '20px',
          textWrap: 'balance',
        },

        // disable cell focus outline
        '.MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus, .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-cell:focus-within':
          {
            outline: 'none !important',
          },
        ...sx,
      }}
      {...props}
    />
  );
};
