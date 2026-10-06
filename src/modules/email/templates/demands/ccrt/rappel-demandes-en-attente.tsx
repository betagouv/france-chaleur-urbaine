import { typeLogementOptions } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

export type CcrtPendingDemandReminder = {
  address: string;
  housingCount: number;
  housingType: string;
  id: string;
  waitingDays: number;
};

const getHousingTypeLabel = (value: string) => typeLogementOptions.find((option) => option.value === value)?.label ?? value;

const RappelDemandesEnAttente = ({
  demands,
  demandListUrl,
  pendingDemandCount,
}: {
  demands: CcrtPendingDemandReminder[];
  demandListUrl: string;
  pendingDemandCount: number;
}) => {
  const remainingDemandCount = Math.max(0, pendingDemandCount - demands.length);

  return (
    <Layout>
      <Title>{pendingDemandCount} demande(s) d'accompagnement en attente de traitement</Title>

      <Text>
        Vous avez des demandes d'accompagnement encore au statut « À traiter » dans votre espace CCRT. Merci de contacter les usagers
        concernés, puis de mettre à jour le statut dans le tableau de suivi.
      </Text>

      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Adresse</TableColumn>
          <TableColumn style={{ fontWeight: 'bold' }}>Type de logement</TableColumn>
          <TableColumn style={{ fontWeight: 'bold' }}>Logements</TableColumn>
          <TableColumn style={{ fontWeight: 'bold' }}>En attente</TableColumn>
        </TableRow>
        {demands.map((demand) => (
          <TableRow key={demand.id}>
            <TableColumn>{demand.address}</TableColumn>
            <TableColumn>{getHousingTypeLabel(demand.housingType)}</TableColumn>
            <TableColumn>{demand.housingCount}</TableColumn>
            <TableColumn>{demand.waitingDays} jour(s)</TableColumn>
          </TableRow>
        ))}
      </Table>

      {remainingDemandCount > 0 && <Text>... et {remainingDemandCount} autre(s) demande(s) à traiter.</Text>}

      <Text>
        Une demande sortira de cette relance dès que son statut ne sera plus « À traiter ». Le suivi se fait directement depuis l'espace
        CCRT.
      </Text>

      <Section style={{ paddingTop: '16px', textAlign: 'center' }}>
        <Button href={demandListUrl} campaign="demands.ccrt.rappel-demandes-en-attente">
          Voir les demandes à traiter
        </Button>
      </Section>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof RappelDemandesEnAttente>({
  defaut: {
    label: 'Relance CCRT',
    props: {
      demandListUrl: '/pro/demandes-chaleur-renouvelable',
      demands: [
        {
          address: '10 rue du Test, 75001 Paris',
          housingCount: 18,
          housingType: 'immeuble_chauffage_collectif',
          id: 'demand-1',
          waitingDays: 12,
        },
        {
          address: '20 avenue Exemple, 75002 Paris',
          housingCount: 32,
          housingType: 'immeuble_chauffage_collectif',
          id: 'demand-2',
          waitingDays: 8,
        },
      ],
      pendingDemandCount: 7,
    },
  },
});

export default RappelDemandesEnAttente;
