import LastArticles from '@components/Articles/LastArticles';
import Infographies from '@components/Coproprietaire/Infographies';
import HeadSliceForm from '@components/HeadSliceForm';
import BulkEligibilitySlice from '@components/HeadSliceForm/BulkEligibilitySlice';
import IFrame from '@components/IFrame/IFrame';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import { issues, understandings } from '@components/Ressources/config';
import Simulator from '@components/Ressources/Contents/Simulator';

import Understanding from '@components/Ressources/Understanding';
import MainContainer from '@components/shared/layout';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import SimulatorCO2 from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import Slice from '@components/Slice';
import Owner from '@components/Tertiaire/Owner';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { comparatifRcu } from '@data/tertiaire';
import Head from 'next/head';

const currentPage = 'professionnels';
const conseillerCards = {
  'energies-verte': issues['energies-verte'],
  avantages: understandings.avantages,
  aides: understandings.aides,
  prioritaire: understandings.prioritaire,
};

const Professionnels = () => {
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
        <GlobalStyle />

        <HeadSliceForm
          bg="/img/head-slice-bg-professionnels.png"
          pageBody={`
Gestionnaires de bâtiments tertiaires, bailleurs sociaux, bureaux d’étude, syndics, ...
# Faites un choix d’avenir, écologique et économique`}
          formLabel="Le bâtiment pourrait-il être raccordé à un réseau de chaleur&nbsp;?"
          checkEligibility
          needGradient
          externBulkForm
          withBulkEligibility
        />
        <Slice padding={8}>
          <WrappedBlock>
            <WrappedText
              body={`
### Le chauffage urbain, de nombreux avantages pour tous types de bâtiments de logements ou tertaires :
::arrow-item[Réduction des factures de chauffage jusqu’à 40%]
::arrow-item[Subventions mises en place par l’État et TVA à 5,5%]
::arrow-item[Garantie d’un service public]
::arrow-item[Diminution des émissions de CO2  jusqu’à 50%]
        `}
            />
            <Cartridge style={{ maxWidth: '500px' }} theme="blue">
              <WrappedText
                body={`
### France Chaleur Urbaine est un service gratuit du Ministère de la transition énergétique qui accompagne et outille les professionnels :
::white-arrow-item[**[Cartographie](/carte)**  (réseaux actuels et en construction, bâtiments et leur mode de chauffage, extraction de données,...)]
::white-arrow-item[**[Test](#test-liste)** de liste d’adresses]
::white-arrow-item[Simulateur **[d’aide](#simulateur-aide)** et **[d’émissions de C02](#simulateur-co2)**]
::white-arrow-item[Informations **légales**]
        `}
              />
            </Cartridge>
          </WrappedBlock>
        </Slice>
        <BulkEligibilitySlice displayBulkEligibility />
        <Slice padding={8}>
          <WrappedText
            textClassName="slice-carto-text"
            body={`
::arrow-item[Localisez les réseaux de chaleur et accéder à leurs caractéristiques principales (taux ENR et contenu CO2 réglementaires,...)]
::arrow-item[Identifiez les réseaux classés et découvrez leur périmètre de développement prioritaire (zone où s'applique une obligation de raccordement pour certains bâtiments)]
::arrow-item[Visualisez et exportez des données sur les bâtiments (consommation énergétique, mode de chauffage...)]
:button-link[Voir la cartographie]{href="./carte"}
`}
            imgSrc="/img/rcu-carto.jpg"
            reverse
          />
        </Slice>
        <Slice
          padding={8}
          theme="grey"
          className="slice-comparatif-rcu"
          header={`### La solution de chauffage la plus compétitive pour les bâtiments tertiaires !`}
          id="simulateur-aide"
        >
          <WrappedBlock data={comparatifRcu} reverse>
            <Simulator
              cartridge
              withRedirection
              defaultStructure="Tertiaire"
              withTitle
            />
          </WrappedBlock>
        </Slice>
        <Owner />
        <Slice padding={8} theme="grey">
          <Infographies />
        </Slice>

        <IFrame />

        <Slice
          theme="color"
          id="simulateur-co2"
          padding={8}
          header={'## Un moyen de lutter contre le changement climatique'}
        >
          <SimulatorCO2 typeSurf={TypeSurf.tertiaire}>
            <MarkdownWrapper
              value={`
:::puce-icon{icon="./icons/picto-warning.svg"}
**À partir du 1er juillet 2022,** de nouvelles normes environnementales, qui visent à limiter les émissions de gaz à effet de serre, entreront en vigueur et **excluent l'installation de nouvelles chaudières au fioul.**  
**[Des aides](/ressources/aides#contenu) accompagnent cette transition.**
:::
              `}
            />
          </SimulatorCO2>
        </Slice>

        <Slice theme="grey" padding={8}>
          <Slice header={`## Comment se passe un raccordement&nbsp;?`} />
          <WrappedText
            center
            body={`
::counter-item[01.] 
*Le 100 rue du Paradis est un immeuble chauffé par une chaudière collective au gaz ayant 20 ans.*

Un conseiller en rénovation ou le gestionnaire de l’immeuble cherche un chauffage *[plus performant et responsable](/ressources/avantages#contenu)* et vérifie sur *France Chaleur Urbaine* si le bâtiment est raccordable. 

*Un réseau de chaleur passe à 15 mètres !*

Le conseiller en rénovation ou le gestionnaire de l’immeuble demande via France Chaleur Urbaine à être *mis en relation avec le gestionnaire du réseau de chaleur*, qui le recontacte pour l’informer sur les conditions de raccordement.
`}
            imgSrc="/img/user-experience-simple-1.svg"
            reverse
            textClassName="user-experience-description"
          />
          <WrappedText
            center
            body={`
::counter-item[02.] 
*Les frais de raccordement s’élèvent à 105 000 €.*
*Le « [Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires](/ressources/aides#contenu) » permet de réduire ce coût à 50 000 €, soit 400 € par lot.*

Les travaux durent 2 mois en tout, sans nuisance !

Depuis, l’immeuble bénéficie d’une bonne température de chauffe, d’une distribution d'eau chaude sans aucune panne, avec un budget maîtrisé sans plus se soucier de l’entretien d’une chaudière.

*Une démarche écologique et économique.*
`}
            imgSrc="/img/user-experience-simple-2.png"
            textClassName="user-experience-description"
          />
          <Slice>
            <MarkdownWrapper
              value={`:button-link[Télécharger notre guide]{href="./guide-france-chaleur-urbaine" tagName="downloadLink" trackEvent="Guide FCU, ${currentPage}" target="_blank"}`}
              className="fcuSolutionForFuturFooter"
            />
          </Slice>
        </Slice>
        <Slice>
          <Understanding cards={conseillerCards} />
        </Slice>
        <Slice padding={8} theme="grey">
          <h2>Nos actus</h2>
          <LastArticles />
        </Slice>
        <Slice theme="color-light" padding={8}>
          <WrappedText
            center
            body={`#### Raccordement des bâtiments tertiaires au chauffage urbain

:small[Un contexte favorable]

:small[Au niveau européen, la France ne se place qu’en 20ème position en termes de recours aux réseaux de chaleur, avec environ 5 % des besoins en chaleur du pays couverts par le chauffage urbain. Le secteur tertiaire représente près de 36 % des livraisons annuelles de chaleur par les réseaux.]

:small[Aujourd’hui, de nombreux établissements tertiaires sont amenés à réaliser des travaux de rénovation thermique pour réduire leurs consommations d’énergie et satisfaire les obligations du dispositif éco-énergie tertiaire. C’est le moment opportun pour changer de mode de chauffage et opter pour un raccordement au réseau de chaleur dès lors que celui-ci est possible. Le [coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaire](/ressources/aides#contenu) permet de réduire significativement les frais de raccordement.]
`}
          />
        </Slice>
      </MainContainer>
    </>
  );
};

export default Professionnels;
