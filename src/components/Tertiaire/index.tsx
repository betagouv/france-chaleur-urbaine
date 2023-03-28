import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { growths, issues, understandings } from '@components/Ressources/config';
import Understanding from '@components/Ressources/Understanding';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import SimulateurCO2 from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { comparatifRcu, fcuSolutionForFutur } from '@data/tertiaire';
import { TertiaireStyle } from './index.styles';

const tertiaireCards = {
  'energies-verte': issues['energies-verte'],
  aides: understandings.aides,
  avantages: understandings.avantages,
  acteurs: growths.acteurs,
};

export default function Tertiaire({ alt }: { alt?: boolean }) {
  const futur = (
    <Slice theme="color" padding={4}>
      <MarkdownWrapper
        value={fcuSolutionForFutur.body}
        className="fcuSolutionForFuturBody"
      />
      <MarkdownWrapper
        value={fcuSolutionForFutur.listing}
        className="fcuSolutionForFuturListing"
      />
    </Slice>
  );

  const owner = (
    <Slice
      padding={7}
      id="decrettertiaire"
      header={`##### VOUS ÊTES PROPRIÉTAIRE OU EXPLOITANT  
##### D'UN ÉTABLISSEMENT TERTIAIRE`}
      direction="row"
      className="presentation-rcu-tertiaire"
    >
      <MarkdownWrapper
        value={`
Vos bâtiments présentent une surface d’activités tertiaires (ou un cumul de surfaces) égale ou supérieure à 1 000 m²&nbsp;?  

**-> vous êtes assujettis au dispositif éco-énergie tertiaire&nbsp;!**  

Pour atteindre les objectifs du dispositif, vous pouvez optimiser l'exploitation de vos bâtiments, moderniser vos équipements, ou encore engager des travaux de rénovation énergétique.  

**C’est aussi le moment de changer votre mode de chauffage pour [une solution moins émettrice de gaz à effet de serre](/ressources/role#contenu)&nbsp;!**

:::cartridge{theme="grey" className="presentation-rcu-tertiaire-cartridge"}
#### Obligation  

**de réduction des consommations d’énergie finale de l’ensemble du parc tertaire d’au moins :**  
:know-more-link{href="https://www.ecologie.gouv.fr/sites/default/files/20064_EcoEnergieTertiaire-4pages-web.pdf"}

::cartridge[**-40%** en 2030]{theme="yellow" className="presentation-rcu-tertiaire-percent"}  
::cartridge[**-50%** en 2040]{theme="yellow" className="presentation-rcu-tertiaire-percent"}  
::cartridge[**-60%** en 2050]{theme="yellow" className="presentation-rcu-tertiaire-percent"}  
:::
`}
        className="presentation-rcu-tertiaire-body"
      />

      <MarkdownWrapper
        value={`
![Attention](./icons/picto-warning.svg)  
Le 13 avril 2022, un arrêté modifiant celui du 10 avril 2020 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire a été publié.  

Il spécifie qu’**un coefficient de 0,77 sera appliqué aux consommations d’énergie des bâtiments raccordés aux réseaux de chaleur.** 

:::cartridge{theme="color" className="presentation-rcu-tertiaire-cartridge-conso"}
Se raccorder à un réseau de chaleur, 
c’est jusqu'à :  

**23%** de réduction de consommations d’énergie comptabilisée&nbsp;!  

(en fonction du mode de chauffage initial)
:::
`}
        className="presentation-rcu-tertiaire-body"
      />
    </Slice>
  );
  return (
    <div>
      <GlobalStyle />
      <TertiaireStyle />

      <HeadSliceForm
        bg="/img/head-slice-bg-tertiaire.png"
        pageBody={`
Vos locaux sont chauffés au fioul ou au gaz&nbsp;?
# ${
          alt
            ? 'Décret tertiaire : optez pour le chauffage urbain'
            : 'Optez pour le chauffage urbain, écologique et économique'
        }`}
        formLabel="Votre bâtiment pourrait-il être raccordé&nbsp;?"
        energyInputsLabels={{
          collectif: 'Central',
          individuel: 'Individuel',
        }}
        checkEligibility
        needGradient
        withBulkEligibility
      />

      {alt ? (
        <>
          {owner}
          {futur}
        </>
      ) : (
        <>
          {futur}
          {owner}
        </>
      )}

      <Slice theme="grey" padding={2}>
        <SliceForm />
      </Slice>

      <Slice
        theme="color"
        padding={8}
        header={`## Un moyen efficace de lutter contre le changement climatique`}
      >
        <SimulateurCO2 typeSurf={TypeSurf.tertiaire}>
          <MarkdownWrapper
            value={`
:::puce-icon{icon="./icons/picto-warning.svg"}
**À partir du 1er juillet 2022,** de nouvelles normes environnementales, qui visent à limiter les émissions de gaz à effet de serre, entreront en vigueur et **excluent l'installation de nouvelles chaudières au fioul.**  
**[Des aides](/ressources/aides#contenu) accompagnent cette transition.**
:::
              `}
          />
        </SimulateurCO2>
      </Slice>

      <Slice
        padding={4}
        className="slice-comparatif-rcu"
        header={`## Les réseaux de chaleur constituent en moyenne la solution de chauffage la plus compétitive pour les bâtiments tertiaires&nbsp;!`}
      >
        <WrappedBlock data={comparatifRcu} />
      </Slice>

      <Slice
        theme="grey"
        padding={7}
        header={`## Découvrez les dispositifs d’aides`}
        direction="row"
        className="aides-rcu"
      >
        <MarkdownWrapper
          value={`##### Vous souhaitez raccorder vos locaux au chauffage urbain&nbsp;?  

Le dispositif **[«&nbsp;Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires&nbsp;»](/ressources/aides#contenu)** a pour objectif d’inciter financièrement les propriétaires ou gestionnaires de bâtiments tertiaires à remplacer leurs équipements de chauffage au charbon, au fioul ou au gaz au profit d’un raccordement à un réseau de chaleur.  
              `}
          className="aides-rcu-body"
        />
        <MarkdownWrapper
          value={`##### Un accompagnement technique et financier peut aussi être sollicité&nbsp;:  

- Auprès de **[France Renov](https://france-renov.gouv.fr/fr/pro/quel-accompagnement-pour-mes-travaux)** pour le petit tertiaire privé (<1000 m²)  

- Dans le cadre du **[programme ACTEE](https://www.programme-cee-actee.fr/)** pour les bâtiments publics des collectivités  
              `}
          className="aides-rcu-body"
        />
      </Slice>
      <Slice theme="color">
        <Understanding cards={tertiaireCards} />
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
    </div>
  );
}
