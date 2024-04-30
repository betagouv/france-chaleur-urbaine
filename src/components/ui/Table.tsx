import { Table as DSFRTable } from '@codegouvfr/react-dsfr/Table';
import type { TableProps as DSFRTableProps } from '@codegouvfr/react-dsfr/Table';
import { ReactNode, useMemo } from 'react';

export interface TableColumnDef<T> {
  key: keyof T;
  label: string;
  render?: (row: any) => ReactNode;
}

interface TableProps<T> {
  columns: TableColumnDef<T>[];
  data: T[];
}

function Table<T>({ columns, data, ...props }: TableProps<T>) {
  const [headers, rows] = useMemo(() => {
    return [
      columns.map((c) => c.label),
      data.map((obj) =>
        columns.map((c) => {
          return c.render ? c.render(obj[c.key]) : (obj[c.key] as ReactNode);
        })
      ),
    ];
  }, [columns, data]);

  return (
    <DSFRTable headers={headers} data={rows} />
    // TODO pagination

    //   <Table
    //   headers={columns}
    //   data={filteredUsers}
    //   rowKey="email"
    //   pagination
    //   paginationPosition="center"
    //   page={page}
    //   setPage={setPage}
    // />
  );
}
export default Table;
