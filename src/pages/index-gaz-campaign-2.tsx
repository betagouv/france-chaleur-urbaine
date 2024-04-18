import {
  ArrowPuce,
  WhiteArrowPuce,
} from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Simulator from '@components/Ressources/Contents/Simulator';
import StickyForm from '@components/StickyForm/StickyForm';
import SimplePage from '@components/shared/page/SimplePage';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Head from 'next/head';
import Image from 'next/image';

export default function Home() {
  return (
    <SimplePage title="France Chaleur Urbaine : Une solution numérique qui facilite le raccordement à un chauffage économique et écologique">
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
      </Head>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <Heading as="h1" center color="blue-france">
            Changez votre chaudière gaz pour
            <br />
            le chauffage urbain
          </Heading>
          <Text size="lg" textAlign="center">
            Découvrez les nombreux avantages des réseaux de chaleur&nbsp;!
          </Text>
          <Box className="fr-grid-row fr-grid-row--gutters" mt="10w">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_1.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Chauffage centralisé à l'échelle d'une ville ou d'un quartier
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_2.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Stabilité des tarifs, subventions et TVA à 5,5%
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_3.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Amélioration de l'étiquette DPE
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/gaz_campaign_4.svg"
                alt=""
                width={164}
                height={119}
                priority
                className="img-object-contain"
              />
              <Text size="md" textAlign="center" mt="2w">
                Faible émission de gaz à effet de serre
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      <StickyForm title="Testez en deux clics l'éligibilité de votre adresse" />

      <Box py="10w" id="comprendre-le-chauffage-urbain">
        <Box className="fr-container">
          <Heading as="h2" center>
            Comprendre le chauffage urbain
          </Heading>
          <ResponsiveRow mt="10w">
            <Box display="flex" flexDirection="column" alignItems="center" flex>
              <Heading as="h3" color="blue-france" mb="4w">
                Une alternative au fioul ou au gaz
              </Heading>
              <Text size="lg">
                Le chauffage urbain consiste à{' '}
                <strong>
                  distribuer de la chaleur produite de façon centralisée à un
                  ensemble de bâtiments
                </strong>
                , via des canalisations souterraines. On parle aussi de réseaux
                de chaleur.{' '}
                <strong>
                  Ces réseaux sont alimentés à plus de 66% par des{' '}
                  <Link href="/ressources/energies-vertes#contenu">
                    énergies renouvelables et de récupération locales
                  </Link>
                  .
                </strong>
              </Text>
              <Text size="lg" mt="3w">
                La chaleur est transportée jusqu'à une sous-station installée
                dans votre copropriété, puis acheminée aux différents logements
                par des canalisations internes à l’immeuble.
              </Text>
              <Link
                href="/documentation/guide-france-chaleur-urbaine.pdf"
                variant="primary"
                isExternal
                eventKey="Téléchargement|Guide FCU|coproprietaire"
                mt="3w"
              >
                Télécharger le guide de raccordement
              </Link>
            </Box>

            <Box flex>
              <Image
                src="/img/copro_comprendre.webp"
                alt="Schéma du chauffage urbain"
                width={944}
                height={890}
                priority
                className="fr-responsive-img"
              />

              <Link variant="primary" href="reseaux-chaleur#contenu">
                En savoir plus
              </Link>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <Heading as="h2" center>
            Comparatif des modes de chauffage
          </Heading>
          <ResponsiveRow mt="8w">
            <Box flex>
              <Image
                src="/img/chauffage_collectif_fioul.svg"
                alt=""
                width="270"
                height="206"
                priority
                className="d-block img-object-contain"
              />
              <Heading as="h3" mt="3w" legacyColor="darkerblue">
                Chauffage collectif au fioul
              </Heading>
              <Box>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Importantes émissions de gaz à effet de serre
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Énergie importée, dont l'approvisionnement est sensible au
                    contexte géopolitique
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Pollution de l'air (émission de particules fines)
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Coût élevé pour l'entretien de la chaudière
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Tarifs élevés et fortement fluctuants (près de 67&nbsp;% de
                    hausse entre septembre 2021 et août 2022)
                  </Text>
                </ArrowPuce>
              </Box>
            </Box>

            <Box flex>
              <Image
                src="/img/chauffage_collectif_gaz.svg"
                alt=""
                width="270"
                height="206"
                priority
                className="d-block img-object-contain"
              />
              <Heading as="h3" mt="3w" legacyColor="darkerblue">
                Chauffage collectif au gaz
              </Heading>
              <Box>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Importantes émissions de gaz à effet de serre
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Entretien rigoureux des installations nécessaire pour
                    limiter les risques associés aux chaudières
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Tarifs fortement fluctuants
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Énergie importée, dont l'approvisionnement est sensible au
                    contexte géopolitique
                  </Text>
                </ArrowPuce>
              </Box>
            </Box>

            <Box flex>
              <Image
                src="/img/chauffage_reseau_chaleur.svg"
                alt=""
                width="270"
                height="206"
                priority
                className="d-block img-object-contain"
              />
              <Heading as="h3" mt="3w" legacyColor="darkerblue">
                Réseau de chaleur
              </Heading>
              <Box>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Emissions de gaz à effet de serre et particules fines
                    limitées
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Absence de chaudière et de stockage au sein de l'immeuble -
                    sécurité assurée
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Garantie d'un service public
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    Tarifs moins fluctuants que ceux des énergies purement
                    fossiles
                  </Text>
                </ArrowPuce>
                <ArrowPuce>
                  <Text size="lg" legacyColor="black">
                    TVA à 5.5&nbsp;% pour tous les réseaux alimentés plus de
                    50&nbsp;% par des énergies renouvelables et de récupération
                  </Text>
                </ArrowPuce>
              </Box>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" id="couts-du-chauffage-urbain">
        <Box className="fr-container">
          <Heading as="h2" center>
            Les coûts du chauffage urbain
          </Heading>
          <ResponsiveRow mt="10w">
            <Box flex>
              <Heading as="h4" color="blue-france">
                Le coût du raccordement
              </Heading>
              <Text size="lg">
                Le coup de pouce{' '}
                <Link href="/ressources/aides#contenu">
                  "Chauffage des bâtiments résidentiels collectifs et
                  tertiaires”
                </Link>{' '}
                permet d’obtenir des aides financières conséquentes pour se
                raccorder. Le coût du raccordement peut ainsi être réduit à
                quelques centaines d’euros par logement.
              </Text>
              <Text size="sm" my="3w">
                Différentes entreprises signataires de la charte "Chauffage des
                bâtiments résidentiels collectifs et tertiaires” offrent cette
                prime.{' '}
                <strong>
                  Le montant de la prime peut significativement varier d’une
                  entreprise à l’autre, il est donc important de comparer les
                  offres proposées.
                </strong>
              </Text>
              <Box>
                <Simulator
                  cartridge
                  backgroundColor="#F8F5F1"
                  formBackgroundColor="#ffffff"
                  disclaimerLegacyColor="darkblue"
                />
              </Box>
            </Box>

            <Box flex>
              <Heading as="h4" color="blue-france">
                Le coût de la chaleur
              </Heading>
              <Text size="lg">
                Le{' '}
                <Link href="/chauffage-urbain#contenu">chauffage urbain</Link>{' '}
                est en moyenne le mode de chauffage le moins cher sur le marché
                pour les logements en habitat collectif (copropriété, logement
                social...), devant le gaz, l’électricité et le fioul. L’usage
                d’énergies locales assure également une certaine stabilité des
                prix.
              </Text>

              <Image
                src="/img/copro_cout_chaleur.webp"
                alt="Graphique comparatif du coût des méthodes de chauffage"
                width={944}
                height={499}
                className="fr-responsive-img"
              />
              <Text size="sm">
                Coût global annuel chauffage + eau chaude sanitaire pour un
                logement moyen (70&nbsp;m²) construit entre 2005 et 2012
                (consommation : 96&nbsp;kWhu/m²/an). Enquête sur le prix de
                vente de la chaleur et du froid 2022 (Amorce 2023)
              </Text>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box
        py="10w"
        backgroundColor="blue-france-main-525"
        id="comment-se-raccorder"
      >
        <Box className="fr-container">
          <Heading as="h2" legacyColor="white" center>
            Comment se raccorder
          </Heading>
          <ResponsiveRow mt="10w">
            <Box flex>
              <Heading as="h4" legacyColor="white" mb="4w">
                France Chaleur Urbaine est un service public qui vous met en
                lien avec le gestionnaire du réseau de chaleur
              </Heading>

              <WhiteArrowPuce>
                <Text size="lg">
                  Vérifiez que votre adresse est raccordable
                </Text>
              </WhiteArrowPuce>
              <WhiteArrowPuce>
                <Text size="lg">
                  Déposez une demande sur France Chaleur Urbaine
                </Text>
              </WhiteArrowPuce>
              <WhiteArrowPuce>
                <Text size="lg">
                  France Chaleur Urbaine transmet votre demande au gestionnaire
                  du réseau le plus proche de chez vous
                </Text>
              </WhiteArrowPuce>
              <WhiteArrowPuce>
                <Text size="lg">
                  Le gestionnaire vous recontacte pour étudier avec vous votre
                  projet de raccordement
                </Text>
              </WhiteArrowPuce>
            </Box>

            <Box flex>
              <Image
                src="/img/copro_guide_raccordement.webp"
                alt="Guide de raccordement à un réseau de chaleur"
                width={450}
                height={346}
                className="fr-responsive-img"
              />
              <Link
                href="/documentation/guide-france-chaleur-urbaine.pdf"
                variant="primary"
                isExternal
                eventKey="Téléchargement|Guide FCU|coproprietaire"
                mt="2w"
              >
                Télécharger le guide de raccordement
              </Link>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" id="obligations-de-raccordement">
        <Box className="fr-container">
          <Heading as="h2" center>
            Les obligations de raccordement
          </Heading>
          <ResponsiveRow mt="10w">
            <Box flex>
              <Heading as="h4" color="blue-france">
                Les réseaux classés
              </Heading>
              <Text size="lg">
                Plus de 500 réseaux de chaleur sont désormais{' '}
                <Link href="/ressources/reseau-classe#contenu">“classés”</Link>,
                ce qui signifie que certains bâtiments ont l'obligation de se
                raccorder.
              </Text>
              <Text size="lg" mt="3w">
                Cette obligation s’applique dans une certaine zone autour du
                réseau, définie par la collectivité, qualifiée de périmètre de
                développement prioritaire.
              </Text>

              <Box
                backgroundColor="yellow-moutarde-main-679"
                borderRadius="12px"
                p="3w"
                pt="4w"
                mt="3w"
                textColor="#fff"
                fontWeight="bold"
              >
                <Text>
                  <Text as="span" fontSize="32px">
                    300 000€
                  </Text>{' '}
                  d’amende
                </Text>
                <Text>en cas de non-raccordement sans dérogation</Text>
              </Box>
            </Box>

            <Box flex>
              <Text size="lg" mt="8w">
                Sont concernés :
              </Text>
              <Text size="lg" mt="2w">
                Tout bâtiment neuf dont les besoins de chauffage sont supérieurs
                à 30kW*
              </Text>
              <Text size="lg" mt="2w">
                Tout bâtiment renouvelant son installation de chauffage
                au-dessus de 30kW*
              </Text>
              <Text size="sm">
                * Ce seuil de puissance peut être relevé par la collectivité
              </Text>

              <Link variant="primary" href="/carte" mt="6w">
                Voir les réseaux classés sur la carte
              </Link>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>
    </SimplePage>
  );
}
