import LastArticles from '@components/Articles/LastArticles';
import BulkEligibilityForm from '@components/EligibilityForm/BulkEligibilityForm';
import IframeIntegration from '@components/GenericContent/IframeIntegration';
import ObligationRaccordement from '@components/GenericContent/ObligationRaccordement';
import ReduireImpact from '@components/GenericContent/ReduireImpact';
import HeadSliceForm from '@components/HeadSliceForm';
import { ArrowPuce } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Partners from '@components/Partners/Partners';
import { issues, understandings } from '@components/Ressources/config';
import SimulateurCoutRaccordement from '@components/Ressources/Contents/SimulateurCoutRaccordement';
import Understanding from '@components/Ressources/Understanding';
import SimplePage from '@components/shared/page/SimplePage';
import SimulatorCO2 from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import Owner from '@components/Tertiaire/Owner';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Head from 'next/head';
import Image from 'next/image';

const conseillerCards = {
  'energies-vertes': issues['energies-vertes'],
  avantages: understandings.avantages,
  aides: understandings.aides,
  prioritaire: understandings.prioritaire,
};

const Professionnels = () => {
  return (
    <SimplePage title="France Chaleur Urbaine : Une solution numérique qui facilite le raccordement à un chauffage économique et écologique">
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
      </Head>

      <HeadSliceForm
        checkEligibility
        withBulkEligibility
        externBulkForm
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
                  src="/img/head-slice-bg-professionnels.png"
                  alt=""
                  width={533}
                  height={407}
                  priority
                />
              </Box>

              <Box flex py="3w">
                <Text fontSize="24px" fontWeight="bold" legacyColor="black">
                  Gestionnaires de bâtiments tertiaires, bailleurs sociaux,
                  bureaux d’étude, syndics, ...
                </Text>
                <Heading as="h1" size="h2" color="blue-france" mt="1w">
                  Faites un choix d’avenir, écologique et compétitif
                </Heading>
                <Text mb="2w">Le bâtiment peut-il être raccordé ?</Text>
                {form}
              </Box>
            </Box>
          </Box>
        )}
      />

      <Box py="10w" id="avantages-du-chauffage-urbain">
        <Box className="fr-container">
          <Heading as="h2" center>
            Les avantages du chauffage urbain
          </Heading>
          <Box className="fr-grid-row fr-grid-row--gutters" mt="10w">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/copro_avantages_1.webp"
                alt=""
                width={160}
                height={125}
                priority
                className="img-object-contain"
              />
              <Text size="lg" textAlign="center" mt="2w">
                Bénéficie d’une TVA à 5,5% et de tarifs plus stables grâce à des
                énergies locales
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/copro_avantages_3.webp"
                alt=""
                width={160}
                height={125}
                priority
                className="img-object-contain"
              />
              <Text size="lg" textAlign="center" mt="2w">
                Diminue les émissions de gaz à effet de serre d’en moyenne 50%
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/pro_avantages_3.svg"
                alt=""
                width={160}
                height={125}
                priority
                className="img-object-contain"
              />
              <Text size="lg" textAlign="center" mt="2w">
                Améliore l'étiquette DPE des bâtiments
              </Text>
            </Box>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-3"
            >
              <Image
                src="/img/pro_avantages_4.svg"
                alt=""
                width={160}
                height={125}
                priority
                className="img-object-contain"
              />
              <Text size="lg" textAlign="center" mt="2w">
                Contribue aux objectifs éco-énergie tertiaire (-23% de réduction
                de consommation comptabilisés)
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <Heading as="h2" center>
            France Chaleur Urbaine outille les professionnels
          </Heading>
          <ResponsiveRow mt="8w">
            <Box flex>
              <Image
                src="/img/pro_picto_1.svg"
                alt=""
                width={270}
                height={232}
                priority
                className="img-object-contain"
              />
              <Heading as="h4" color="blue-france">
                Découvrez notre cartographie
              </Heading>
              <Text size="lg">
                <Link href="/carte">Localisez les réseaux de chaleur</Link>{' '}
                existants et en construction, accédez à leurs caractéristiques
                détaillées
              </Text>
            </Box>

            <Box flex>
              <Image
                src="/img/pro_picto_2.svg"
                alt=""
                width={270}
                height={232}
                priority
                className="img-object-contain"
              />
              <Heading as="h4" color="blue-france">
                Testez un grand nombre d’adresses
              </Heading>
              <Text size="lg">
                <Link href="#test-liste">Identifiez instantanément</Link> les
                bâtiments raccordables de votre parc
              </Text>
            </Box>

            <Box flex>
              <Image
                src="/img/pro_picto_3.svg"
                alt=""
                width={270}
                height={232}
                priority
                className="img-object-contain"
              />
              <Heading as="h4" color="blue-france">
                Estimez le montant des aides
              </Heading>
              <Text size="lg">
                <Link href="#simulateur-aide">
                  Découvrez le montant du coup de pouce chauffage
                </Link>{' '}
                des bâtiments résidentiels collectifs et tertiaires
              </Text>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" id="test-liste">
        <Box className="fr-container">
          <Heading as="h2" center>
            Testez un grand nombre d’adresses en 2 clics
          </Heading>
          <ResponsiveRow mt="10w">
            <Box flex>
              <Heading as="h4" color="blue-france">
                Identifiez facilement les bâtiments proches des réseaux de
                chaleur !
              </Heading>
              <ArrowPuce>
                <Text size="lg" color="grey">
                  Téléchargez votre fichier (une ligne par adresse) et
                  renseignez votre email
                </Text>
              </ArrowPuce>
              <ArrowPuce>
                <Text size="lg" color="grey">
                  Recevez par mail le résultat de votre test
                </Text>
              </ArrowPuce>
              <ArrowPuce>
                <Text size="lg" color="grey">
                  Visualisez les adresses testées sur notre cartographie
                </Text>
              </ArrowPuce>
              <ArrowPuce>
                <Text size="lg" color="grey">
                  Vous pourrez ensuite sélectionner dans la liste les adresses
                  pour lesquelles vous souhaitez être mis en relation par France
                  Chaleur Urbaine avec le(s) gestionnaire(s) des réseaux de
                  chaleur.
                </Text>
              </ArrowPuce>
            </Box>

            <Box flex>
              <BulkEligibilityForm />
              <Image
                width="405"
                height="250"
                alt=""
                src="/img/carto-addresses.png"
              />
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75" id="simulateur-aide">
        <Box className="fr-container">
          <Heading as="h2" center>
            La solution de chauffage la plus compétitive
            <br />
            pour les bâtiments tertiaires performants
          </Heading>

          <Heading as="h4" color="blue-france" mt="10w">
            Le coût du raccordement
          </Heading>
          <Text>
            Estimez le montant du Coup de pouce
            <Link href="/ressources/aides#contenu">
              "Chauffage des bâtiments résidentiels collectifs et tertiaires”
            </Link>{' '}
            pour le raccordement d’un bâtiment
          </Text>
          <Text my="3w">
            Différentes entreprises signataires de la charte "Chauffage des
            bâtiments résidentiels collectifs et tertiaires” offrent cette
            prime.{' '}
            <strong>
              Le montant de la prime peut significativement varier d’une
              entreprise à l’autre, il est donc important de comparer les offres
              proposées.
            </strong>
          </Text>
          <SimulateurCoutRaccordement embedded typeBatiment="tertiaire" />

          <Heading as="h4" color="blue-france" mt="10w">
            Le coût de la chaleur
          </Heading>
          <ResponsiveRow>
            <Box flex>
              <Text>
                Le{' '}
                <Link href="/chauffage-urbain#contenu">chauffage urbain</Link>{' '}
                est en moyenne le mode de chauffage le moins cher sur le marché
                pour un bâtiment tertiaire performant RE2020
                (28&nbsp;kWhu/m²/an)
              </Text>
              <Text mt="3w">
                Retrouvez le prix moyen de la chaleur pour les réseaux classés
                sur les fiches accessibles depuis notre{' '}
                <Link href="/carte">cartographie</Link>.
              </Text>
            </Box>

            <Box flex>
              <Image
                src="/img/pro_cout_chaleur.svg"
                alt="Graphique comparatif du coût des méthodes de chauffage"
                width={944}
                height={499}
                className="fr-responsive-img"
              />
              <Text size="xs">
                Coût global chauffage et eau chaude sanitaire (€TTC/an) pour un
                bâtiment de 1000&nbsp;m². Enquête sur le prix de vente de la
                chaleur et du froid 2022 (Amorce 2023)
              </Text>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box>
        <Owner />
      </Box>

      <Box
        py="10w"
        backgroundColor="blue-france-975-75"
        id="obligations-de-raccordement"
      >
        <ObligationRaccordement />
      </Box>

      <Box py="10w" backgroundColor="blue-france-main-525" id="simulateur-co2">
        <Box className="fr-container">
          <Heading as="h2" center legacyColor="white">
            Un moyen de lutter contre le changement climatique
          </Heading>
          <ResponsiveRow pt="4w">
            <Box className="fr-col-12 fr-col-lg-6 fr-col-xl-6">
              <SimulatorCO2 typeSurf={TypeSurf.tertiaire} textColor="#ffffff" />
            </Box>
            <Box
              textColor="#ffffff"
              className="fr-col-12 fr-col-lg-6 fr-col-xl-6"
            >
              <Image
                width={75}
                height={62}
                alt=""
                src="/icons/picto_warning_white.svg"
              />
              <Text size="lg" mt="2w">
                Depuis le 1er juillet 2022, de nouvelles normes
                environnementales, qui visent à limiter les émissions de gaz à
                effet de serre, sont entrées en vigueur : elles excluent
                l'installation de nouvelles chaudières au fioul.
              </Text>
              <Text size="lg" mt="2w">
                <Link href="/ressources/aides#contenu">Des aides</Link>{' '}
                accompagnent cette transition.
              </Text>
            </Box>
          </ResponsiveRow>
        </Box>
      </Box>

      <Box py="10w">
        <IframeIntegration pageFrom="pro" />
      </Box>

      <Box py="10w" backgroundColor="blue-france-975-75" id="articles">
        <Box className="fr-container">
          <Heading as="h2" center>
            Nos articles sur le chauffage urbain
          </Heading>
          <Box className="fr-grid-row" mt="10w">
            <Understanding cards={conseillerCards} />
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
        <ReduireImpact />
      </Box>
    </SimplePage>
  );
};

export default Professionnels;
