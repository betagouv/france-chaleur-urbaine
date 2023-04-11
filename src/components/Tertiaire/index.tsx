import HeadSliceForm from '@components/HeadSliceForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
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
import { Link } from '@dataesr/react-dsfr';
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
      <WrappedBlock
        direction="column"
        className="presentation-rcu-tertiaire-cartridge"
      >
        <WrappedText
          body={`
Vos bâtiments présentent une surface d’activités tertiaires (ou un cumul de surfaces) égale ou supérieure à 1 000 m²&nbsp;?  

**-> vous êtes assujettis au dispositif éco-énergie tertiaire&nbsp;!**  

Pour atteindre les objectifs du dispositif, vous pouvez optimiser l'exploitation de vos bâtiments, moderniser vos équipements, ou encore engager des travaux de rénovation énergétique.  

**C’est aussi le moment de changer votre mode de chauffage pour [une solution moins émettrice de gaz à effet de serre](/ressources/role#contenu)&nbsp;!**
        `}
        >
          <Cartridge theme="grey">
            <h4>Obligation</h4>
            <p>
              <b>
                de réduction des consommations d’énergie finale de l’ensemble du
                parc tertaire d’au moins :
              </b>
            </p>
            <div className="presentation-rcu-tertiaire-cartridges">
              <Cartridge theme="yellow">
                <b>-40%</b> en 2030
              </Cartridge>
              <Cartridge theme="yellow">
                <b>-50%</b> en 2040
              </Cartridge>
              <Cartridge theme="yellow">
                <b>-60%</b> en 2050
              </Cartridge>
            </div>
            <Link
              href="https://www.ecologie.gouv.fr/sites/default/files/20064_EcoEnergieTertiaire-4pages-web.pdf"
              target="_blank"
            >
              En savoir plus
            </Link>
          </Cartridge>
        </WrappedText>
      </WrappedBlock>

      <WrappedBlock
        direction="column"
        className="presentation-rcu-tertiaire-body"
      >
        <WrappedText
          body={`
![Attention](./icons/picto-warning.svg)  
Le 13 avril 2022, un arrêté modifiant celui du 10 avril 2020 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire a été publié.  

Il spécifie qu’**un coefficient de 0,77 sera appliqué aux consommations d’énergie des bâtiments raccordés aux réseaux de chaleur.** 
`}
        >
          <Cartridge theme="color">
            <p>Se raccorder à un réseau de chaleur, c’est jusqu'à :</p>
            <div className="presentation-rcu-tertiaire-cartridge-conso fr-mb-3w">
              <strong>23%</strong>
              <span>
                de réduction de consommations d’énergie comptabilisée !
              </span>
            </div>
            (en fonction du mode de chauffage initial)
          </Cartridge>
        </WrappedText>
      </WrappedBlock>
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
