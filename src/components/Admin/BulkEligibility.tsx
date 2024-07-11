import { Input } from '@codegouvfr/react-dsfr/Input';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import { Table, type ColumnDef } from '@components/ui/Table';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
import DownloadButton from './DownloadButton';
import { TableContainer } from './Users.styles';

const columns: ColumnDef<EligibilityDemand>[] = [
  { field: 'id', headerName: 'Id', minWidth: 300 },
  {
    field: 'emails',
    headerName: 'Emails',
    minWidth: 200,
    valueGetter: (value) => (value as string[]).join(', '),
  },
  {
    field: 'created_at',
    headerName: 'Date',
    type: 'date',
    valueGetter: (value) => new Date(value),
  },
  { field: 'version', headerName: 'Version' },
  { field: 'addresses_count', headerName: "Nombre d'adresses", type: 'number' },
  { field: 'error_count', headerName: "Nombre d'erreurs", type: 'number' },
  {
    field: 'eligibile_count',
    headerName: "Nombre d'adresses éligibles",
    type: 'number',
  },
  {
    field: 'in_error',
    headerName: 'En erreur',
    valueGetter: (value) => (value ? 'Oui' : 'Non'),
  },
  {
    field: 'download',
    headerName: 'Télécharger',
    renderCell: (params) => (
      <DownloadButton id={params.row.id} inError={params.row.in_error} />
    ),
  },
  {
    field: 'map',
    headerName: 'Carte',
    renderCell: (params) => (
      <Link href={`/carte?id=${params.row.id}`}>
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

  useEffect(() => {
    adminService.getEligibilityDemand().then(setEligibilityDemands);
  }, [adminService]);

  const filteredEligibilityDemands = useMemo(() => {
    return filter
      ? eligibilityDemands.filter((demand) =>
          demand.emails.some((email) => email.includes(filter.toLowerCase()))
        )
      : eligibilityDemands;
  }, [eligibilityDemands, filter]);

  const totalDemands = filteredEligibilityDemands
    .filter((demand) => !demand.in_error)
    .reduce((acc, value) => acc + value.addresses_count - value.error_count, 0);
  const totalTestedAddresses = filteredEligibilityDemands
    .filter((demand) => !demand.in_error)
    .reduce((acc, value) => acc + value.eligibile_count, 0);
  return (
    <>
      <TableContainer>
        <Box display="flex">
          <Heading as="h3" mx="2w">
            {`Demandes d'éligibilités - ${totalDemands.toLocaleString(
              'fr-FR'
            )} adresses testées - ${totalTestedAddresses.toLocaleString(
              'fr-FR'
            )} adresses éligibles`}
          </Heading>
          <Input
            label=""
            nativeInputProps={{
              placeholder: 'Email',
              value: filter,
              onChange: (e) => setFilter(e.target.value),
            }}
          />
        </Box>
        <Table
          columns={columns}
          rows={filteredEligibilityDemands}
          autoHeight
          getRowHeight={() => 'auto'}
        />
        {filteredEligibilityDemands.length === 0 && <p>Pas de résultat</p>}
      </TableContainer>
    </>
  );
};

export default BulkEligibility;
