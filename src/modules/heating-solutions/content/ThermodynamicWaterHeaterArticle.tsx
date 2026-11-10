import { SolutionContentLink } from '../client/SolutionContentLink';
import { SolutionFaqItem } from '../client/SolutionFaqItem';
import { SolutionFlow } from '../client/SolutionFlow';
import { SolutionFundingCard } from '../client/SolutionFundingCard';
import { SolutionFundingList } from '../client/SolutionFundingList';
import { SolutionListItem } from '../client/SolutionListItem';
import { SolutionResourceCard } from '../client/SolutionResourceCard';
import { SolutionSection } from '../client/SolutionSection';
import { SolutionSteps } from '../client/SolutionSteps';
import { SolutionSummaryCard } from '../client/SolutionSummaryCard';
import { SolutionTestCallout } from '../client/SolutionTestCallout';

/**
 * Presents the validated chauffe-eau-thermodynamique article.
 */
export function ThermodynamicWaterHeaterArticle() {
  return (
    <>
      <SolutionTestCallout />

      <OverviewSection />

      <DefinitionSection />

      <OperationSection />

      <SuitabilitySection />

      <SolutionTestCallout />

      <BenefitsSection />

      <CautionsSection />

      <ProjectStepsSection />

      <FaqSection />

      <CostSection />

      <FundingSection />

      <SolutionTestCallout />

      <ResourcesSection />
    </>
  );
}

/**
 * Renders the article's en-quelques-mots section.
 */
function OverviewSection() {
  return (
    <SolutionSection id="en-quelques-mots">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SolutionSummaryCard tone="building">
          <p>Maisons individuelles et logements disposant d’une production d’eau chaude sanitaire indépendante.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            <strong>2 000 à 3 000 € par logement</strong>, avant déduction des aides financières.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Sa mise en œuvre nécessite :</p>
          <ul>
            <SolutionListItem>un emplacement adapté pour l’installation de l’équipement ;</SolutionListItem>
            <SolutionListItem>de prendre en compte les éventuelles contraintes acoustiques et architecturales.</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer un chauffe-eau électrique classique par une solution utilisant une énergie renouvelable et réduire les
            consommations liées à la production d’eau chaude sanitaire.
          </p>
        </SolutionSummaryCard>
      </div>
    </SolutionSection>
  );
}

/**
 * Renders the article's de-quoi-sagit-il section.
 */
function DefinitionSection() {
  return (
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/thermodynamic-water-heater.svg">
      <p>
        Un chauffe-eau thermodynamique (CET) est un équipement dédié à la <strong>production d’eau chaude sanitaire</strong>.
      </p>
      <p>
        Il fonctionne sur le principe d’une pompe à chaleur : il récupère les calories présentes dans l’air pour chauffer l’eau stockée dans
        un ballon.
      </p>
      <p>
        Il est destiné aux logements disposant d’une <strong>production d’eau chaude sanitaire indépendante</strong>.
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's fonctionnement section.
 */
function OperationSection() {
  return (
    <SolutionSection id="fonctionnement">
      <p>Le chauffe-eau thermodynamique associe principalement :</p>
      <ul>
        <SolutionListItem>une pompe à chaleur, qui récupère les calories présentes dans l’air</SolutionListItem>
        <SolutionListItem>un ballon de stockage, dans lequel l’eau chaude sanitaire est produite et conservée</SolutionListItem>
      </ul>
      <p>La chaleur captée dans l’air est transférée à l’eau du ballon grâce à un cycle thermodynamique.</p>
      <p>
        Selon les équipements et la configuration du logement, la prise d’air peut être réalisée à l’intérieur ou à l’extérieur du bâtiment.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Air extérieur',
          },
          {
            description: 'capte les calories présentes dans l’air',
            label: 'Pompe à chaleur',
          },
          {
            description: 'transfère la chaleur à l’eau et la stocke',
            label: 'Ballon d’eau chaude',
          },
          {
            label: 'Eau chaude sanitaire du logement',
          },
        ]}
      />
    </SolutionSection>
  );
}

/**
 * Renders the article's conditions section.
 */
function SuitabilitySection() {
  return (
    <SolutionSection id="conditions">
      <p>
        <strong>Pré-requis :</strong>
      </p>
      <p>Le chauffe-eau thermodynamique est particulièrement adapté lorsque :</p>
      <ul>
        <SolutionListItem>le logement dispose d’une production d’eau chaude sanitaire indépendante</SolutionListItem>
        <SolutionListItem>le remplacement d’un chauffe-eau électrique classique est envisagé</SolutionListItem>
        <SolutionListItem>un emplacement adapté est disponible pour installer l’équipement</SolutionListItem>
        <SolutionListItem>les contraintes acoustiques et d’évacuation de l’air peuvent être maîtrisées</SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's avantages section.
 */
function BenefitsSection() {
  return (
    <SolutionSection id="avantages">
      <ul>
        <SolutionListItem>Utilise une énergie renouvelable présente dans l’air.</SolutionListItem>
        <SolutionListItem>Consomme moins d’électricité qu’un chauffe-eau électrique classique.</SolutionListItem>
        <SolutionListItem>
          Permet de réduire les émissions de gaz à effet de serre liées à la production d’eau chaude sanitaire.
        </SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's vigilance section.
 */
function CautionsSection() {
  return (
    <SolutionSection id="vigilance">
      <p>Avant d’engager un projet, il convient notamment de vérifier :</p>
      <ul>
        <SolutionListItem>l’espace disponible pour installer l’équipement</SolutionListItem>
        <SolutionListItem>la configuration permettant la prise et le rejet d’air</SolutionListItem>
        <SolutionListItem>les contraintes acoustiques liées au fonctionnement de la pompe à chaleur</SolutionListItem>
        <SolutionListItem>
          les éventuelles contraintes architecturales en cas d’installation d’une unité ou de conduits donnant sur l’extérieur
        </SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's etapes section.
 */
function ProjectStepsSection() {
  return (
    <SolutionSection id="etapes">
      <p>Un projet de chauffe-eau thermodynamique comprend plusieurs étapes :</p>
      <SolutionSteps
        steps={[
          { title: 'Vérification de la faisabilité de l’installation' },
          { title: 'Choix et dimensionnement de l’équipement en fonction des besoins en eau chaude sanitaire' },
          { title: 'Recherche des financements mobilisables' },
          { title: 'Installation et mise en service' },
          { title: 'Exploitation et maintenance' },
        ]}
      />
      <p>
        <strong>
          Il est fortement conseillé de mettre en place un suivi des consommations énergétiques afin de vérifier les performances de
          l’installation dans le temps.
        </strong>
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's questions section.
 */
function FaqSection() {
  return (
    <SolutionSection id="questions">
      <SolutionFaqItem question={'Un chauffe-eau thermodynamique assure-t-il également le chauffage du logement ?'}>
        <p>Non. Le chauffe-eau thermodynamique présenté ici est dédié à la production d’eau chaude sanitaire.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Un chauffe-eau thermodynamique consomme-t-il de l’électricité ?'}>
        <p>
          Oui. Il utilise de l’électricité pour fonctionner, mais récupère également les calories présentes dans l’air pour chauffer l’eau,
          ce qui permet de réduire sa consommation par rapport à un chauffe-eau électrique classique.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Peut-on installer un chauffe-eau thermodynamique dans tous les logements ?'}>
        <p>
          Non. La faisabilité dépend notamment de l’espace disponible, de la configuration du logement et des possibilités de prise et de
          rejet d’air.
        </p>
      </SolutionFaqItem>
    </SolutionSection>
  );
}

/**
 * Renders the article's cout section.
 */
function CostSection() {
  return (
    <SolutionSection id="cout">
      <p>Le coût dépend notamment du type d’équipement, de sa capacité et de la configuration du logement.</p>
      <p>
        À titre indicatif, le coût d’installation est généralement compris entre <strong>2 000 et 3 000 € par logement</strong>, avant
        déduction des aides financières.
      </p>
      <p>
        Pour en savoir plus sur l’estimation budgétaire, utilisez le simulateur réalisé par <strong>France Chaleur Urbaine</strong>
      </p>
      <p>
        <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable">
          Tester le simulateur
        </SolutionContentLink>
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's aides section.
 */
function FundingSection() {
  return (
    <SolutionSection id="aides">
      <p>Plusieurs dispositifs peuvent contribuer au financement d’un chauffe-eau thermodynamique, sous conditions.</p>
      <p>Selon le projet, il est notamment possible de mobiliser :</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="renovation">
          MaPrimeRénov’ : depuis le 1er septembre 2026, le chauffe-eau thermodynamique n’est plus financé en tant que geste seul. Il peut
          être pris en compte lorsqu’il s’intègre dans un projet MaPrimeRénov’ Rénovation d’ampleur
        </SolutionFundingCard>
        <SolutionFundingCard kind="cee">les Certificats d’économies d’énergie (CEE), sous conditions</SolutionFundingCard>
        <SolutionFundingCard kind="local">des aides locales, selon le territoire.</SolutionFundingCard>
      </SolutionFundingList>
      <p>Pour connaître les aides mobilisables selon votre situation, utilisez le simulateur d’aides</p>
      <p>
        Pour en savoir plus sur les aides mobilisables, utilisez le simulateur <strong>France Chaleur Urbaine :</strong>
      </p>
      <p>
        <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable">
          Tester le simulateur
        </SolutionContentLink>
      </p>
    </SolutionSection>
  );
}

/**
 * Renders the article's aller-plus-loin section.
 */
function ResourcesSection() {
  return (
    <SolutionSection id="aller-plus-loin">
      <SolutionResourceCard
        title="Tester cette solution et préparer votre projet"
        icon="🧮"
        actionHref="/chaleur-renouvelable"
        actionLabel="Tester le simulateur"
        isPrimary
      >
        <p>
          Le simulateur réalisé par <strong>France Chaleur Urbaine</strong> vous permet d'évaluer la pertinence d'un chauffe-eau
          thermodynamique pour votre logement.
        </p>
        <p>Vous y trouverez :</p>
        <ul>
          <SolutionListItem>une estimation des coûts de consommation et du prix de l’installation</SolutionListItem>
          <SolutionListItem>
            une mise en lien avec un conseiller du service public capable de vous accompagner dans votre projet
          </SolutionListItem>
        </ul>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
