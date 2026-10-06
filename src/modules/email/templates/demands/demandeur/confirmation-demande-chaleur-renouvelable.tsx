import type { DemandeChaleurRenouvelable } from '@/modules/chaleur-renouvelable/constants';
import { typeLogementOptions, typeRadiateurOptions } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Link, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const AUDIT_PROJECT_STATUS = 'Audit énergétique déjà réalisé';
const EMAIL_CAMPAIGN = 'demands.demandeur.confirmation-demande-chaleur-renouvelable';

const getHousingTypeLabel = (value: DemandeChaleurRenouvelable['housingType']) =>
  typeLogementOptions.find((option) => option.value === value)?.label ?? value;

const getRadiatorTypeLabel = (value: DemandeChaleurRenouvelable['radiatorType']) =>
  value ? (typeRadiateurOptions.find((option) => option.value === value)?.label ?? value) : 'Non renseigné';

const formatMwh = (value: number | null) => (value === null ? null : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MWh`);

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
      <Table>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Adresse</TableColumn>
          <TableColumn>{demand.address}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Profil</TableColumn>
          <TableColumn>{demand.occupantStatus}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Type de logement</TableColumn>
          <TableColumn>{getHousingTypeLabel(demand.housingType)}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Énergie de chauffage</TableColumn>
          <TableColumn>{demand.heatingEnergy}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Radiateurs</TableColumn>
          <TableColumn>{getRadiatorTypeLabel(demand.radiatorType)}</TableColumn>
        </TableRow>
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Nombre de logements</TableColumn>
          <TableColumn>{demand.housingCount}</TableColumn>
        </TableRow>
        {formatMwh(demand.annualHeatingConsumption) && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Consommation annuelle de chauffage</TableColumn>
            <TableColumn>{formatMwh(demand.annualHeatingConsumption)}</TableColumn>
          </TableRow>
        )}
        {formatSquareMeters(demand.surfaceArea) && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Surface</TableColumn>
            <TableColumn>{formatSquareMeters(demand.surfaceArea)}</TableColumn>
          </TableRow>
        )}
        {demand.projectStatus.length > 0 && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Étapes du projet</TableColumn>
            <TableColumn>{demand.projectStatus.join(', ')}</TableColumn>
          </TableRow>
        )}
        {demand.comments && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Commentaires</TableColumn>
            <TableColumn>{demand.comments}</TableColumn>
          </TableRow>
        )}
        <TableRow>
          <TableColumn style={{ fontWeight: 'bold' }}>Email</TableColumn>
          <TableColumn>{demand.email}</TableColumn>
        </TableRow>
        {demand.phone && (
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold' }}>Téléphone</TableColumn>
            <TableColumn>{demand.phone}</TableColumn>
          </TableRow>
        )}
      </Table>

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
        address: '10 rue du Test, 75001 Paris',
        alternativeHeatingSolutions: ['PAC géothermique', 'Chaudière biomasse', 'PAC air-eau collective'],
        annualHeatingConsumption: 820.5,
        averageArea: 70,
        averageResidents: 2,
        batimentConstructionId: 'CONSTRUCTION-123',
        comments: 'Le projet doit être présenté à la prochaine assemblée générale.',
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
        surfaceArea: 1260,
      },
    },
  },
});

export default ConfirmationDemandeChaleurRenouvelable;
