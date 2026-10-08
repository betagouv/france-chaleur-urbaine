import { typeLogementOptions } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Link, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const EMAIL_CAMPAIGN = 'demands.ccrt.rappel-demandes-en-attente';

export type CcrtPendingDemandReminder = {
  address: string;
  housingCount: number;
  housingType: string;
  id: string;
  waitingDays: number;
};

const getHousingTypeLabel = (value: string) => typeLogementOptions.find((option) => option.value === value)?.label ?? value;

type RappelDemandesEnAttenteProps = {
  demands: CcrtPendingDemandReminder[];
  demandListUrl: string;
  pendingDemandCount: number;
};

const RappelDemandesEnAttente = ({ demands, demandListUrl, pendingDemandCount }: RappelDemandesEnAttenteProps) => {
  const remainingDemandCount = Math.max(0, pendingDemandCount - demands.length);

  return (
    <Layout>
      <Title>{pendingDemandCount} demande(s) d'accompagnement en attente de traitement</Title>

      <Text>
        Vous avez {pendingDemandCount} demande(s) d'accompagnement au statut « À traiter » dans votre espace CCRT. Les usagers concernés
        attendent un premier retour de votre part.
      </Text>

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Demandes les plus anciennes</Text>
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

      <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '16px' }}>Comment mettre à jour une demande ?</Text>
      <Section style={{ padding: '0 0 16px' }}>
        <ul style={{ margin: '0 0 0 24px', padding: 0 }}>
          <li style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '8px' }}>
            <strong>Vous contactez l'usager :</strong> utilisez son email ou son téléphone depuis la ligne de demande. Si la demande était
            encore « À traiter », elle passera automatiquement au statut « Recontacté pour premier échange ».
          </li>
          <li style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '8px' }}>
            <strong>La demande n'est pas pertinente :</strong> passez-la au statut « Non pertinent ».
          </li>
          <li style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '8px' }}>
            <strong>Le suivi avance :</strong> renseignez le statut et, le cas échéant, l'état du projet.
          </li>
        </ul>
      </Section>

      <Text>Une demande sortira de cette relance dès que son statut ne sera plus « À traiter ».</Text>
      <Text>
        Ces informations nous permettent de suivre le traitement des demandes et d'améliorer le dispositif. Pour toute question, contactez
        l'équipe France Chaleur Urbaine à{' '}
        <Link href="mailto:france.chaleur.urbaine@ademe.fr" campaign={EMAIL_CAMPAIGN} content="contact-email">
          france.chaleur.urbaine@ademe.fr
        </Link>
        .
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
