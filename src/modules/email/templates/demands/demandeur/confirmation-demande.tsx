import { businessRules } from '@/modules/app/business-rules';
import type { formatHeatingTypeToAirtable } from '@/modules/demands/constants';
import { Layout, Link, Section, Table, TableColumn, TableRow, Text, Title } from '@/modules/email/react-email/components';
import { defineEmailScenarios } from '@/modules/email/scenarios';
import type { AvailableStructure } from '@/types/AddressData';
import type { Demand } from '@/types/Summary/Demand';
import { isDefined } from '@/utils/core';

type ConfirmationDemandeProps = {
  demand: Pick<Demand, 'Adresse' | 'Distance au réseau' | 'Structure' | 'Departement'> & {
    Structure: AvailableStructure;
    'Type de chauffage': ReturnType<typeof formatHeatingTypeToAirtable>;
  };
};

const ConfirmationDemande = ({ demand }: ConfirmationDemandeProps) => {
  const distanceThreshold =
    demand.Departement === 'Paris' ? businessRules.veryEligibleDistanceParis.value : businessRules.veryEligibleDistanceDefault.value;
  const intermediateDistanceThreshold =
    demand.Departement === 'Paris' ? businessRules.eligibleDistanceParis.value : businessRules.eligibleDistanceDefault.value;
  return (
    <Layout>
      <Text>Bonjour,</Text>
      <Text>
        Nous vous remercions pour votre demande de contact sur{' '}
        <Link href="/" campaign="demands.demandeur.confirmation-demande" content="fcu-website">
          France Chaleur Urbaine
        </Link>{' '}
        pour le <strong>{demand.Adresse}</strong>.
      </Text>

      <Section style={{ backgroundColor: '#f8f8ff', marginBottom: '8px', padding: '12px 16px' }}>
        <Title style={{ fontSize: '16px', marginBottom: '8px' }}>Récapitulatif de votre demande</Title>
        <Table style={{ padding: 0 }}>
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold', width: '180px' }}>Adresse</TableColumn>
            <TableColumn>{demand.Adresse}</TableColumn>
          </TableRow>
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold', width: '180px' }}>Type de bâtiment</TableColumn>
            <TableColumn>{demand.Structure}</TableColumn>
          </TableRow>
          <TableRow>
            <TableColumn style={{ fontWeight: 'bold', width: '180px' }}>Mode de chauffage</TableColumn>
            <TableColumn>{demand['Type de chauffage']}</TableColumn>
          </TableRow>
          {isDefined(demand['Distance au réseau']) && (
            <TableRow>
              <TableColumn style={{ fontWeight: 'bold', width: '180px' }}>Distance au réseau</TableColumn>
              <TableColumn>{Math.round(demand['Distance au réseau'])} m</TableColumn>
            </TableRow>
          )}
        </Table>
      </Section>

      {demand.Structure === 'Copropriété' && (
        <>
          {demand['Type de chauffage'] === 'Collectif' &&
            (isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < distanceThreshold ? (
              <>
                <Text>
                  Votre copropriété est située <strong>à proximité d’un réseau de chaleur (moins de {distanceThreshold} m)</strong>. De
                  plus, au vu de votre mode de chauffage actuel, votre immeuble dispose déjà d’un réseau de distribution interne et
                  d’équipements adaptés au sein des logements : il s’agit du cas le plus favorable pour un raccordement.
                </Text>
                <Text>
                  Nous transmettons donc votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse confirmer
                  la faisabilité technique du raccordement, et vous fournir une première estimation financière. Il sera en charge de vous
                  recontacter.
                </Text>
                <Text>
                  Sans attendre, nous vous invitons à{' '}
                  <Link
                    href="/documentation/guide-france-chaleur-urbaine.pdf"
                    campaign="demands.demandeur.confirmation-demande"
                    content="guide-pdf"
                  >
                    télécharger notre guide
                  </Link>
                  , qui récapitule les grandes étapes pour se raccorder à un réseau de chaleur, ainsi que les principales aides financières
                  disponibles.
                </Text>
              </>
            ) : isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre copropriété <strong>n'est pas à proximité immédiate d'un réseau de chaleur</strong>. Cependant, elle reste
                  suffisamment proche pour qu'un raccordement soit potentiellement envisageable, mais seul le gestionnaire du réseau pourra
                  vous confirmer la faisabilité technique du raccordement (en fonction de la taille de votre copropriété, de sa consommation
                  d'énergie, des autres bâtiments raccordables à proximité,...), et vous fournir une première estimation financière.
                </Text>
                <Text>
                  Nous transmettons votre demande au gestionnaire du réseau de chaleur le plus proche de votre adresse, qui sera en charge
                  de vous recontacter.
                </Text>
              </>
            ) : (
              <>
                <Text>
                  Malheureusement, <strong>il n'existe pas de réseau de chaleur à proximité</strong> de votre bâtiment à ce jour.
                </Text>
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
            (isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre copropriété se situe <strong>à proximité d'un réseau de chaleur</strong>. Cependant, au vu de votre mode de
                  chauffage actuel, des travaux conséquents et coûteux seraient nécessaires pour le développement d'un réseau interne de
                  chauffage dans votre immeuble, indispensable dans le cas d'un raccordement à un réseau de chaleur.
                </Text>
                <Text>
                  Nous transmettons tout de même votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse
                  prendre connaissance de votre intérêt pour un raccordement.
                </Text>
              </>
            ) : (
              <>
                <Text>
                  Malheureusement, <strong>il n'existe pas de réseau de chaleur à proximité</strong> de votre bâtiment à ce jour. De plus,
                  au vu de votre mode de chauffage actuel, même en présence d’un réseau de chaleur à proximité, des travaux conséquents et
                  coûteux seraient nécessaires au sein de votre immeuble pour la mise en place d’un réseau de distribution interne de la
                  chaleur.
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
            (isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < distanceThreshold ? (
              <>
                <Text>
                  Votre adresse est située <strong>à proximité d’un réseau de chaleur (moins de {distanceThreshold} m)</strong>. De plus, au
                  vu de votre mode de chauffage actuel, votre immeuble dispose déjà d’équipements adaptés, notamment d’un réseau de
                  distribution interne : il s’agit du cas le plus favorable pour un raccordement.
                </Text>
                <Text>
                  Nous transmettons donc votre demande de raccordement au gestionnaire du réseau le plus proche afin qu’il puisse confirmer
                  la faisabilité technique du raccordement, et vous fournir une première estimation financière. Il sera en charge de vous
                  recontacter.
                </Text>
              </>
            ) : isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre bâtiment <strong>n'est pas à proximité immédiate d'un réseau de chaleur</strong>. Cependant, il reste suffisamment
                  proche pour qu'un raccordement soit potentiellement envisageable, mais seul le gestionnaire du réseau pourra vous
                  confirmer la faisabilité technique du raccordement et vous fournir une première estimation financière.
                </Text>
                <Text>
                  Nous transmettons donc votre demande au gestionnaire du réseau de chaleur le plus proche de votre adresse, qui sera en
                  charge de vous recontacter.
                </Text>
              </>
            ) : (
              <>
                <Text>
                  Malheureusement, il <strong>n'existe pas de réseau de chaleur à proximité</strong> de votre bâtiment à ce jour.
                </Text>
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
            (isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < intermediateDistanceThreshold ? (
              <>
                <Text>
                  Votre bâtiment se situe <strong>à proximité d'un réseau de chaleur</strong>. Cependant, au vu de votre mode de chauffage
                  actuel, des travaux conséquents et coûteux seraient nécessaires pour le développement d'un réseau interne de chauffage
                  dans votre immeuble, indispensable dans le cas d'un raccordement à un réseau de chaleur.
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
                  Malheureusement, il <strong>n'existe pas de réseau de chaleur à proximité</strong> de votre bâtiment à ce jour. De plus,
                  au vu de votre mode de chauffage actuel, même en présence d’un réseau de chaleur à proximité, des travaux conséquents et
                  coûteux seraient nécessaires au sein de votre immeuble pour la mise en place d’un réseau de distribution interne de la
                  chaleur.
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
          {isDefined(demand['Distance au réseau']) && demand['Distance au réseau'] < intermediateDistanceThreshold ? (
            <Text>
              Votre adresse se situe <strong>à proximité d'un réseau de chaleur</strong>. Cependant, le raccordement des maisons
              individuelles aux réseaux de chaleur reste rare à ce jour, pour des raisons techniques et économiques. Nous transmettons tout
              de même votre demande au gestionnaire du réseau, mais il est probable qu'il ne puisse y donner suite.
            </Text>
          ) : (
            <>
              <Text>
                Malheureusement, il <strong>n'existe pas de réseau de chaleur à proximité</strong> de votre adresse à ce jour. De plus, le
                raccordement des maisons individuelles aux réseaux de chaleur reste rare aujourd'hui, pour des raisons techniques et
                économiques.
              </Text>
              <Text>
                Votre demande permettra tout de même à votre commune ou au gestionnaire du réseau le plus proche de prendre connaissance de
                votre intérêt pour ce mode de chauffage.
              </Text>
            </>
          )}
          <Text>
            L’amélioration de l’isolation thermique de votre maison constitue un autre levier pour réduire votre facture énergétique et
            limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur{' '}
            <Link href="https://france-renov.gouv.fr/">France Rénov</Link>.
          </Text>
        </>
      )}

      <Text>
        Pour toute question sur votre demande, vous pouvez utiliser le{' '}
        <Link href="/contact" campaign="demands.demandeur.confirmation-demande" content="contact">
          formulaire de contact
        </Link>
        .
      </Text>
      <Text>Bien cordialement,</Text>
      <Text>L'équipe France Chaleur Urbaine</Text>
    </Layout>
  );
};

const adresseProvince = '12 Place du Capitole, 31000 Toulouse';
const adresseParis = '123 Rue de la Paix, 75002 Paris';
const departementProvince = 'Haute-Garonne';
const departementParis = 'Paris';

export const scenarios = defineEmailScenarios<typeof ConfirmationDemande>({
  copro_collectif_inf100m: {
    label: 'Province · Copropriété · Collectif · < 100 m (proche)',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 80,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  copro_collectif_inf200m: {
    label: 'Province · Copropriété · Collectif · 100-200 m (intermédiaire)',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 150,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  copro_collectif_sup200m: {
    label: 'Province · Copropriété · Collectif · > 200 m (éloigné)',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 250,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  copro_individuel_inf200m: {
    label: 'Province · Copropriété · Individuel · < 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 150,
        Structure: 'Copropriété',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  copro_individuel_sup200m: {
    label: 'Province · Copropriété · Individuel · > 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 250,
        Structure: 'Copropriété',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  maison_individuel_inf200m: {
    label: 'Province · Maison · Individuel · < 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 150,
        Structure: 'Maison individuelle',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  maison_individuel_sup200m: {
    label: 'Province · Maison · Individuel · > 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 250,
        Structure: 'Maison individuelle',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  paris_copro_collectif_inf60m: {
    label: 'Paris · Copropriété · Collectif · < 60 m (proche)',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 40,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  paris_copro_collectif_inf100m: {
    label: 'Paris · Copropriété · Collectif · 60-100 m (intermédiaire)',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 80,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  paris_copro_collectif_sup100m: {
    label: 'Paris · Copropriété · Collectif · > 100 m (éloigné)',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 150,
        Structure: 'Copropriété',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  paris_copro_individuel_inf100m: {
    label: 'Paris · Copropriété · Individuel · < 100 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 80,
        Structure: 'Copropriété',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  paris_copro_individuel_sup100m: {
    label: 'Paris · Copropriété · Individuel · > 100 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 150,
        Structure: 'Copropriété',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  paris_tertiaire_collectif_inf60m: {
    label: 'Paris · Tertiaire · Collectif · < 60 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 50,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  paris_tertiaire_collectif_inf100m: {
    label: 'Paris · Tertiaire · Collectif · 60-100 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 80,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  paris_tertiaire_collectif_sup100m: {
    label: 'Paris · Tertiaire · Collectif · > 100 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 150,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  paris_tertiaire_individuel_inf100m: {
    label: 'Paris · Tertiaire · Individuel · < 100 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 50,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  paris_tertiaire_individuel_sup100m: {
    label: 'Paris · Tertiaire · Individuel · > 100 m',
    props: {
      demand: {
        Adresse: adresseParis,
        Departement: departementParis,
        'Distance au réseau': 150,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  tertiaire_collectif_inf100m: {
    label: 'Province · Tertiaire · Collectif · < 100 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 80,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  tertiaire_collectif_inf200m: {
    label: 'Province · Tertiaire · Collectif · 100-200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 150,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  tertiaire_collectif_sup200m: {
    label: 'Province · Tertiaire · Collectif · > 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 250,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Collectif',
      },
    },
  },
  tertiaire_individuel_inf200m: {
    label: 'Province · Tertiaire · Individuel · < 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 150,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Individuel',
      },
    },
  },
  tertiaire_individuel_sup200m: {
    label: 'Province · Tertiaire · Individuel · > 200 m',
    props: {
      demand: {
        Adresse: adresseProvince,
        Departement: departementProvince,
        'Distance au réseau': 250,
        Structure: 'Tertiaire',
        'Type de chauffage': 'Individuel',
      },
    },
  },
});

export default ConfirmationDemande;
