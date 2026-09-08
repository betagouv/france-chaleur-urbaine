import { Button, Layout, Link, Section, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

type RaccordementNonRealisableProps = {
  address: string;
};

const RaccordementNonRealisable = ({ address }: RaccordementNonRealisableProps) => (
  <Layout>
    <Text>Bonjour,</Text>
    <Text>
      Nous vous remercions pour votre demande de contact sur France Chaleur Urbaine pour le <strong>{address}</strong>.
    </Text>
    <Text>
      Suite à l'étude de votre dossier par le gestionnaire du réseau de chaleur le plus proche, le raccordement de votre bâtiment au réseau
      de chaleur ne peut pas être envisagé.
    </Text>
    <Text>
      <strong>Il existe cependant d'autres solutions</strong> pour vous permettre de bénéficier d'un mode de chauffage plus performant et
      plus écologique. <strong>Découvrez notre simulateur de modes de chauffage alternatifs : en moins d'une minute</strong>, identifiez les
      solutions les plus adaptées à votre bâtiment et à son environnement !
    </Text>
    <Section style={{ textAlign: 'center' }}>
      <Button
        href="/chaleur-renouvelable"
        campaign="demands.demandeur.raccordement-non-realisable"
        content="simulateur-chauffage-alternatif"
      >
        Accéder au simulateur de modes de chauffage alternatifs
      </Button>
    </Section>
    <Text>
      Pour toute question sur votre demande, vous pouvez utiliser le{' '}
      <Link href="/contact" campaign="demands.demandeur.raccordement-non-realisable" content="contact">
        formulaire de contact
      </Link>
      .
    </Text>
    <Text>Bien cordialement,</Text>
    <Text>L'équipe France Chaleur Urbaine</Text>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof RaccordementNonRealisable>({
  defaut: {
    label: 'Demande classée non réalisable',
    props: {
      address: '15 Rue Victor Renelle 93240 Stains',
    },
  },
});

export default RaccordementNonRealisable;
