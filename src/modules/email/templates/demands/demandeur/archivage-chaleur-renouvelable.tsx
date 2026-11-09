import type { DemandeChaleurRenouvelable, FranceRenovSpace } from '@/modules/chaleur-renouvelable/constants';
import { Button, Layout, Link, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

import { sampleRenewableHeatDemand } from '../chaleur-renouvelable';

type ArchivageChaleurRenouvelableProps = {
  demand: Pick<DemandeChaleurRenouvelable, 'address' | 'firstName' | 'simulationUrl'>;
  space: FranceRenovSpace | null;
};

/**
 * Gives an alternative public contact when accompaniment cannot be offered.
 */
function ArchivageChaleurRenouvelable({ demand, space }: ArchivageChaleurRenouvelableProps) {
  return (
    <Layout>
      <Text>Bonjour {demand.firstName},</Text>
      <Text>Merci pour votre demande d’accompagnement déposée sur France Chaleur Urbaine pour le {demand.address}.</Text>
      <Text>
        Après examen, nous ne sommes malheureusement pas en mesure de vous orienter vers un conseiller chaleur renouvelable. Ce dispositif
        d’accompagnement est aujourd’hui expérimenté sur certains territoires, pour les immeubles équipés d’un chauffage collectif.
      </Text>
      <Title>Un conseiller France Rénov’ peut vous aider</Title>
      <Text>
        Les conseillers France Rénov’ sont les interlocuteurs du service public pour vos projets de rénovation énergétique et de changement
        de chauffage. Leurs conseils sont gratuits, neutres et indépendants.
      </Text>
      {space ? (
        <Text>
          <strong>Votre espace conseil France Rénov’ le plus proche :</strong>
          <br />
          {space.name}
          <br />
          {space.address}
          <br />
          {space.zipcode} {space.city}
          <br />
          {space.phone}
          <br />
          {space.website && <Link href={space.website}>{space.website}</Link>}
        </Text>
      ) : (
        <Text>
          Trouvez l’espace conseil le plus proche de chez vous sur <Link href="https://france-renov.gouv.fr">france-renov.gouv.fr</Link> ou
          appelez le <strong>0 808 800 700</strong> (service gratuit + prix d’un appel).
        </Text>
      )}
      <Title>Réduire vos besoins de chauffage dès maintenant</Title>
      <Text>
        Avant de changer de mode de chauffage, réduire les besoins en chaleur de votre logement permet de baisser votre facture et de mieux
        dimensionner votre futur équipement :
      </Text>
      <Text>
        • réglez la température : 19 °C dans les pièces à vivre, 17 °C dans les chambres ;<br />• programmez votre chauffage selon vos
        horaires de présence ;<br />• faites entretenir votre chaudière chaque année ;<br />• ne couvrez pas vos radiateurs et purgez-les
        régulièrement ;<br />• pour aller plus loin (isolation, fenêtres, ventilation), votre conseiller France Rénov’ vous aidera à
        identifier les travaux prioritaires et les aides mobilisables.
      </Text>
      <Text>
        Plus de conseils sur le site de l’ADEME :{' '}
        <Link href="https://agirpourlatransition.ademe.fr/particuliers/">Agir pour la transition – Particuliers</Link>
      </Text>
      <Text>Vous pouvez toujours retrouver les résultats de votre simulation :</Text>
      <Button href={demand.simulationUrl}>Voir ma simulation</Button>
      <Text>Bien cordialement,</Text>
      <Text>L’équipe France Chaleur Urbaine</Text>
    </Layout>
  );
}

export const scenarios = defineEmailScenarios<typeof ArchivageChaleurRenouvelable>({
  defaut: { label: 'Coordonnées nationales', props: { demand: sampleRenewableHeatDemand, space: null } },
  espaceLocal: {
    label: 'Espace conseil le plus proche',
    props: {
      demand: sampleRenewableHeatDemand,
      space: {
        address: '1 rue du Conseil',
        city: 'Nantes',
        email: '',
        name: 'Espace conseil France Rénov’',
        phone: '02 00 00 00 00',
        secondaryPhone: null,
        website: 'https://france-renov.gouv.fr',
        zipcode: '44000',
      },
    },
  },
});

export default ArchivageChaleurRenouvelable;
