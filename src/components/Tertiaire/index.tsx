import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { growths, issues, understandings } from '@components/Ressources/config';
import Understanding from '@components/Ressources/Understanding';
import { GlobalStyle } from '@components/shared/layout/Global.style';
import Simulator from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import Slice from '@components/Slice';
import SliceForm from '@components/SliceForm';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { comparatifRcu, fcuSolutionForFutur } from '@data/tertiaire';
import { TertiaireStyle } from './index.styles';
import Owner from './Owner';

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
          <Owner />
          {futur}
        </>
      ) : (
        <>
          {futur}
          <Owner />
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
        <Simulator typeSurf={TypeSurf.tertiaire}>
          <MarkdownWrapper
            value={`
:::puce-icon{icon="./icons/picto-warning.svg"}
**À partir du 1er juillet 2022,** de nouvelles normes environnementales, qui visent à limiter les émissions de gaz à effet de serre, entreront en vigueur et **excluent l'installation de nouvelles chaudières au fioul.**  
**[Des aides](/ressources/aides#contenu) accompagnent cette transition.**
:::
              `}
          />
        </Simulator>
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
