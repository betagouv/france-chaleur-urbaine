import LastArticles from '@components/Articles/LastArticles';
import Advantages from '@components/Coproprietaire/Advantages';
import Explanation from '@components/Coproprietaire/Explanation';
import Infographies from '@components/Coproprietaire/Infographies';
import Informations from '@components/Coproprietaire/Informations';
import Interviews from '@components/Coproprietaire/Interviews';
import Simulators from '@components/Coproprietaire/Simulators';
import UseCase from '@components/Coproprietaire/UseCase';
import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Partners from '@components/Partners/Partners';
import { issues, understandings } from '@components/Ressources/config';
import Understanding from '@components/Ressources/Understanding';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import SimplePage from '@components/shared/page/SimplePage';
import Slice from '@components/Slice';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { comparatifRcu, userExperience } from '@data/coproprietaire';
import Head from 'next/head';

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

      <GlobalStyle />

      <HeadSliceForm
        bg="/img/head-slice-bg-home.png"
        pageBody={`**Vous êtes copropriétaire en ville ?**
Améliorez votre confort et baissez vos factures !
# Le chauffage urbain, une solution écologique et économique pour votre copropriété`}
        formLabel="Testez votre adresse en 2 clics"
        checkEligibility
        needGradient
      />
      <Slice padding={4} theme="color">
        <Informations />
      </Slice>
      <Slice padding={8}>
        <Advantages />
      </Slice>
      <Slice padding={8} theme="grey">
        <Interviews from="henry" />
      </Slice>
      <Slice padding={8}>
        <Explanation />
      </Slice>
      <Slice
        padding={8}
        theme="grey"
        className="slice-comparatif-rcu"
        header={`### La solution de chauffage la plus compétitive`}
      >
        <WrappedBlock data={comparatifRcu} reverse />
      </Slice>
      <Slice
        theme="color"
        padding={8}
        header={`## Estimez le coup de pouce « Chauffage des bâtiments résidentiels collectifs et tertiaires » pour votre résidence.`}
      >
        <Simulators />
      </Slice>
      <Slice padding={8}>
        <UseCase />
      </Slice>
      <Slice theme="grey" padding={5}>
        <MarkdownWrapper value="## Les différentes étapes en copropriété :" />
        {userExperience.map((props, i) => (
          <WrappedText
            key={`user-experience-${i}`}
            textClassName="user-experience-description"
            center
            {...props}
          />
        ))}
      </Slice>
      <Slice theme="color" padding={8} direction="row">
        <MarkdownWrapper
          withPadding
          value={`
:::puce-icon{icon="/icons/picto-warning.svg"}
De nombreux réseaux de chaleur sont désormais « classés », ce qui signifie que **certains bâtiments ont l'obligation de se raccorder**

Cette [obligation](/ressources/prioritaire#contenu) s’applique dans une certaine zone autour du réseau, qualifiée de **périmètre de développement prioritaire.**

:button-link[Voir les réseaux classés sur la carte]{href="/carte" className="fr-btn--sm fr-mt-2w"}
`}
        />
        <MarkdownWrapper
          withPadding
          value={`
**Sont concernés, dans un certain périmètre autour de ces réseaux, appelé « périmètre de développement prioritaire » :**
::white-arrow-item[Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à 30kW*]
::white-arrow-item[Tout bâtiment renouvelant son installation de chauffage au-dessus de 30kW*]{className='fr-mb-2w'}

:small[* Ce seuil de puissance peut être relevé par la collectivité]
`}
        />
      </Slice>
      <Slice padding={8}>
        <Infographies />
      </Slice>
      <Slice theme="grey">
        <Understanding cards={coproprietaireCards} />
      </Slice>
      <Slice padding={8}>
        <h2>Nos actus</h2>
        <LastArticles />
      </Slice>
      <Slice>
        <Partners />
      </Slice>
      <Slice theme="color-light" padding={8}>
        <WrappedText
          center
          body={`#### Réduire l'impact écologique et économique de son chauffage

:small[Le chauffage urbain, une solution pour les copropriétés]

:small[Le chauffage représente 67 % de la consommation d’énergie des foyers français et près de 20 % des émissions de gaz à effet de serre nationales. L’augmentation des prix de l’énergie pèse sur le budget des ménages : 40 % des logements sont encore chauffés au gaz, dont les prix ont augmenté de 41 % en 10 ans.]

:small[Pour réduire l’impact écologique d’une copropriété et ses factures d’énergie, la rénovation thermique est le premier réflexe à avoir. Le [remplacement d’un chauffage collectif au gaz ou fioul](/ressources/avantages#contenu) par un raccordement à un réseau de chaleur permet également d’y contribuer. Alimentés majoritairement par des [énergies renouvelables et de récupération](/ressources/energies-vertes#contenu) locales, les réseaux de chaleur émettent deux fois moins de gaz à effet de serre qu’un chauffage gaz ou fioul et offrent des prix stables et compétitifs.]
`}
        />
      </Slice>
    </SimplePage>
  );
}
