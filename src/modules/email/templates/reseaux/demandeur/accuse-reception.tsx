import { Layout, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';
import type { NetworkChangeRequestKind } from '@/modules/network-change-requests/constants';

type AccuseReceptionProps = {
  kind: NetworkChangeRequestKind;
  kindLabel: string;
  /** null for a request without a network (« autre ») */
  networkLabel: string | null;
};

/**
 * Accusé de réception envoyé au déposant juste après l'envoi d'une demande de modification de réseau : un texte pour le
 * formulaire de modification de fiche, un autre pour le formulaire de contribution à la cartographie (tracés, périmètres, autre).
 */
const AccuseReception = ({ kind, kindLabel, networkLabel }: AccuseReceptionProps) => (
  <Layout>
    <Title>Nous avons bien reçu votre demande</Title>
    <Text>Bonjour,</Text>
    {kind === 'fiche' ? (
      <>
        <Text>
          Votre demande « {kindLabel} »
          {networkLabel ? (
            <>
              {' '}
              concernant le réseau <strong>{networkLabel}</strong>
            </>
          ) : null}{' '}
          a bien été enregistrée.
        </Text>
        <Text>
          L'équipe France Chaleur Urbaine va l'examiner : vous serez informé par email de la mise en ligne de vos éléments sur la fiche du
          réseau.
        </Text>
        <Text>Merci pour votre contribution.</Text>
      </>
    ) : (
      <>
        <Text>
          Nous vous remercions pour les éléments transmis via le formulaire de contribution à la cartographie France Chaleur Urbaine.
        </Text>
        <Text>
          Sous réserve que les éléments soient dans un format exploitable, ils seront intégrés à la carte d'ici quelques jours et vous serez
          informé par email.
        </Text>
        <Text>
          Si votre contribution s'inscrit dans le cadre d'une demande de subvention ADEME, une attestation vous sera transmise une fois
          cette intégration effectuée.
        </Text>
        <Text>Nous restons à votre disposition pour toute information complémentaire.</Text>
        <Text>
          Bien cordialement,
          <br />
          L'équipe France Chaleur Urbaine
        </Text>
      </>
    )}
  </Layout>
);

export const scenarios = defineEmailScenarios<typeof AccuseReception>({
  contribution: {
    label: 'Contribution à la cartographie (tracé, périmètre, autre)',
    props: { kind: 'trace_existant', kindLabel: "Tracé d'un réseau existant", networkLabel: 'Réseau de Massy' },
  },
  defaut: {
    label: 'Modification de fiche',
    props: { kind: 'fiche', kindLabel: 'Modification de la fiche du réseau', networkLabel: '7501C - Paris (CPCU)' },
  },
});

export default AccuseReception;
