import Image from 'next/image';

import LastArticles from '@/components/Articles/LastArticles';
import AvantagesChauffageUrbain from '@/components/GenericContent/AvantagesChauffageUrbain';
import HeadSliceForm from '@/components/HeadSliceForm';
import Partners from '@/components/Partners/Partners';
import { issues, understandings } from '@/components/Ressources/config';
import Understanding from '@/components/Ressources/Understanding';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroContent, HeroImage, HeroMeta, HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Section, { SectionContent, SectionHeading, SectionSubtitle, SectionTitle, SectionTwoColumns } from '@/components/ui/Section';
import Text from '@/components/ui/Text';

const coproprietaireCards = {
  reseau: issues.reseau,
  atouts: issues.atouts,
  'energies-vertes': issues['energies-vertes'],
  faisabilite: understandings.faisabilite,
};

export default function Home() {
  return (
    <SimplePage
      title="Développer le chauffage urbain"
      description="Vérifiez si votre bâtiment est raccordable à un réseau de chaleur, un mode de chauffage écologique à prix maîtrisés."
    >
      <Hero>
        <HeroMeta>Profitez du confort du chauffage urbain de votre ville !</HeroMeta>
        <HeroTitle>Le chauffage urbain&nbsp;: une solution écologique à prix maîtrisé&nbsp;!</HeroTitle>
        <HeroSubtitle>
          Testez votre éligibilité et comparez les coûts <strong>en 2 clics</strong>
        </HeroSubtitle>
        <HeroContent>
          <HeadSliceForm checkEligibility withWrapper={(form) => <>{form}</>} withBulkEligibility />
        </HeroContent>
        <HeroImage src="/images/hero-image.jpg" alt="Femme avec un chat devant un radiateur" />
      </Hero>
      <Section>
        <SectionTitle>Des outils à votre service</SectionTitle>
        <SectionSubtitle>
          France Chaleur Urbaine a développé des outils pour vous aider à vous raccorder à un réseau de chaleur
        </SectionSubtitle>
        <SectionContent>TODO</SectionContent>
      </Section>
      <Section color="light" id="avantages-du-chauffage-urbain">
        <SectionTitle>Les avantages du chauffage urbain</SectionTitle>
        <SectionContent>
          <AvantagesChauffageUrbain />
        </SectionContent>
      </Section>
      <Section id="comprendre-le-chauffage-urbain">
        <SectionTitle>Comment fonctionne le chauffage urbain</SectionTitle>
        <SectionContent>
          <SectionTwoColumns>
            <div>
              <SectionHeading as="h3">Un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français</SectionHeading>
              <Text size="lg">
                Le chauffage urbain consiste à{' '}
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
              />

              <Link variant="primary" href="reseaux-chaleur#contenu">
                En savoir plus
              </Link>
            </div>
          </SectionTwoColumns>
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
      <Section>
        <SectionTitle>Nos actualités</SectionTitle>
        <SectionContent>
          <div className="fr-grid-row">
            <LastArticles />
          </div>
        </SectionContent>
      </Section>

      {/* <Box py="10w" id="couts-du-chauffage-urbain">
        <CoutsChauffageUrbain />
      </Box> */}

      {/* <Box py="10w" backgroundColor="blue-france-975-75">
        <Box className="fr-container">
          <ResponsiveRow>
            <Box flex>
              <Heading as="h3" size="h4" color="blue-france">
                Un exemple de cas concret
              </Heading>

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
            </Box>

            <Box flex>
              <Heading as="h3" size="h4" color="blue-france">
                Les témoignages
              </Heading>
              <Text size="lg" mb="2w">
                Le chauffage urbain, ce sont les copropriétaires et les syndics qui en parlent le mieux !
              </Text>

              <Icon name="fr-icon-quote-line" color="#6A6AF4" />

              <Text as="blockquote" ml="0" mt="1w" fontStyle="italic">
                Je conseille vivement le raccordement à un réseau de chaleur pour des raisons économiques et écologiques.
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
      </Box> */}

      {/* <Box py="10w" id="obligations-de-raccordement">
        <ObligationRaccordement />
      </Box> */}

      {/* <Box py="10w" backgroundColor="blue-france-main-525" id="comment-se-raccorder">
        <HowToRaccordement />
      </Box> */}

      <Partners />

      {/* <Box py="10w" backgroundColor="blue-france-main-525" textColor="#fff">
        <ReduireImpact />
      </Box> */}
    </SimplePage>
  );
}
