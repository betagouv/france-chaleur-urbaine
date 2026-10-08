import type { DemandeChaleurRenouvelable } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Link, Section, SummaryTable, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

import { formatMwh, getHousingTypeLabel, getRadiatorTypeLabel, sampleRenewableHeatDemand } from '../chaleur-renouvelable';

const AUDIT_PROJECT_STATUS = 'Audit énergétique déjà réalisé';
const EMAIL_CAMPAIGN = 'demands.demandeur.confirmation-demande-chaleur-renouvelable';

const formatSquareMeters = (value: number | null) =>
  value === null ? null : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} m²`;

type ConfirmationDemandeChaleurRenouvelableProps = {
  demand: DemandeChaleurRenouvelable;
};

const ConfirmationDemandeChaleurRenouvelable = ({ demand }: ConfirmationDemandeChaleurRenouvelableProps) => {
  const alternativeHeatingSolutions = demand.alternativeHeatingSolutions ?? [];
  const hasAudit = demand.projectStatus.includes(AUDIT_PROJECT_STATUS);

  return (
    <Layout>
      <Title>Votre demande d'accompagnement a bien été envoyée</Title>

      <Text>
        Bonjour {demand.firstName}, nous vous remercions pour votre demande d'accompagnement sur France Chaleur Urbaine pour le{' '}
        <strong>{demand.address}</strong>.
      </Text>

      <Text>
        Votre demande va être transmise au conseiller chaleur renouvelable de votre territoire. Ce conseiller du service public, neutre et
        gratuit, vous recontactera pour faire le point sur votre projet et vous accompagner dans les prochaines étapes.
      </Text>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Récapitulatif de votre demande</Text>
      <SummaryTable
        rows={[
          ['Adresse', demand.address],
          ['Profil', demand.occupantStatus],
          ['Type de logement', getHousingTypeLabel(demand.housingType)],
          ['Énergie de chauffage', demand.heatingEnergy],
          ['Radiateurs', getRadiatorTypeLabel(demand.radiatorType)],
          ['Nombre de logements', demand.housingCount],
          ['Consommation annuelle de chauffage', formatMwh(demand.annualHeatingConsumption)],
          ['Surface', formatSquareMeters(demand.surfaceArea)],
          ['Étapes du projet', demand.projectStatus.join(', ')],
          ['Commentaires', demand.comments],
          ['Email', demand.email],
          ['Téléphone', demand.phone],
        ]}
      />

      {alternativeHeatingSolutions.length > 0 && (
        <>
          <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>
            Solutions les plus compatibles identifiées par le simulateur
          </Text>
          <ul style={{ margin: '0 0 16px 24px', padding: 0 }}>
            {alternativeHeatingSolutions.map((solution) => (
              <li key={solution} style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '8px' }}>
                {solution}
              </li>
            ))}
          </ul>
        </>
      )}

      <Text>
        Pour préparer l'échange, vous pouvez réunir les factures ou relevés de consommation d'énergie, ainsi que les documents de
        copropriété utiles au projet.
      </Text>
      {hasAudit && <Text>Comme vous avez indiqué qu'un audit énergétique est déjà réalisé, pensez à préparer ce rapport.</Text>}
      <Text>Le dernier procès-verbal d'assemblée générale peut aussi être utile si votre projet concerne une copropriété.</Text>

      <Section style={{ paddingTop: '16px', textAlign: 'center' }}>
        <Button href={demand.simulationUrl} campaign={EMAIL_CAMPAIGN}>
          Voir ma simulation
        </Button>
      </Section>

      <Text>
        Une question ? Vous pouvez contacter l'équipe France Chaleur Urbaine via le{' '}
        <Link href="/contact" campaign={EMAIL_CAMPAIGN} content="contact">
          formulaire de contact
        </Link>
        .
      </Text>

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export const scenarios = defineEmailScenarios<typeof ConfirmationDemandeChaleurRenouvelable>({
  defaut: {
    label: "Demande d'accompagnement",
    props: {
      demand: {
        ...sampleRenewableHeatDemand,
        alternativeHeatingSolutions: ['PAC géothermique', 'Chaudière biomasse', 'PAC air-eau collective'],
        comments: 'Le projet doit être présenté à la prochaine assemblée générale.',
        surfaceArea: 1260,
      },
    },
  },
});

export default ConfirmationDemandeChaleurRenouvelable;
