import LastArticles from '@components/Articles/LastArticles';
import InterviewsVideos from '@components/Coproprietaire/InterviewsVideos';
import HeadSliceForm from '@components/HeadSliceForm';
import { WhiteArrowPuce } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Partners from '@components/Partners/Partners';
import { issues, understandings } from '@components/Ressources/config';
import Simulator from '@components/Ressources/Contents/Simulator';
import Understanding from '@components/Ressources/Understanding';
import SimplePage from '@components/shared/page/SimplePage';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { Icon } from '@dataesr/react-dsfr';
import Head from 'next/head';
import Image from 'next/image';

const coproprietaireCards = {
  reseau: issues.reseau,
  atouts: issues.atouts,
  'energies-vertes': issues['energies-vertes'],
  faisabilite: understandings.faisabilite,
};

export default function Home() {
  return (
    <SimplePage title="France Chaleur Urbaine : Une solution numérique qui facilite le raccordement à un chauffage économique et écologique">
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
      </Head>

      <HeadSliceForm
        bg="/img/copro_head_test_adresse.avif"
        checkEligibility
        needGradient
        withWrapper={(form) => (
          <Box backgroundColor="blue-cumulus-950-100">
            <Box
              className="fr-container"
              display="flex"
              alignItems="center"
              gap="16px"
            >
              <Box flex className="fr-hidden fr-unhidden-lg">
                <Image
                  src="/img/copro_test_adresse.avif"
                  alt=""
                  width={584}
                  height={393}
                  priority
                  className="fr-responsive-img"
                />
              </Box>

              <Box flex py="3w">
                <Text fontSize="24px" fontWeight="bold" legacyColor="black">
                  Vous êtes copropriétaire ?
                </Text>
                <Heading as="h1" size="h2" color="blue-france" mt="1w">
                  Le chauffage urbain&nbsp;: une solution écologique à prix
                  maîtrisé&nbsp;!
                </Heading>
                <Text mb="2w">Testez votre éligibilité en 2 clics</Text>
                {form}
              </Box>
            </Box>
          </Box>
        )}
      />

      <Box py="10w" id="comprendre-le-chauffage-urbain">
        <Box className="fr-container">
          <Heading as="h2" center>
            Comprendre le chauffage urbain
          </Heading>
          <ResponsiveRow mt="10w">
            <Box display="flex" flexDirection="column" alignItems="center" flex>
              <Heading as="h3" color="blue-france" mb="4w">
                Un chauffage écologique à prix compétitif déjà adopté par 6
                millions de Français
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
              <Text size="lg" mt="3w">
                Dans la plupart des cas, le réseau de chaleur appartient à une
                collectivité territoriale et est{' '}
                <Link href="/ressources/acteurs#contenu">
                  géré en concession
                </Link>{' '}
                par un exploitant, qui s’occupe notamment des raccordements.
              </Text>
            </Box>

            <Box flex>
              <Image
                src="/img/copro_comprendre.avif"
                alt="Schéma du chauffage urbain"
                width={589}
                height={555}
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

      <Box
        py="10w"
        backgroundColor="blue-france-975-75"
        id="avantages-du-chauffage-urbain"
      >
        <Box className="fr-container">
          <Heading as="h2" center>
            Les avantages du chauffage urbain
          </Heading>
          <Box className="fr-grid-row fr-grid-row--gutters" mt="10w">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-md-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/copro_avantages_1.avif"
                alt=""
                width={160}
                height={125}
                priority
              />
              <Text size="lg" textAlign="center" mt="2w">
                Bénéficiez de tarifs plus stables grâce à des énergies locales
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-md-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/copro_avantages_2.avif"
                alt=""
                width={160}
                height={125}
                priority
              />
              <Text size="lg" textAlign="center" mt="2w">
                Profitez de subventions pour le raccordement et d’une TVA à 5,5%
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-md-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/copro_avantages_3.avif"
                alt=""
                width={160}
                height={125}
                priority
              />
              <Text size="lg" textAlign="center" mt="2w">
                Diminuez vos émissions de gaz à effet de serre d’en moyenne 50%
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-md-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/copro_avantages_4.avif"
                alt=""
                width={160}
                height={125}
                priority
              />
              <Text size="lg" textAlign="center" mt="2w">
                Améliorez l'étiquette DPE de votre copropriété
              </Text>
            </Box>
          </Box>
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

            <Box flex>
              <Image
                src="/img/copro_guide_raccordement.avif"
                alt="Guide de raccordement à un réseau de chaleur"
                width={409}
                height={313}
                className="fr-responsive-img"
              />
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

              <Simulator cartridge />
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
                src="/img/copro_cout_chaleur.avif"
                alt="Graphique comparatif du coût des méthodes de chauffage"
                width={502}
                height={266}
                className="fr-responsive-img"
              />
              <Text size="sm">
                Coût global annuel chauffage + eau chaude sanitaire pour un
                logement moyen (70 m2) construit entre 2005 et 2012
                (consommation : 96 kWhu/m2/an). Enquête sur le prix de vente de
                la chaleur et du froid 2022 (Amorce 2023)
              </Text>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <ResponsiveRow>
            <Box flex>
              <Heading as="h4" color="blue-france">
                Un exemple de cas concret
              </Heading>

              <Text size="lg">
                Copropriété chauffée au gaz collectif de 126 logements répartis
                en 3 bâtiments.
              </Text>

              <Box display="flex" alignItems="center" mt="4w">
                <Image
                  src="/img/copro_cout_1.avif"
                  alt=""
                  width={160}
                  height={140}
                  className="img-object-contain"
                />
                <Box ml="2w">
                  <Text size="lg">Durée des travaux&nbsp;:</Text>
                  <Text size="lg" color="success">
                    4 mois
                  </Text>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mt="1w">
                <Image
                  src="/img/copro_cout_2.avif"
                  alt=""
                  width={160}
                  height={140}
                  className="img-object-contain"
                />
                <Box ml="2w">
                  <Text size="lg">Coût du raccordement&nbsp;:</Text>
                  <Text size="lg">105 000€ - 76 000€ d’aides</Text>
                  <Text size="lg" color="success">
                    = 230€ par lot
                  </Text>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" mt="1w">
                <Image
                  src="/img/copro_cout_3.avif"
                  alt=""
                  width={160}
                  height={140}
                  className="img-object-contain"
                />
                <Box ml="2w">
                  <Text size="lg">Coût de la chaleur&nbsp;:</Text>
                  <Text size="lg">
                    <Text as="span" size="lg" color="success">
                      108€/mois
                    </Text>{' '}
                    pour un T4
                  </Text>
                  <Text size="lg">chauffage et eau chaude</Text>
                </Box>
              </Box>
            </Box>

            <Box flex>
              <Heading as="h4" color="blue-france">
                Les témoignages
              </Heading>
              <Text size="lg" mb="2w">
                Le chauffage urbain, ce sont les copropriétaires et les syndics
                qui en parlent le mieux !
              </Text>

              <Icon name="fr-icon-quote-line" color="#6A6AF4" />

              <Text as="blockquote" ml="0" mt="1w" fontStyle="italic">
                Je conseille vivement le raccordement à un réseau de chaleur
                pour des raisons économiques et écologiques.
              </Text>
              <Text size="sm" mt="2w">
                Henry Hostein Président du conseil syndical
              </Text>

              <Box mt="3w">
                <InterviewsVideos />
              </Box>
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

      <Box py="10w" backgroundColor="blue-france-975-75" id="articles">
        <Box className="fr-container">
          <Heading as="h2" center>
            Nos articles sur le chauffage urbain
          </Heading>
          <Box className="fr-grid-row" mt="10w">
            <Understanding cards={coproprietaireCards} />
          </Box>
        </Box>
      </Box>

      <Box py="10w" id="actus">
        <Box className="fr-container">
          <Heading as="h2" center>
            Nos actualités
          </Heading>
          <Box className="fr-grid-row" mt="10w">
            <LastArticles />
          </Box>
        </Box>
      </Box>

      <Partners />

      <Box py="10w" backgroundColor="blue-france-main-525" textColor="#fff">
        <Box className="fr-container">
          <Heading as="h5" legacyColor="white">
            Réduire l'impact écologique et économique de son chauffage
          </Heading>
          <Text mt="3w">
            Le chauffage urbain, une solution pour les copropriétés
          </Text>
          <Text mt="3w">
            Le chauffage représente 67 % de la consommation d’énergie des foyers
            français et près de 20 % des émissions de gaz à effet de serre
            nationales. L’augmentation des prix de l’énergie pèse sur le budget
            des ménages : 40 % des logements sont encore chauffés au gaz, dont
            les prix ont augmenté de 41 % en 10 ans.
          </Text>
          <Text mt="3w">
            Pour réduire l’impact écologique d’une copropriété et ses factures
            d’énergie, la rénovation thermique est le premier réflexe à avoir.
            Le{' '}
            <Link href="/ressources/avantages#contenu">
              remplacement d’un chauffage collectif au gaz ou fioul
            </Link>
            , par un raccordement à un réseau de chaleur permet également d’y
            contribuer. Alimentés majoritairement par des énergies renouvelables
            et de récupération locales, les réseaux de chaleur émettent deux
            fois moins de gaz à effet de serre qu’un chauffage gaz ou fioul et
            offrent des prix stables et compétitifs.
          </Text>
          <Text mt="6w">
            Des réseaux de chaleur existent dans la plupart des grandes villes,
            par exemple <Link href="/villes/paris">Paris</Link>,{' '}
            <Link href="/villes/rennes">Rennes</Link>,{' '}
            <Link href="/villes/nantes">Nantes</Link>,{' '}
            <Link href="/villes/bordeaux">Bordeaux</Link>,{' '}
            <Link href="/villes/strasbourg">Strasbourg</Link>,{' '}
            <Link href="/villes/metz">Metz</Link>,{' '}
            <Link href="/villes/grenoble">Grenoble</Link>,{' '}
            <Link href="/villes/lyon">Lyon</Link>,{' '}
            <Link href="/villes/aix-en-provence">Aix-en-Provence</Link>,...
          </Text>
        </Box>
      </Box>
    </SimplePage>
  );
}
