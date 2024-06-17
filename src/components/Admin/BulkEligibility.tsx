import {
  DataGrid,
  GridCellParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { Input } from '@codegouvfr/react-dsfr/Input';
import Icon from '@components/ui/Icon';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
import DownloadButton from './DownloadButton';
import { TableContainer } from './Users.styles';
import Heading from '@components/ui/Heading';
import Box from '@components/ui/Box';

const columns = [
  { field: 'id', headerName: 'Id' },
  {
    field: 'emails',
    headerName: 'Emails',
    valueGetter: (params: GridCellParams) =>
      (params.row as EligibilityDemand).emails.join(', '),
  },
  {
    field: 'created_at',
    headerName: 'Date',
    valueGetter: (params: GridCellParams) =>
      new Date(
        (params.row as EligibilityDemand).created_at
      ).toLocaleDateString(),
  },
  { field: 'version', headerName: 'Version' },
  { field: 'addresses_count', headerName: "Nombre d'adresses" },
  { field: 'error_count', headerName: "Nombre d'erreurs" },
  { field: 'eligibile_count', headerName: "Nombre d'adresses éligibles" },
  {
    field: 'in_error',
    headerName: 'En erreur',
    valueGetter: (params: GridCellParams) =>
      (params.row as EligibilityDemand).in_error ? 'Oui' : 'Non',
  },
  {
    field: 'download',
    headerName: 'Telecharger',
    renderCell: (params: GridRenderCellParams) => (
      <DownloadButton
        id={(params.row as EligibilityDemand).id}
        inError={(params.row as EligibilityDemand).in_error}
      />
    ),
  },
  {
    field: 'map',
    headerName: 'Carte',
    renderCell: (params: GridRenderCellParams) => (
      <Link href={`/carte?id=${(params.row as EligibilityDemand).id}`}>
        <button>
          <Icon name="ri-road-map-line" size="lg" />
        </button>
      </Link>
    ),
  },
];

const BulkEligibility = () => {
  const { adminService } = useServices();

  const [filter, setFilter] = useState('');
  const [eligibilityDemands, setEligibilityDemands] = useState<
    EligibilityDemand[]
  >([]);
  //const [page, setPage] = useState(1);

  useEffect(() => {
    adminService.getEligibilityDemand().then(setEligibilityDemands);
  }, [adminService]);

  const filteredEligibilityDemands = useMemo(() => {
    //setPage(1);
    return filter
      ? eligibilityDemands.filter((demand) =>
          demand.emails.some((email) => email.includes(filter.toLowerCase()))
        )
      : eligibilityDemands;
  }, [eligibilityDemands, filter]);

  return (
    <>
      <TableContainer>
        <Box display="flex">
          <Heading as="h3" mx="2w">
            {`Demandes d'éligibilités - ${filteredEligibilityDemands
              .filter((demand) => !demand.in_error)
              .reduce(
                (acc, value) => acc + value.addresses_count - value.error_count,
                0
              )} adresses testées - ${filteredEligibilityDemands
              .filter((demand) => !demand.in_error)
              .reduce(
                (acc, value) => acc + value.eligibile_count,
                0
              )} adresses éligibles`}
          </Heading>
          <Input
            label="Email"
            nativeInputProps={{
              placeholder: 'Email',
              value: filter,
              onChange: (e) => setFilter(e.target.value),
            }}
          />
        </Box>
        <DataGrid columns={columns} rows={filteredEligibilityDemands} />
        {filteredEligibilityDemands.length === 0 && <p>Pas de résultat</p>}
      </TableContainer>
    </>
  );
};

export default BulkEligibility;
/*
        <Table
          data={filteredEligibilityDemands.map((demande) =>
            Object.values(demande)
          )}
          rowKey="id"
          pagination
          paginationPosition="center"
          page={page}
          setPage={setPage}
        />
const headers = [
  'id',
  'emails',
  'created_at',
  'version',
  'addresses_count',
  'error_count',
  'eligibile_count',
  'in_error',
  'download',
  'map',
];
        */
