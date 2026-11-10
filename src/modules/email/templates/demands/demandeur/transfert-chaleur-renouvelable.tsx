import type { DemandeChaleurRenouvelable } from '@/modules/chaleur-renouvelable/constants';
import { Layout, Link, SummaryTable, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

import { getHousingTypeLabel, sampleRenewableHeatDemand } from '../chaleur-renouvelable';

type TransfertChaleurRenouvelableProps = {
  demand: Pick<DemandeChaleurRenouvelable, 'address' | 'firstName' | 'housingType' | 'heatingEnergy' | 'housingCount'>;
  network: { name: string; manager: string | null; distance: number | null };
};

/**
 * Explains the priority connection route after an admin transfers an accompaniment demand.
 */
function TransfertChaleurRenouvelable({ demand, network }: TransfertChaleurRenouvelableProps) {
  return (
    <Layout>
      <Text>Bonjour {demand.firstName},</Text>
      <Text>Vous avez déposé une demande d’accompagnement sur France Chaleur Urbaine pour le {demand.address}.</Text>
      <Text>
        {network.distance !== null
          ? `Votre immeuble se situe à environ ${network.distance} m du réseau de chaleur `
          : 'Votre immeuble se situe à proximité du réseau de chaleur '}
        <strong>{network.name}</strong>. Le raccordement à ce réseau est la piste à étudier en priorité. Nous avons donc transmis votre
        demande à son gestionnaire
        {network.manager ? (
          <>
            , <strong>{network.manager}</strong>
          </>
        ) : (
          ''
        )}
        .
      </Text>
      <Title>Et ensuite ?</Title>
      <Text>
        Le gestionnaire du réseau va vous recontacter pour étudier la faisabilité technique et économique du raccordement de votre immeuble.
        Cette étude est gratuite et sans engagement.
      </Text>
      <Title>Récapitulatif de votre demande</Title>
      <SummaryTable
        rows={[
          ['Adresse', demand.address],
          ['Type de logement', getHousingTypeLabel(demand.housingType)],
          ['Énergie de chauffage actuelle', demand.heatingEnergy],
          ['Nombre de logements', demand.housingCount],
        ]}
      />
      <Text>
        <Link href="/ressources/qu-est-ce-qui-determine-la-faisabilite-du-raccordement-aux-reseaux-de-chaleur">
          Comprendre le raccordement à un réseau de chaleur
        </Link>
      </Text>
      <Text>
        <strong>Ce n’était pas votre souhait ?</strong> Si vous préférez être accompagné vers une autre solution de chauffage renouvelable,
        écrivez-nous via le <Link href="/contact">formulaire de contact</Link>.
      </Text>
      <Text>Bien cordialement,</Text>
      <Text>L’équipe France Chaleur Urbaine</Text>
    </Layout>
  );
}

export const scenarios = defineEmailScenarios<typeof TransfertChaleurRenouvelable>({
  defaut: {
    label: 'Transfert vers un réseau',
    props: { demand: sampleRenewableHeatDemand, network: { distance: 120, manager: 'Gestionnaire du réseau', name: 'Réseau de Nantes' } },
  },
  sansDistance: {
    label: 'Distance inconnue',
    props: { demand: sampleRenewableHeatDemand, network: { distance: null, manager: null, name: 'Réseau de Nantes' } },
  },
});

export default TransfertChaleurRenouvelable;
