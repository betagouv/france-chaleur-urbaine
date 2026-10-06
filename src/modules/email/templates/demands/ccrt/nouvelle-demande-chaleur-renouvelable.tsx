import type { DemandeChaleurRenouvelable, DemandeChaleurRenouvelableStatus } from '@/modules/chaleur-renouvelable/constants';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const getHousingTypeLabel = (value: DemandeChaleurRenouvelable['housingType']) =>
  typeLogementOptions.find((option) => option.value === value)?.label ?? value;

const getRadiatorTypeLabel = (value: DemandeChaleurRenouvelable['radiatorType']) =>
  value ? (typeRadiateurOptions.find((option) => option.value === value)?.label ?? value) : 'Non renseigné';

const formatMwh = (value: number | null) => (value === null ? null : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MWh`);

const NouvelleDemandeChaleurRenouvelable = ({
  demand,
  demandUrl,
  pendingDemandCount,
  status,
}: {
  demand: DemandeChaleurRenouvelable;
  demandId: string;
  demandUrl: string;
  pendingDemandCount: number;
  status: DemandeChaleurRenouvelableStatus;
}) => {
  const alternativeHeatingSolutions = demand.alternativeHeatingSolutions ?? [];

  return (
    <Layout>
      <Title>Nouvelle demande d'accompagnement à traiter</Title>

      <Text>Une nouvelle demande d'accompagnement est à traiter dans votre espace CCRT.</Text>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Synthèse</Text>
      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Statut</TableColumn>
          <TableColumn>{status}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Adresse</TableColumn>
          <TableColumn>{demand.address}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Demandeur</TableColumn>
          <TableColumn>
            {demand.firstName} {demand.lastName} - {demand.occupantStatus}
          </TableColumn>
        </TableRow>
        {demand.organizationName && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Structure</TableColumn>
            <TableColumn>{demand.organizationName}</TableColumn>
          </TableRow>
        )}
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Type de bâtiment</TableColumn>
          <TableColumn>
            {getHousingTypeLabel(demand.housingType)} - {demand.housingCount} logement(s)
          </TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Énergie de chauffage</TableColumn>
          <TableColumn>{demand.heatingEnergy}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Émetteurs</TableColumn>
          <TableColumn>{getRadiatorTypeLabel(demand.radiatorType)}</TableColumn>
        </TableRow>
        {demand.projectStatus.length > 0 && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Étapes du projet</TableColumn>
            <TableColumn>{demand.projectStatus.join(', ')}</TableColumn>
          </TableRow>
        )}
        {formatMwh(demand.annualHeatingConsumption) && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Consommation annuelle de chauffage</TableColumn>
            <TableColumn>{formatMwh(demand.annualHeatingConsumption)}</TableColumn>
          </TableRow>
        )}
        {alternativeHeatingSolutions.length > 0 && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Top solutions</TableColumn>
            <TableColumn>{alternativeHeatingSolutions.join(', ')}</TableColumn>
          </TableRow>
        )}
        {demand.comments && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Commentaire usager</TableColumn>
            <TableColumn>{demand.comments}</TableColumn>
          </TableRow>
        )}
      </Table>

      {pendingDemandCount > 1 && <Text>Vous avez actuellement {pendingDemandCount} demande(s) à traiter sur votre territoire.</Text>}

      <Section style={{ paddingTop: '24px', textAlign: 'center' }}>
        <Button href={demandUrl} campaign="demands.ccrt.nouvelle-demande-chaleur-renouvelable">
          Voir la demande et contacter l'usager
        </Button>
      </Section>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof NouvelleDemandeChaleurRenouvelable>({
  defaut: {
    label: "Nouvelle demande d'accompagnement",
    props: {
      demand: {
        address: '10 rue du Test, 75001 Paris',
        alternativeHeatingSolutions: ['PAC géothermique', 'Chaudière à bois', 'PAC air-eau collective'],
        annualHeatingConsumption: 820.5,
        averageArea: 70,
        averageResidents: 2,
        batimentConstructionId: 'CONSTRUCTION-123',
        comments: 'Le projet doit être traité avant la prochaine assemblée générale.',
        demandConcern: 'Une copropriété',
        dpe: 'C',
        email: 'claire.test@example.com',
        firstName: 'Claire',
        heatingEnergy: 'Gaz',
        hotWaterSystemType: 'Collectif',
        housingCount: 18,
        housingType: 'immeuble_chauffage_collectif',
        isPublicAdvisorSelected: false,
        lastName: 'Test',
        occupantStatus: 'Syndicat de copropriété',
        organizationName: 'Syndicat test',
        originDemandId: null,
        outdoorSpace: 'jardinCours',
        phone: '0605040302',
        projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
        radiatorType: 'radiateur-eau',
        refusalPeriod: 'Il y a moins de 3 mois',
        refusalReason: 'Coût du raccordement trop élevé',
        simulationUrl: 'https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable/resultat',
        surfaceArea: null,
      },
      demandId: 'demand-123',
      demandUrl: '/pro/demandes-chaleur-renouvelable',
      pendingDemandCount: 4,
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
    },
  },
});

export default NouvelleDemandeChaleurRenouvelable;
