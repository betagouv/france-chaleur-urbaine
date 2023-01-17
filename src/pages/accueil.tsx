import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import TrackedVideo from '@components/TrackedVideo/TrackedVideo';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { Logo } from '@dataesr/react-dsfr';

const Accueil = () => {
  return (
    <MainContainer currentMenu={'/accueil'}>
      <GlobalStyle />
      <HeadSliceForm
        bg="/img/head-slice-bg-accueil.png"
        pageBody={`
Plus que jamais, faites un choix d’avenir !
# Le chauffage urbain allie écologie, confort et économie`}
        formLabel="Vérifiez immédiatement si votre immeuble pourrait être raccordé !"
        checkEligibility
      />
      <Slice padding={8} theme="grey">
        <WrappedBlock className="accueil-title">
          <Logo asLink={<div />} splitCharacter={10}>
            République Française
          </Logo>
          <MarkdownWrapper value="### France Chaleur Urbaine est un *service public gratuit* qui agit comme tiers de confiance *entre gestionnaires des réseaux de chaleur et copropriétés.*"></MarkdownWrapper>
        </WrappedBlock>
        <Slice padding={4}>
          <TrackedVideo
            className="small-video"
            width="100%"
            src="/videos/FCU-accueil.mp4"
            poster="/videos/FCU-accueil.jpg"
          />
        </Slice>
        <MarkdownWrapper
          className="accueil-list"
          value={`  
:::puce-icon{icon="./icons/picto-planet.svg"}
**Agissez pour la planète**, en réduisant vos émissions de gaz à effet de serre.
:::

:::puce-icon{icon="./icons/picto-invoice.svg"}
**Maîtrisez votre facture** de chauffage grâce à des tarifs compétitifs et stables. 
:::

:::puce-icon{icon="./icons/picto-serenity.svg"}
**Choisissez la sérénité** avec des énergies locales et bénéficiez de la garantie d’un service public. 
:::
`}
        ></MarkdownWrapper>
      </Slice>
      <Slice padding={8}>
        <WrappedText
          center
          body={`
Un réseau de chaleur est constitué d’un système de **canalisations** qui permettent d’acheminer vers un ensemble de **bâtiments** de la **chaleur** produite **localement**, avec des **sources d’énergies renouvelables ou de récupération**  (géothermie, biomasse, chaleur issue de l'incinération des déchets...). 

Une alternative écologique au fioul et au gaz !`}
          imgSrc="/img/rcu-illustation.svg"
        />
      </Slice>
      <Slice theme="blue-background" padding={5}>
        <SliceForm
          title="Votre bâtiment pourrait-il être raccordé à un réseau de chaleur ?"
          colored
        />
      </Slice>
    </MainContainer>
  );
};

export default Accueil;
