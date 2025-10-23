import Highlight from '@codegouvfr/react-dsfr/Highlight';
import { AnimatePresence } from 'motion/react';
import { clientConfig } from '@/client-config';
import LastArticles from '@/components/Articles/LastArticles';
import InterviewsVideos from '@/components/Coproprietaire/InterviewsVideos';
import HeadSliceForm from '@/components/HeadSliceForm';
import Partners from '@/components/Partners/Partners';
import { issues, understandings } from '@/components/Ressources/config';
import Understanding from '@/components/Ressources/Understanding';
import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Card from '@/components/ui/Card';
import Hero, { HeroContent, HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import colors from '@/components/ui/helpers/colors';
import Icon from '@/components/ui/Icon';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import Markdown from '@/components/ui/Markdown';
import Section, { SectionContent, SectionHeading, SectionTitle, SectionTwoColumns } from '@/components/ui/Section';
import Text from '@/components/ui/Text';
import type { TrackingEvent } from '@/modules/analytics/client';
import cx from '@/utils/cx';

const coproprietaireCards = {
  atouts: issues.atouts,
  'energies-vertes': issues['energies-vertes'],
  faisabilite: understandings.faisabilite,
  reseau: issues.reseau,
};

const tools: { eventKey: TrackingEvent; excerpt: string; href: string; image: string; title: string }[] = [
  {
    eventKey: 'Outil|Carte des réseaux et potentiels',
    excerpt: 'Visualisez les données des réseaux de chaleur.',
    href: '/carte',
    image: '/icons/tools/v2/carte.svg',
    title: 'Carte',
  },
  {
    eventKey: 'Outil|Potentiel des communes sans réseau',
    excerpt: 'Identifiez le potentiel des communes sans réseau.',
    href: '/collectivites-et-exploitants/potentiel-creation-reseau',
    image: '/icons/tools/v2/reseau_avenir.svg',
    title: 'Réseau d’avenir',
  },
  {
    eventKey: 'Outil|Coûts de raccordement et aides',
    excerpt: 'Calculez le coût du raccordement et les aides.',
    href: '/ressources/cout-raccordement#contenu',
    image: '/icons/tools/v2/raccordement.svg',
    title: 'Raccordement',
  },
  {
    eventKey: 'Outil|Obligations de raccordement',
    excerpt: 'Êtes-vous concerné par une obligation de raccordement ?',
    href: '/ressources/obligations-raccordement#contenu',
    image: '/icons/tools/v2/obligations.svg',
    title: 'Obligations',
  },

  {
    eventKey: "Outil|Test d'adresses en masse",
    excerpt: 'Testez instantanément une liste d’adresses.',
    href: '/pro/tests-adresses',
    image: '/icons/tools/v2/test_en_masse.svg',
    title: 'Test en masse',
  },
  {
    eventKey: 'Outil|Décret tertiaire',
    excerpt: 'Découvrez le dispositif Éco-Énergie Tertiaire.',
    href: '/ressources/dispositif-eco-energie-tertiaire#contenu',
    image: '/icons/tools/v2/decret_tertiaire.svg',
    title: 'Décret tertiaire',
  },
  {
    eventKey: 'Outil|Liste des réseaux de chaleur',
    excerpt: 'Comparez les caractéristiques des réseaux.',
    href: '/reseaux',
    image: '/icons/tools/v2/liste_reseaux.svg',
    title: 'Liste des réseaux',
  },

  // {
  //   title: 'Téléchargement de données et outils',
  //   excerpt: 'Intégrez nos données et outils (API, iframe, ...).',
  //   href: '/ressources/outils',
  //   image: '/icons/tools/system.svg',
  //   eventKey: 'Outil|Téléchargement de données et outils',
  // },
  // {
  //   title: 'Supports pédagogiques',
  //   excerpt: 'Découvrez tous nos supports.',
  //   href: '/ressources/supports',
  //   image: '/icons/tools/pictures.svg',
  //   eventKey: 'Outil|Supports pédagogiques',
  // },
];

const benefits = [
  '::arrow-item[**Bénéficiez de tarifs plus stables** grâce à des énergies locales]',
  "::arrow-item[**Profitez de subventions** pour le raccordement et d'une TVA à 5,5%]",
  "::arrow-item[**Améliorez l'étiquette DPE** de votre copropriété]",
  "::arrow-item[**Valorisez les émissions de gaz à effet de serre** d'en moyenne 50%]",
];

const mainTools = [
  {
    description: 'Comparez les coûts de la chaleur et les émissions de tous les modes de chauffage.',
    eventKey: "Outil|Comparateur de coûts et d'émissions de CO2" as TrackingEvent,
    href: '/comparateur-couts-performances',
    imageAlt: 'Illustration comparateur de coûts et émissions',
    imageUrl: '/img/illustrations/benefices-comparateur.svg',
    title: "Comparez les coûts et d'émissions de CO₂",
  },
  {
    description: 'Comparez en 2 clics les différents prix des chauffages écologiques.',
    eventKey: 'Outil|Compatibilité des modes de chauffage' as TrackingEvent,
    href: '/chaleur-renouvelable',
    imageAlt: 'Illustration chauffage écologique',
    imageUrl: '/img/illustrations/benefices-chauffage.svg',
    title: 'Quel chauffage convient le mieux à votre copropriété ?',
  },
];
function Home() {
  return (
    <SimplePage
      title="Développer le chauffage urbain"
      description="Vérifiez si votre bâtiment est raccordable à un réseau de chaleur, un mode de chauffage écologique à prix maîtrisés."
    >
      <Hero image="/img/banner_chauffage_gaz.png">
        <HeroTitle>Le chauffage urbain&nbsp;: une solution écologique à prix maîtrisé&nbsp;!</HeroTitle>
        <HeroSubtitle>
          Testez votre éligibilité
          {clientConfig.flags.enableComparateurWidget && (
            <>
              {' '}
              et comparez les coûts <strong>en 2 clics</strong>
            </>
          )}
        </HeroSubtitle>
        <HeroContent>
          <HeadSliceForm checkEligibility withWrapper={(form) => <>{form}</>} withBulkEligibility />
        </HeroContent>
      </Hero>

      <Section>
        <SectionTwoColumns>
          <div className="flex flex-col justify-between h-full flex-[2]!">
            <Markdown color="#333" className="">
              {benefits.join('\n')}
            </Markdown>
            <div className="mt-8">
              <Link
                variant="primary"
                href="/documentation/guide-france-chaleur-urbaine.pdf"
                eventKey="Téléchargement|Guide FCU|professionnels"
                isExternal
              >
                Télécharger le guide de raccordement
              </Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-[3]! mx-auto max-w-xl">
            {mainTools.map((mainTool) => (
              <Card
                eventKey={mainTool.eventKey}
                size="sm"
                imageAspect="square"
                className="flex-1"
                imageUrl={mainTool.imageUrl}
                imageAlt={mainTool.imageAlt}
                key={mainTool.href}
                title={mainTool.title}
                desc={mainTool.description}
                linkProps={{
                  href: mainTool.href,
                }}
                enlargeLink
              />
            ))}
          </div>
        </SectionTwoColumns>
      </Section>
      <Section variant="light" size="sm">
        <SectionContent className={cx('flex flex-wrap items-stretch justify-center gap-2 transition-all duration-300')}>
          <AnimatePresence mode="popLayout">
            {tools.map((tile, index) => (
              <>
                <Link
                  key={`${tile.title}-${index}`}
                  className="shrink-0 text-center hover:bg-gray-50! cursor-pointer rounded-md p-0.5 py-5 flex flex-col gap-2 tracking-tight flex-1 min-w-[150px] max-w-[150px] bg-none"
                  href={tile.href}
                  eventKey={tile.eventKey}
                >
                  <Image src={tile.image} alt="" width={64} height={64} className="mx-auto" />
                  <h2 className="text-base font-semibold text-gray-900 mb-0">{tile.title}</h2>
                  <p className="text-sm text-gray-500 mb-0">{tile.excerpt}</p>
                </Link>
                {index < tools.length - 1 && (
                  <div className="flex items-center justify-center">
                    <div className="w-px h-1/2 bg-[#E3E4FD]" />
                  </div>
                )}
              </>
            ))}
          </AnimatePresence>
        </SectionContent>
      </Section>

      <Section id="comprendre-le-chauffage-urbain">
        <SectionTitle>Comment fonctionne le chauffage urbain&nbsp;?</SectionTitle>
        <SectionContent>
          <SectionTwoColumns>
            <div>
              <SectionHeading as="h3">Un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français</SectionHeading>
              <Text size="lg">
                <Link href="/chauffage-urbain#contenu">Le chauffage urbain</Link> consiste à{' '}
                <strong>distribuer de la chaleur produite de façon centralisée à un ensemble de bâtiments</strong>, via des canalisations
                souterraines. On parle aussi de réseaux de chaleur.{' '}
                <strong>
                  Ces réseaux sont alimentés à plus de 66% par des{' '}
                  <Link href="/ressources/energies-vertes#contenu">énergies renouvelables et de récupération locales</Link>.
                </strong>
              </Text>
              <Text size="lg" mt="3w">
                La chaleur est transportée jusqu'à une sous-station installée dans votre copropriété, puis acheminée aux différents
                logements par des canalisations internes à l’immeuble.
              </Text>
              <Text size="lg" mt="3w">
                Dans la plupart des cas, le réseau de chaleur appartient à une collectivité territoriale et est{' '}
                <Link href="/ressources/acteurs#contenu">géré en concession</Link> par un exploitant, qui s’occupe notamment des
                raccordements.
              </Text>
            </div>
            <div>
              <Image
                src="/img/copro_comprendre.webp"
                alt="Schéma du chauffage urbain"
                width={944}
                height={890}
                priority
                className="fr-responsive-img"
                caption="Schéma de fonctionnement d’un réseau de chaleur urbain"
                altText={`Ce schéma illustre comment un réseau de chaleur urbain alimente une ville en énergie thermique de manière centralisée et efficace. Voici les éléments clés représentés :

- **Bâtiments résidentiels et tertiaires** : raccordés au réseau pour le chauffage et l’eau chaude.
- **Centrale de production de chaleur** : alimente le réseau à partir de diverses sources (biomasse, géothermie, incinération...).
- **Énergies renouvelables** : panneaux solaires thermiques visibles sur certains bâtiments.
- **Espaces publics apaisés** : infrastructures douces et durables (pistes cyclables, végétation...).
- **Usagers** : habitants qui profitent du confort thermique fourni par le réseau.
- **Réseau souterrain** : tuyaux rouges et bleus indiquent le circuit aller (chaud) et retour (refroidi).
- **Boucle de retour** : l’eau refroidie repart vers la centrale pour être réchauffée à nouveau.

Ce système contribue à la transition énergétique des villes en mutualisant la production et en réduisant les émissions de CO₂.`}
              />

              <Link variant="primary" href="reseaux-chaleur#contenu">
                En savoir plus
              </Link>
            </div>
          </SectionTwoColumns>
        </SectionContent>
      </Section>

      <Section id="obligation-raccordement" variant="light">
        <SectionTitle>Les obligations de raccordement</SectionTitle>
        <SectionTwoColumns>
          <div>
            <SectionHeading as="h3" size="h4">
              Les réseaux classés
            </SectionHeading>
            <Text size="lg">
              Plus de 500 réseaux de chaleur sont désormais <Link href="/ressources/reseau-classe#contenu">“classés”</Link>, ce qui signifie
              que certains bâtiments ont l'obligation de se raccorder.
            </Text>
            <Text size="lg" mt="3w">
              Cette obligation s’applique dans une certaine zone autour du réseau, définie par la collectivité, qualifiée de périmètre de
              développement prioritaire.
            </Text>
            <Box backgroundColor={colors.warning} borderRadius="12px" p="3w" pt="4w" mt="3w" textColor="#fff" fontWeight="bold">
              <Text>
                <Text as="span" fontSize="32px">
                  300 000€
                </Text>{' '}
                d’amende
              </Text>
              <Text>en cas de non-raccordement sans dérogation</Text>
            </Box>
          </div>

          <div>
            <Text size="lg" mt="8w">
              Sont concernés :
            </Text>
            <Text size="lg" mt="2w">
              Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à 30kW*
            </Text>
            <Text size="lg" mt="2w">
              Tout bâtiment renouvelant son installation de chauffage au-dessus de 30kW*
            </Text>
            <Text size="sm">* Ce seuil de puissance peut être relevé par la collectivité</Text>
            <div className="flex flex-col sm:flex-row items-center gap-2 lg:gap-5 mt-6w">
              <Link variant="primary" href="/carte">
                Voir les réseaux classés sur la carte
              </Link>
              <Link href="/ressources/obligations-raccordement">En savoir plus</Link>
            </div>
          </div>
        </SectionTwoColumns>
      </Section>

      <Section variant="bordered">
        <SectionTwoColumns>
          <div>
            <SectionHeading as="h3" size="h4" mt="0">
              Un exemple de cas concret
            </SectionHeading>

            <Text size="lg">Copropriété chauffée au gaz collectif de 126 logements répartis en 3 bâtiments.</Text>

            <Box display="flex" alignItems="center" mt="4w">
              <Image src="/img/copro_cout_1.webp" alt="" width={160} height={140} className="img-object-contain" />
              <Box ml="2w">
                <Text size="lg">Durée des travaux&nbsp;:</Text>
                <Text size="lg" color="success">
                  4 mois
                </Text>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" mt="1w">
              <Image src="/img/copro_cout_2.webp" alt="" width={160} height={140} className="img-object-contain" />
              <Box ml="2w">
                <Text size="lg">Coût du raccordement&nbsp;:</Text>
                <Text size="lg">105 000€ - 76 000€ d’aides</Text>
                <Text size="lg" color="success">
                  = 230€ par lot
                </Text>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" mt="1w">
              <Image src="/img/copro_cout_3.webp" alt="" width={160} height={140} className="img-object-contain" />
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
          </div>
          <div>
            <SectionHeading as="h3" size="h4">
              Les témoignages
            </SectionHeading>
            <Text size="lg" mb="2w">
              Le chauffage urbain, ce sont les copropriétaires et les syndics qui en parlent le mieux !
            </Text>

            <Highlight className="mt-1w italic">
              <Icon name="fr-icon-quote-line" color="#6A6AF4" className="mr-2w" />
              Je conseille vivement le raccordement à un réseau de chaleur pour des raisons économiques et écologiques.
              <span className="block text-right mt-2">— Henry Hostein Président du conseil syndical</span>
            </Highlight>
            <Text size="sm" mt="2w" />

            <Box mt="3w">
              <InterviewsVideos />
            </Box>
          </div>
        </SectionTwoColumns>
      </Section>

      <Section>
        <SectionTitle>Nos actualités</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row">
            <LastArticles />
          </div>
        </SectionContent>
      </Section>

      <Section variant="light">
        <SectionTitle>Nos articles sur le chauffage urbain</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row">
            <Understanding cards={coproprietaireCards} />
          </div>
        </SectionContent>
      </Section>

      <Partners />

      <Section id="obligation-raccordement" variant="accent">
        <SectionContent className="mt-0! flex flex-col gap-2">
          <SectionHeading as="h2" size="h5">
            Réduire l'impact écologique et économique de son chauffage
          </SectionHeading>
          <p>
            Les réseaux de chaleur urbains, une solution décarboner le chauffage des copropriétés, immeubles de logement social et bâtiments
            tertiaires.
          </p>
          <p>
            Le chauffage représente 67 % de la consommation d’énergie des foyers français et près de 20 % des émissions de gaz à effet de
            serre nationales. Près de 40 % des logements sont encore chauffés au gaz, dont les prix ont fortement fluctué ses dernières
            années.
          </p>
          <p>
            Pour réduire l’impact écologique du chauffage, la rénovation thermique est le premier réflexe à avoir. Le{' '}
            <Link href="/ressources/avantages#contenu">remplacement d’un chauffage collectif au gaz ou fioul</Link> par un raccordement à un
            réseau de chaleur permet également d’y contribuer. Alimentés majoritairement par des énergies renouvelables et de récupération
            locales, les réseaux de chaleur émettent deux fois moins de gaz à effet de serre qu’un chauffage au gaz et trois fois moins
            qu'un chauffage au fioul. Ils offrent généralement des prix compétitifs et plus stables que ceux des énergies fossiles.
          </p>
          <p>
            Des réseaux de chaleur existent dans la plupart des grandes villes, par exemple <Link href="/villes/paris">Paris</Link>,{' '}
            <Link href="/villes/rennes">Rennes</Link>, <Link href="/villes/nantes">Nantes</Link>,{' '}
            <Link href="/villes/bordeaux">Bordeaux</Link>, <Link href="/villes/strasbourg">Strasbourg</Link>,{' '}
            <Link href="/villes/metz">Metz</Link>, <Link href="/villes/grenoble">Grenoble</Link>, <Link href="/villes/lyon">Lyon</Link>,{' '}
            <Link href="/villes/aix-en-provence">Aix-en-Provence</Link>…
          </p>
          <p>
            Vous êtes professionnels (bureau d'étude, bailleur social, gestionnaire de bâtiments tertiaires…) ? Rendez-vous sur notre{' '}
            <Link href="/professionnels">page dédiée</Link>
          </p>
        </SectionContent>
      </Section>
    </SimplePage>
  );
}

export default Home;
