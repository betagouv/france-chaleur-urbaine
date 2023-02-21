import Infographies from '@components/Coproprietaire/Infographies';
import Simulators from '@components/Coproprietaire/Simulators';
import UseCase from '@components/Coproprietaire/UseCase';
import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { matomoEvent } from '@components/Markup';
import { issues } from '@components/Ressources/config';
import Understanding from '@components/Ressources/Understanding';
import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import TextList from '@components/TextList';
import WrappedBlock from '@components/WrappedBlock';
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
# Le chauffage urbain, une solution écologique et économique pour votre copropriété.`}
            formLabel="Testez votre adresse en 2 clics"
            checkEligibility
            needGradient
          />
          <Slice padding={8} theme="grey">
            <Infographies />
          </Slice>
          <Slice padding={8} direction="row">
            <MarkdownWrapper
              value={`## **Les avantages** du service public et des énergies locales et renouvelables
::check-item[Réduisez vos factures de chauffage jusqu’a 40%]
::check-item[Bénéficiez de subventions mises en place par l’Etat et d’une TVA à 5,5%]
::check-item[Supprimez votre chaudière fioul ou gaz]
::check-item[Faites un geste pour la planète en réduisant vos émissions de CO2 jusqu’à 50%]
              `}
            />
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
          <Slice theme="grey" padding={4}>
            <SliceForm />
          </Slice>
          <Slice theme="color" padding={8}>
            <TextList data={dataNumberRcu} />
          </Slice>
        </div>
      </MainContainer>
    </>
  );
}
