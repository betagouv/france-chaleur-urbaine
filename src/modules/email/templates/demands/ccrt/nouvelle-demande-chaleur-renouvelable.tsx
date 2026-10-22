import type { DemandeChaleurRenouvelable, DemandeChaleurRenouvelableStatus } from '@/modules/chaleur-renouvelable/constants';
import { DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Section, SummaryTable, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

import { formatMwh, getHousingTypeLabel, getRadiatorTypeLabel, sampleRenewableHeatDemand } from '../chaleur-renouvelable';

const EMAIL_CAMPAIGN = 'demands.ccrt.nouvelle-demande-chaleur-renouvelable';

type NouvelleDemandeChaleurRenouvelableProps = {
  demand: DemandeChaleurRenouvelable;
  demandUrl: string;
  pendingDemandCount: number;
  status: DemandeChaleurRenouvelableStatus;
};

const NouvelleDemandeChaleurRenouvelable = ({ demand, demandUrl, pendingDemandCount, status }: NouvelleDemandeChaleurRenouvelableProps) => {
  const alternativeHeatingSolutions = demand.alternativeHeatingSolutions ?? [];

  return (
    <Layout>
      <Title>Nouvelle demande d'accompagnement à traiter</Title>

      <Text>
        Une nouvelle demande d'accompagnement vers un système de chauffage renouvelable est disponible dans votre espace CCRT pour
        traitement.
      </Text>

      <Section style={{ paddingTop: '8px', textAlign: 'center' }}>
        <Button href={demandUrl} campaign={EMAIL_CAMPAIGN} content="haut-email">
          Voir la demande
        </Button>
      </Section>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Synthèse</Text>
      <SummaryTable
        rows={[
          ['Statut', status],
          ['Adresse', demand.address],
          ['Demandeur', `${demand.firstName} ${demand.lastName} - ${demand.occupantStatus}`],
          ['Structure', demand.organizationName],
          ['Type de bâtiment', `${getHousingTypeLabel(demand.housingType)} - ${demand.housingCount} logement(s)`],
          ['Énergie de chauffage', demand.heatingEnergy],
          ['Émetteurs', getRadiatorTypeLabel(demand.radiatorType)],
          ['Étapes du projet', demand.projectStatus.join(', ')],
          ['Consommation annuelle de chauffage', formatMwh(demand.annualHeatingConsumption)],
          [
            'Top solutions',
            alternativeHeatingSolutions.length > 0 && (
              <ul style={{ margin: '0 0 0 20px', padding: 0 }}>
                {alternativeHeatingSolutions.map((solution) => (
                  <li key={solution} style={{ marginBottom: '4px' }}>
                    {solution}
                  </li>
                ))}
              </ul>
            ),
          ],
          ['Commentaire usager', demand.comments],
        ]}
      />

      {pendingDemandCount > 1 && <Text>Vous avez actuellement {pendingDemandCount} demande(s) à traiter sur votre territoire.</Text>}

      <Text>Depuis la demande, vous pouvez contacter l'usager puis mettre à jour le statut dans le tableau de suivi.</Text>

      <Section style={{ paddingTop: '24px', textAlign: 'center' }}>
        <Button href={demandUrl} campaign={EMAIL_CAMPAIGN} content="bas-email">
          Voir la demande et contacter l'usager
        </Button>
      </Section>

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof NouvelleDemandeChaleurRenouvelable>({
  defaut: {
    label: "Nouvelle demande d'accompagnement",
    props: {
      demand: sampleRenewableHeatDemand,
      demandUrl: '/pro/demandes-chaleur-renouvelable',
      pendingDemandCount: 4,
      status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
    },
  },
});

export default NouvelleDemandeChaleurRenouvelable;
