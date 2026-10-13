import { Button, Layout, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';
import type { NetworkChangeRequestKind } from '@/modules/network-change-requests/constants';

type DemandeAccepteeProps = {
  kind: NetworkChangeRequestKind;
  /** Public page of the network when it has one (heat and cold networks). */
  networkPageUrl: string | null;
};

/**
 * Email envoyé au déposant quand un admin met en ligne sa demande : sur la fiche du réseau (modification de fiche) ou sur la
 * carte (tracé, périmètre). Jamais envoyé pour une demande close sans changement, ni pour une demande « autre ».
 */
const DemandeAcceptee = ({ kind, networkPageUrl }: DemandeAccepteeProps) => (
  <Layout>
    <Title>Vos éléments ont été publiés</Title>
    <Text>Bonjour,</Text>
    {kind === 'fiche' ? (
      <Text>
        Nous vous informons que les éléments transmis via le formulaire de modification de fiche France Chaleur Urbaine ont bien été publiés
        sur la fiche du réseau.
      </Text>
    ) : (
      <Text>
        Nous vous informons que les éléments transmis via le formulaire de contribution à la cartographie France Chaleur Urbaine ont bien
        été publiés sur la carte.
      </Text>
    )}
    {networkPageUrl && <Button href={networkPageUrl}>Voir la fiche du réseau</Button>}
    <Text>
      Nous vous remercions pour votre contribution, qui participe à l'amélioration de la connaissance des réseaux de chaleur à l'échelle
      nationale.
    </Text>
    <Text>Nous restons à votre disposition pour toute information complémentaire.</Text>
    <Text>
      Bien cordialement,
      <br />
      L'équipe France Chaleur Urbaine
    </Text>
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof DemandeAcceptee>({
  defaut: {
    label: 'Tracé ou périmètre publié sur la carte',
    props: { kind: 'trace_existant', networkPageUrl: null },
  },
  fiche: {
    label: 'Fiche mise à jour, avec lien vers la fiche',
    props: { kind: 'fiche', networkPageUrl: '/reseaux/7501C' },
  },
});

export default DemandeAcceptee;
