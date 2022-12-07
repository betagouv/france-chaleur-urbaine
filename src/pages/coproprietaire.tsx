import Accordions from '@components/accordions';
import Carrousel from '@components/Carrousel';
import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import SimulateurCO2 from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import {
  comparatifRcu,
  faqRcuCoproprietaire,
  fcuSolutionForFutur,
  testimonies,
  userExperience,
} from '@data/coproprietaire';
import { MediaVideo } from '@dataesr/react-dsfr';
import Head from 'next/head';

const currentPage = 'coproprietaire';

export default function Home() {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
        />
        <title>
          France Chaleur Urbaine : Une solution numérique qui facilite le
          raccordement à un chauffage économique et écologique
        </title>
      </Head>

      <MainContainer currentMenu={`/${currentPage}`}>
        <div>
          <GlobalStyle />

          <HeadSliceForm
            bg="/img/head-slice-bg-coproprietaire.png"
            pageBody={`
Vous êtes chauffé au fioul ou au gaz&nbsp;?
# Changez pour un chauffage écologique à prix compétitif&nbsp;!`}
            formLabel="Votre immeuble pourrait-il être raccordé&nbsp;?"
            checkEligibility
            needGradient
          />

          <Slice padding={10}>
            <MarkdownWrapper
              className="fcuSolutionForFuturBody"
              value="## France Chaleur Urbaine est **un service public gratuit** qui agit comme tiers de confiance en **facilitant la mise en contact entre gestionnaires des réseaux de chaleur et copropriétés :**"
            />
            <MarkdownWrapper
              className="fcuSolutionForFuturListing"
              value={`:::highlight
**>Découvrez si votre batiment est potentiellement raccordable**
:::
:::highlight
**>Soyez mis en contact avec le gestionnaire du réseau le plus proche.**
:::
:::highlight
**>Téléchargez notre guide et accédez à notre espace documentation**
:::`}
            />
          </Slice>

          <Slice padding={10} theme="grey">
            <MarkdownWrapper
              value={fcuSolutionForFutur.body}
              className="fcuSolutionForFuturBody"
            />
            <MarkdownWrapper
              value={fcuSolutionForFutur.listing}
              className="fcuSolutionForFuturListing"
            />
            <MarkdownWrapper
              value=':button-link[Télécharger notre guide]{href="./guide-france-chaleur-urbaine" tagName="downloadLink" trackEvent="Guide FCU, coproprietaire" target="_blank"}'
              className="fcuSolutionForFuturFooter"
            />
            <Slice padding={4}>
              <MediaVideo>
                <video
                  width="100%"
                  controls
                  src="/videos/FCU-accueil.mp4"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore: needed by DSFR
                  href="/videos/FCU-accueil.mp4"
                />
              </MediaVideo>
            </Slice>
          </Slice>

          <Slice
            theme="color"
            padding={8}
            header={`## Un moyen efficace de lutter contre le changement climatique`}
          >
            <SimulateurCO2 typeSurf={TypeSurf.copropriete}>
              <MarkdownWrapper
                value={`
:::puce-icon{icon="./icons/picto-warning.svg"}
**À partir du 1er juillet 2022,** de nouvelles normes environnementales, 
qui visent à limiter les émissions de gaz à effet de serre, entreront en 
vigueur et **excluent l'installation de nouvelles chaudières au fioul.**  
**Des aides accompagnent cette transition.**
:::
              `}
              />
            </SimulateurCO2>
          </Slice>

          <Slice
            padding={10}
            className="slice-comparatif-rcu"
            header={`## Les réseaux de chaleur constituent en moyenne la solution de chauffage la plus compétitive pour les logements collectifs !`}
          >
            <WrappedBlock data={comparatifRcu} />
          </Slice>

          <Slice theme="grey" padding={5}>
            <SliceForm />
          </Slice>

          <Slice padding={5}>
            <Carrousel
              title="Leur copropriété est raccordée - ils témoignent :"
              Testimonies={testimonies}
              imgSrc="/img/home-testimony.jpg"
              imgAlt="Portrait d’Isham et Sophie."
            />
          </Slice>

          <Slice theme="grey" padding={5}>
            <Slice
              header={`## Comment se passe un raccordement&nbsp;?  

_Les tarifs sont donnés à titre d’exemple en s’inspirant d’un cas réel en Île-de -France_`}
            ></Slice>
            {userExperience.map((props, i) => (
              <WrappedText
                key={`user-experience-${i}`}
                textClassName="user-experience-description"
                center
                {...props}
              />
            ))}
            <Slice>
              <MarkdownWrapper
                value={`:button-link[Plus de précisions sur notre guide]{href="./guide-france-chaleur-urbaine" tagName="downloadLink" trackEvent="Guide FCU, ${currentPage}" target="_blank"}`}
                className="fcuSolutionForFuturFooter"
              />
            </Slice>
          </Slice>

          <Slice padding={10}>
            <Accordions data={faqRcuCoproprietaire} />
          </Slice>
        </div>
      </MainContainer>
    </>
  );
}
