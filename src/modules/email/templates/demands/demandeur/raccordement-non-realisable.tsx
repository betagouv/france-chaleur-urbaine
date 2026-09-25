import { Button, Layout, Link, Section, Text } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';

const EMAIL_CAMPAIGN = 'demands.demandeur.raccordement-non-realisable';

type RaccordementNonRealisableProps = {
  address: string;
  alternativeHeatingSolutions?: string[];
  originDemandId?: string;
  simulationUrl?: string;
};

const RaccordementNonRealisable = ({
  address,
  alternativeHeatingSolutions = [],
  originDemandId,
  simulationUrl,
}: RaccordementNonRealisableProps) => {
  const hasAlternativeHeatingSolutions = alternativeHeatingSolutions.length > 0;
  const buttonHref = withDemandContext(
    hasAlternativeHeatingSolutions ? (simulationUrl ?? '/chaleur-renouvelable') : '/chaleur-renouvelable',
    { address, originDemandId }
  );
  const buttonContent = hasAlternativeHeatingSolutions ? 'solutions-chaleur-renouvelable' : 'simulateur-chauffage-alternatif';
  const buttonLabel = hasAlternativeHeatingSolutions
    ? 'Découvrir en détail toutes les solutions adaptées à mon bâtiment'
    : 'Accéder au simulateur de modes de chauffage alternatifs';

  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Nous vous remercions pour votre demande de contact sur France Chaleur Urbaine pour le <strong>{address}</strong>.
      </Text>
      <Text>
        Suite à l'étude de votre dossier par le gestionnaire du réseau de chaleur le plus proche, le raccordement de votre bâtiment au
        réseau de chaleur ne peut pas être envisagé.
      </Text>
      {hasAlternativeHeatingSolutions ? (
        <>
          <Text>
            Cependant, grâce aux informations que vous nous avez transmises sur votre bâtiment,{' '}
            <strong>nous avons pu identifier plusieurs solutions de chauffage adaptées,</strong> plus performantes et plus écologiques,
            parmi lesquelles :
          </Text>
          <Section style={{ padding: '0 0 16px' }}>
            <ul style={{ margin: '0 0 0 24px', padding: 0 }}>
              {alternativeHeatingSolutions.map((solution) => (
                <li key={solution} style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '8px' }}>
                  {solution}
                </li>
              ))}
            </ul>
          </Section>
          <Text>
            Découvrez le détail de ces solutions et échangez avec un conseiller France Rénov', qui vous accompagnera gratuitement dans votre
            projet.
          </Text>
        </>
      ) : (
        <Text>
          <strong>Il existe cependant d'autres solutions</strong> pour vous permettre de bénéficier d'un mode de chauffage plus performant
          et plus écologique. <strong>Découvrez notre simulateur de modes de chauffage alternatifs : en moins d'une minute</strong>,
          identifiez les solutions les plus adaptées à votre bâtiment et à son environnement !
        </Text>
      )}
      <Section style={{ textAlign: 'center' }}>
        <Button href={buttonHref} campaign={EMAIL_CAMPAIGN} content={buttonContent}>
          {buttonLabel}
        </Button>
      </Section>
      <Text>
        Pour toute question sur votre demande, vous pouvez utiliser le{' '}
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

const withDemandContext = (
  href: string,
  { address, originDemandId }: Pick<RaccordementNonRealisableProps, 'address' | 'originDemandId'>
) => {
  const url = new URL(href, 'https://france-chaleur-urbaine.invalid');

  if (url.pathname === '/chaleur-renouvelable' && !url.searchParams.has('adresse')) {
    url.searchParams.set('adresse', address);
  }

  if (originDemandId) {
    url.searchParams.set('originDemandId', originDemandId);
  }

  return `${url.pathname}${url.search}${url.hash}`;
};

export const scenarios = defineEmailScenarios<typeof RaccordementNonRealisable>({
  avecSolutionsChaleurRenouvelable: {
    label: 'Demande issue du parcours chaleur renouvelable',
    props: {
      address: '20 Avenue de Ségur 75007 Paris',
      alternativeHeatingSolutions: ['PAC géothermique', 'Chaudière à bois', 'PAC air-eau collective'],
      originDemandId: '00000000-0000-4000-8000-000000000301',
      simulationUrl: '/chaleur-renouvelable/resultat?adresse=20+Avenue+de+S%C3%A9gur+75007+Paris&typeLogement=immeuble_chauffage_collectif',
    },
  },
  defaut: {
    label: 'Demande classée non réalisable',
    props: {
      address: '15 Rue Victor Renelle 93240 Stains',
      originDemandId: '00000000-0000-4000-8000-000000000302',
    },
  },
});

export default RaccordementNonRealisable;
