import Infographies from '@components/Coproprietaire/Infographies';
import Simulators from '@components/Coproprietaire/Simulators';
import UseCase from '@components/Coproprietaire/UseCase';
import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { MarkdownWrapperStyled } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import { matomoEvent } from '@components/Markup';
import ClassedNetwork from '@components/Ressources/ClassedNetwork';
import { issues } from '@components/Ressources/config';
import Understanding from '@components/Ressources/Understanding';
import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import TextList from '@components/TextList';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { dataNumberRcu } from '@data';
import { comparatifRcu } from '@data/coproprietaire';
import { Button } from '@dataesr/react-dsfr';
import Head from 'next/head';

const coproprietaireCards = {
  reseau: issues.reseau,
  atouts: issues.atouts,
  'energies-verte': issues['energies-verte'],
};

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

      <MainContainer currentMenu={'/'}>
        <div>
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
          <Slice padding={8} theme="grey">
            <Infographies />
          </Slice>
          <Slice padding={8} direction="row" justifyContent="space-between">
            <div>
              <MarkdownWrapperStyled>
                <h2>
                  <em>Les avantages</em> du service public
                  <br />
                  <br />
                  et des énergies locales et renouvelables
                </h2>
              </MarkdownWrapperStyled>
              <MarkdownWrapper
                value={`
::check-item[Réduisez vos factures de chauffage jusqu’a 40%]
::check-item[Bénéficiez de subventions mises en place par l’Etat et d’une TVA à 5,5%]
::check-item[Supprimez votre chaudière fioul ou gaz]
::check-item[Faites un geste pour la planète en réduisant vos émissions de CO2 jusqu’à 50%]
              `}
              />
            </div>
            <div className="fcuCoproGuide">
              <img src="/img/copro_guide.jpg" alt="Guide de raccordement" />
              <div>
                <Button
                  onClick={() => {
                    matomoEvent([
                      'Téléchargement',
                      'Guide FCU',
                      'coproprietaire',
                    ]);
                    window.open(
                      '/documentation/guide-france-chaleur-urbaine.pdf',
                      '_blank'
                    );
                  }}
                >
                  Télécharger le guide de raccordement
                </Button>
              </div>
            </div>
          </Slice>
          <Slice padding={8} theme="grey">
            <UseCase />
          </Slice>

          <Slice
            padding={8}
            className="slice-comparatif-rcu"
            header={`### La solution de chauffage la plus compétitive`}
          >
            <WrappedBlock data={comparatifRcu} reverse />
          </Slice>
          <Slice
            theme="grey"
            padding={8}
            header={`### Faites des économies en luttant contre le changement climatique`}
          >
            <Simulators />
          </Slice>
          <Slice>
            <Understanding cards={coproprietaireCards} />
          </Slice>
          <Slice theme="color" padding={8} direction="row">
            <MarkdownWrapper
              withPadding
              value={`
:::puce-icon{icon="/icons/picto-warning.svg"}
**Certains bâtiments ont désormais l'obligation de se raccorder aux réseaux de chaleur “classés”, qui répondent aux trois critères suivants :** 
::thumb-item[Taux d’EnR&R de plus de 50%]
::thumb-item[Comptage de la chaleur livrée réalisé]
::thumb-item[Équilibre financier assuré]

:button-link[Voir les réseaux classés sur la carto]{href="/carte" className="fr-btn--sm fr-btn--secondary fr-mt-2w"}
`}
            />
            <MarkdownWrapper
              withPadding
              value={`
**Sont concernés, dans un certain périmètre autour de ces réseaux, appelé “périmètre de développement prioritaire” :**
::white-check-item[Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à 30kW*]
::white-check-item[Tout bâtiment renouvelant son installation de chauffage au-dessus de 30kW*]{className='fr-mb-2w'}

:small[* Ce seuil de puissance peut être relevé par la collectivité]
`}
            />
            <ClassedNetwork />
          </Slice>
          <Slice theme="grey" padding={4}>
            <SliceForm />
          </Slice>
          <Slice theme="color" padding={8}>
            <TextList data={dataNumberRcu} />
          </Slice>
          <Slice theme="color-light" padding={8}>
            <WrappedText
              center
              body={`#### Réduire l'impact écologique et économique de son chauffage

:small[Le chauffage urbain, une solution pour les copropriétés]

:small[Le chauffage représente 67 % de la consommation d’énergie des foyers français et près de 20 % des émissions de gaz à effet de serre nationales. L’augmentation des prix de l’énergie pèse sur le budget des ménages : 40 % des logements sont encore chauffés au gaz, dont les prix ont augmenté de 41 % en 10 ans.]

:small[Pour réduire l’impact écologique d’une copropriété et ses factures d’énergie, la rénovation thermique est le premier réflexe à avoir. Le [remplacement d’un chauffage collectif au gaz ou fioul](ressources/avantages) par un raccordement à un réseau de chaleur permet également d’y contribuer. Alimentés majoritairement par des [énergies renouvelables et de récupération](/ressources/energies-verte) locales, les réseaux de chaleur émettent deux fois moins de gaz à effet de serre qu’un chauffage gaz ou fioul et offrent des prix stables et compétitifs.]
`}
            />
          </Slice>
        </div>
      </MainContainer>
    </>
  );
}
