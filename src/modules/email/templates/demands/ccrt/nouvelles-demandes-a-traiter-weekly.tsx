import { Button, Layout, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

import { getHousingTypeLabel } from '../chaleur-renouvelable';

const EMAIL_CAMPAIGN = 'demands.ccrt.nouvelles-demandes-a-traiter-weekly';

export type CcrtNewDemandDigestItem = {
  address: string;
  housingCount: number;
  housingType: string;
  id: string;
  /** date de dépôt formatée (JJ/MM/AAAA) */
  receivedAt: string;
  topSolution: string | null;
};

type NouvellesDemandesATraiterWeeklyProps = {
  demands: CcrtNewDemandDigestItem[];
  demandListUrl: string;
  pendingDemandCount: number;
};

const NouvellesDemandesATraiterWeekly = ({ demands, demandListUrl, pendingDemandCount }: NouvellesDemandesATraiterWeeklyProps) => (
  <Layout>
    <Title>{demands.length} nouvelle(s) demande(s) d'accompagnement cette semaine</Title>

    <Text>
      Cette semaine, {demands.length} nouvelle(s) demande(s) d'accompagnement vers un système de chauffage renouvelable ont été publiées
      dans votre espace CCRT pour traitement.
    </Text>

    <Table>
      <TableRow>
        <TableColumn style={{ fontWeight: 'bold' }}>Adresse</TableColumn>
        <TableColumn style={{ fontWeight: 'bold' }}>Type de logement</TableColumn>
        <TableColumn style={{ fontWeight: 'bold' }}>Logements</TableColumn>
        <TableColumn style={{ fontWeight: 'bold' }}>Première solution</TableColumn>
        <TableColumn style={{ fontWeight: 'bold' }}>Déposée le</TableColumn>
      </TableRow>
      {demands.map((demand) => (
        <TableRow key={demand.id}>
          <TableColumn>{demand.address}</TableColumn>
          <TableColumn>{getHousingTypeLabel(demand.housingType)}</TableColumn>
          <TableColumn>{demand.housingCount}</TableColumn>
          <TableColumn>{demand.topSolution ?? 'Non renseignée'}</TableColumn>
          <TableColumn>{demand.receivedAt}</TableColumn>
        </TableRow>
      ))}
    </Table>

    {pendingDemandCount > 0 && <Text>Vous avez actuellement {pendingDemandCount} demande(s) à traiter sur votre territoire.</Text>}

    <Text>
      Depuis chaque demande, vous pouvez consulter le détail, contacter l'usager puis mettre à jour le statut dans le tableau de suivi.
    </Text>

    <Section style={{ paddingTop: '16px', textAlign: 'center' }}>
      <Button href={demandListUrl} campaign={EMAIL_CAMPAIGN}>
        Voir les demandes à traiter
      </Button>
    </Section>

    <Text>Bien cordialement,</Text>
    <Text>L'équipe France Chaleur Urbaine</Text>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof NouvellesDemandesATraiterWeekly>({
  plusieurs_demandes: {
    label: 'Plusieurs nouvelles demandes dans la semaine',
    props: {
      demandListUrl: '/pro/demandes-chaleur-renouvelable',
      demands: [
        {
          address: '10 rue du Test, 75001 Paris',
          housingCount: 18,
          housingType: 'immeuble_chauffage_collectif',
          id: 'demand-1',
          receivedAt: '20/10/2026',
          topSolution: 'PAC géothermique',
        },
        {
          address: '20 avenue Exemple, 75002 Paris',
          housingCount: 32,
          housingType: 'immeuble_chauffage_collectif',
          id: 'demand-2',
          receivedAt: '22/10/2026',
          topSolution: null,
        },
      ],
      pendingDemandCount: 7,
    },
  },
  une_demande: {
    label: 'Une seule nouvelle demande dans la semaine',
    props: {
      demandListUrl: '/pro/demandes-chaleur-renouvelable',
      demands: [
        {
          address: '10 rue du Test, 75001 Paris',
          housingCount: 18,
          housingType: 'immeuble_chauffage_collectif',
          id: 'demand-1',
          receivedAt: '20/10/2026',
          topSolution: 'PAC géothermique',
        },
      ],
      pendingDemandCount: 1,
    },
  },
});

export default NouvellesDemandesATraiterWeekly;
