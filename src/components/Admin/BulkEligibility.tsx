import { Icon, Table, TextInput } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { EligibilityDemand } from 'src/types/EligibilityDemand';
import DownloadButton from './DownloadButton';
import { TableContainer } from './Users.styles';

const columns = [
  { name: 'id', label: 'Id' },
  {
    name: 'emails',
    label: 'Emails',
    render: ({ emails }: EligibilityDemand) => emails.join(', '),
  },
  {
    name: 'created_at',
    label: 'Date',
    render: ({ created_at }: EligibilityDemand) =>
      new Date(created_at).toLocaleDateString(),
  },
  { name: 'version', label: 'Version' },
  { name: 'addresses_count', label: "Nombre d'adresses" },
  { name: 'error_count', label: "Nombre d'erreurs" },
  { name: 'eligibile_count', label: "Nombre d'adresses éligibles" },
  {
    name: 'in_error',
    label: 'En erreur',
    render: ({ in_error }: EligibilityDemand) => (in_error ? 'Oui' : 'Non'),
  },
  {
    name: 'download',
    label: 'Telecharger',
    render: ({ id, in_error }: EligibilityDemand) => (
      <DownloadButton id={id} inError={in_error} />
    ),
  },
  {
    name: 'map',
    label: 'Carte',
    render: ({ id }: EligibilityDemand) => (
      <Link href={`/carte?id=${id}`}>
        <button>
          <Icon name="ri-road-map-line" size="2x" />
        </button>
      </Link>
    ),
  },
];

const BulkEligibility = () => {
  const { adminService } = useServices();

  const [filter, setFilter] = useState('');
  const [filteredEligibilityDemands, setFilteredEligibilityDemands] = useState<
    EligibilityDemand[]
  >([]);
  const [eligibilityDemands, setEligibilityDemands] = useState<
    EligibilityDemand[]
  >([]);

  useEffect(() => {
    adminService.getEligibilityDemand().then(setEligibilityDemands);
  }, [adminService]);

  useEffect(() => {
    if (filter) {
      setFilteredEligibilityDemands(
        eligibilityDemands.filter((demand) =>
          demand.emails.some((email) => email.includes(filter.toLowerCase()))
        )
      );
    } else {
      setFilteredEligibilityDemands(eligibilityDemands);
    }
  }, [eligibilityDemands, filter]);

  return (
    <TableContainer>
      <Table
        caption={`Demandes d'éligibilités - ${filteredEligibilityDemands
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
        columns={columns}
        data={filteredEligibilityDemands}
        rowKey="id"
        pagination
        paginationPosition="center"
      />
      {filteredEligibilityDemands.length === 0 && <p>Pas de résultat</p>}
      <TextInput
        placeholder="Email"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
    </TableContainer>
  );
};

export default BulkEligibility;
