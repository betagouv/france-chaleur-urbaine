import { Input } from '@codegouvfr/react-dsfr/Input';
//import Table, { type TableColumnDef } from '@components/ui/Table';
import { Table } from '@codegouvfr/react-dsfr/Table';
//import Icon from '@components/ui/Icon';
//import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
//import DownloadButton from './DownloadButton';
import { TableContainer } from './Users.styles';
import Heading from '@components/ui/Heading';
import Box from '@components/ui/Box';

/*const columns: TableColumnDef<
  EligibilityDemand & { download: any; map: any }
>[] = [
  { key: 'id', label: 'Id' },
  {
    key: 'emails',
    label: 'Emails',
    //si email vide ne pas faire le join
    render: ({ emails }: EligibilityDemand) =>
      emails ? emails.join(', ') : [], //si email vide ne pas faire le join
  },
  {
    key: 'created_at',
    label: 'Date',
    render: ({ created_at }: EligibilityDemand) =>
      new Date(created_at).toLocaleDateString(),
  },
  { key: 'version', label: 'Version' },
  { key: 'addresses_count', label: "Nombre d'adresses" },
  { key: 'error_count', label: "Nombre d'erreurs" },
  { key: 'eligibile_count', label: "Nombre d'adresses éligibles" },
  {
    key: 'in_error',
    label: 'En erreur',
    render: (param: EligibilityDemand) =>
      param && param.in_error ? 'Oui' : 'Non',
  },
  {
    key: 'download',
    label: 'Telecharger',
    render: (param: EligibilityDemand) =>
      param ? <DownloadButton id={param.id} inError={param.in_error} /> : null,
  },
  {
    key: 'map',
    label: 'Carte',
    render: (param: EligibilityDemand) =>
      param ? (
        <Link href={`/carte?id=${param.id}`}>
          <button>
            <Icon name="ri-road-map-line" size="lg" />
          </button>
        </Link>
      ) : null,
  },
];*/

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
        <Table
          headers={headers}
          data={filteredEligibilityDemands.map((demande) =>
            Object.values(demande)
          )} //filteredEligibilityDemands
          //rowKey="id"
          //pagination
          //paginationPosition="center"
          //page={page}
          //setPage={setPage}
          /*filteredEligibilityDemands.map((demand) => ({
            ...demand,
            download: demand.download,
            map: demand.map,
          }))*/
        />
        {filteredEligibilityDemands.length === 0 && <p>Pas de résultat</p>}
      </TableContainer>
    </>
  );
};

export default BulkEligibility;
