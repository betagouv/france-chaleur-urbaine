import { clientConfig } from '@/client-config';
import type { formatHeatingTypeToAirtable } from '@/services/airtable';
import type { AvailableStructure } from '@/types/AddressData';
import type { Demand } from '@/types/Summary/Demand';

import { Layout, Link, Text } from '../components';

type CreationDemandeEmailProps = {
  demand: Pick<Demand, 'Adresse' | 'Distance au réseau' | 'Structure' | 'Departement'> & {
    Structure: AvailableStructure;
    'Type de chauffage': ReturnType<typeof formatHeatingTypeToAirtable>;
  };
};

const CreationDemandeEmail = ({ demand }: CreationDemandeEmailProps) => {
  const distanceThreshold = demand.Departement === 'Paris' ? 60 : 100;
  const intermediateDistanceThreshold = demand.Departement === 'Paris' ? 100 : 200;
  return (
    <Layout>
      {process.env.NODE_ENV === 'test' && <pre>Paramètres (affiché seulement sur mailpit) : {JSON.stringify(demand, null, 2)}</pre>}
      <Text>Bonjour,</Text>
      <Text>
        Nous vous remercions pour votre demande de contact sur <Link href={clientConfig.websiteOrigin}>France Chaleur Urbaine</Link> pour le{' '}
        {demand.Adresse}.
      </Text>

      {demand.Structure === 'Copropriété' && (
        <>
          {demand['Type de chauffage'] === 'Collectif' &&
            (demand['Distance au réseau'] < distanceThreshold ? (
              <>
                <Text>
                  Votre copropriété est située à proximité d’un réseau de chaleur (moins de {distanceThreshold} m). De plus, au vu de votre
                  mode de chauffage actuel, votre immeuble dispose déjà d’un réseau de distribution interne et d’équipements adaptés au sein
                  des logements : il s’agit du cas le plus favorable pour un raccordement.
                </Text>
                <Text>
                  Nous transmettons donc votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse confirmer
                  la faisabilité technique du raccordement, et vous fournir une première estimation financière. Il sera en charge de vous
                  recontacter.
                </Text>
                <Text>
                  Sans attendre, nous vous invitons à{' '}
                  <Link href={`${clientConfig.websiteOrigin}/documentation/guide-france-chaleur-urbaine.pdf`}>télécharger notre guide</Link>
                  , qui récapitule les grandes étapes pour se raccorder à un réseau de chaleur, ainsi que les principales aides financières
                  disponibles.
                </Text>
              </>
            ) : demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre copropriété n'est pas à proximité immédiate d'un réseau de chaleur. Cependant, elle reste suffisamment proche pour
                  qu'un raccordement soit potentiellement envisageable, mais seul le gestionnaire du réseau pourra vous confirmer la
                  faisabilité technique du raccordement (en fonction de la taille de votre copropriété, de sa consommation d'énergie, des
                  autres bâtiments raccordables à proximité,...), et vous fournir une première estimation financière.
                </Text>
                <Text>
                  Nous transmettons votre demande au gestionnaire du réseau de chaleur le plus proche de votre adresse, qui sera en charge
                  de vous recontacter.
                </Text>
              </>
            ) : (
              <>
                <Text>Malheureusement, il n'existe pas de réseau de chaleur à proximité de votre bâtiment à ce jour.</Text>
                <Text>
                  Votre demande permettra tout de même à votre commune ou au gestionnaire du réseau le plus proche de prendre connaissance
                  de votre intérêt pour ce mode de chauffage. Vous pourrez ainsi être recontacté(e) s'il existe des projets de développement
                  de réseaux dans votre quartier.
                </Text>
                <Text>
                  L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique
                  et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur{' '}
                  <Link href="https://france-renov.gouv.fr/">France Rénov</Link>.
                </Text>
              </>
            ))}

          {demand['Type de chauffage'] === 'Individuel' &&
            (demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre copropriété se situe à proximité d'un réseau de chaleur. Cependant, au vu de votre mode de chauffage actuel, des
                  travaux conséquents et coûteux seraient nécessaires pour le développement d'un réseau interne de chauffage dans votre
                  immeuble, indispensable dans le cas d'un raccordement à un réseau de chaleur.
                </Text>
                <Text>
                  Nous transmettons tout de même votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse
                  prendre connaissance de votre intérêt pour un raccordement.
                </Text>
              </>
            ) : (
              <>
                <Text>
                  Malheureusement, il n'existe pas de réseau de chaleur à proximité de votre bâtiment à ce jour. De plus, au vu de votre
                  mode de chauffage actuel, même en présence d’un réseau de chaleur à proximité, des travaux conséquents et coûteux seraient
                  nécessaires au sein de votre immeuble pour la mise en place d’un réseau de distribution interne de la chaleur.
                </Text>
                <Text>
                  Votre demande permettra tout de même à votre commune ou au gestionnaire du réseau le plus proche de prendre connaissance
                  de votre intérêt pour ce mode de chauffage.
                </Text>
                <Text>
                  L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique
                  et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur{' '}
                  <Link href="https://france-renov.gouv.fr/">France Rénov</Link>.
                </Text>
              </>
            ))}
        </>
      )}

      {(demand.Structure === 'Tertiaire' || demand.Structure === 'Bailleur social' || demand.Structure === 'Autre') && (
        <>
          {demand['Type de chauffage'] === 'Collectif' &&
            (demand['Distance au réseau'] < distanceThreshold ? (
              <>
                <Text>
                  Votre adresse est située à proximité d’un réseau de chaleur (moins de {distanceThreshold} m). De plus, au vu de votre mode
                  de chauffage actuel, votre immeuble dispose déjà d’équipements adaptés, notamment d’un réseau de distribution interne : il
                  s’agit du cas le plus favorable pour un raccordement.
                </Text>
                <Text>
                  Nous transmettons donc votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse confirmer
                  la faisabilité technique du raccordement, et vous fournir une première estimation financière. Il sera en charge de vous
                  recontacter.
                </Text>
              </>
            ) : demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre bâtiment n'est pas à proximité immédiate d'un réseau de chaleur. Cependant, il reste suffisamment proche pour qu'un
                  raccordement soit potentiellement envisageable, mais seul le gestionnaire du réseau pourra vous confirmer la faisabilité
                  technique du raccordement et vous fournir une première estimation financière.
                </Text>
                <Text>
                  Nous transmettons donc votre demande au gestionnaire du réseau de chaleur le plus proche de votre adresse, qui sera en
                  charge de vous recontacter.
                </Text>
              </>
            ) : (
              <>
                <Text>Malheureusement, il n'existe pas de réseau de chaleur à proximité de votre bâtiment à ce jour.</Text>
                <Text>
                  Votre demande permettra tout de même à votre commune ou au gestionnaire du réseau le plus proche de prendre connaissance
                  de votre intérêt pour ce mode de chauffage. Vous pourrez ainsi être recontacté(e) s'il existe des projets de développement
                  de réseaux dans votre quartier.
                </Text>
                <Text>
                  L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique
                  et limiter votre impact écologique.
                </Text>
              </>
            ))}

          {demand['Type de chauffage'] === 'Individuel' &&
            (demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre bâtiment se situe à proximité d'un réseau de chaleur. Cependant, au vu de votre mode de chauffage actuel, des
                  travaux conséquents et coûteux seraient nécessaires pour le développement d'un réseau interne de chauffage dans votre
                  immeuble, indispensable dans le cas d'un raccordement à un réseau de chaleur.
                </Text>
                <Text>
                  Nous transmettons tout de même votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse
                  prendre connaissance de votre intérêt pour un raccordement.
                </Text>
                <Text>
                  L’amélioration de l’isolation thermique constitue un autre levier pour réduire votre facture énergétique et limiter votre
                  impact écologique.
                </Text>
              </>
            ) : (
              <>
                <Text>
                  Malheureusement, il n'existe pas de réseau de chaleur à proximité de votre bâtiment à ce jour. De plus, au vu de votre
                  mode de chauffage actuel, même en présence d’un réseau de chaleur à proximité, des travaux conséquents et coûteux seraient
                  nécessaires au sein de votre immeuble pour la mise en place d’un réseau de distribution interne de la chaleur.
                </Text>
                <Text>
                  Votre demande permettra tout de même à votre commune ou au gestionnaire du réseau le plus proche de prendre connaissance
                  de votre intérêt pour ce mode de chauffage.
                </Text>
                <Text>
                  L’amélioration de l’isolation thermique constitue un autre levier pour réduire votre facture énergétique et limiter votre
                  impact écologique.
                </Text>
              </>
            ))}
        </>
      )}

      {demand.Structure === 'Maison individuelle' && (
        <>
          {demand['Distance au réseau'] < intermediateDistanceThreshold ? (
            <Text>
              Votre adresse se situe à proximité d'un réseau de chaleur. Cependant, le raccordement des maisons individuelles aux réseaux de
              chaleur reste rare à ce jour, pour des raisons techniques et économiques. Nous transmettons tout de même votre demande au
              gestionnaire du réseau, mais il est probable qu'il ne puisse y donner suite.
            </Text>
          ) : (
            <>
              <Text>
                Malheureusement, il n'existe pas de réseau de chaleur à proximité de votre adresse à ce jour. De plus, le raccordement des
                maisons individuelles aux réseaux de chaleur reste rare aujourd'hui, pour des raisons techniques et économiques.
              </Text>
              <Text>
                Votre demande permettra tout de même à votre commune ou au gestionnaire du réseau le plus proche de prendre connaissance de
                votre intérêt pour ce mode de chauffage.
              </Text>
            </>
          )}
          <Text>
            L’amélioration de l’isolation thermique de votre maison constitue un autre levier pour réduire votre facture énergétique et
            limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique,, rendez-vous sur{' '}
            <Link href="https://france-renov.gouv.fr/">France Rénov</Link>.
          </Text>
        </>
      )}

      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

export default CreationDemandeEmail;
