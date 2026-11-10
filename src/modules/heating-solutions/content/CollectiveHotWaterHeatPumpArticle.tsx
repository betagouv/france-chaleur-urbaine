import { SolutionContentLink } from '../client/SolutionContentLink';
import { SolutionFaqItem } from '../client/SolutionFaqItem';
import { SolutionFlow } from '../client/SolutionFlow';
import { SolutionListItem } from '../client/SolutionListItem';
import { SolutionResourceCard } from '../client/SolutionResourceCard';
import { SolutionSection } from '../client/SolutionSection';
import { SolutionSummaryCard } from '../client/SolutionSummaryCard';
import { SolutionTestCallout } from '../client/SolutionTestCallout';

/**
 * Presents the validated pac-air-eau-collective-eau-chaude-sanitaire article.
 */
export function CollectiveHotWaterHeatPumpArticle() {
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
          <p>Bâtiments équipés d'une production d’eau chaude collective.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>2000 à 3000 euros</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Sa mise en œuvre nécessite :</p>
          <ul>
            <SolutionListItem>un espace extérieur suffisant pour installer les unités de PAC</SolutionListItem>
            <SolutionListItem>un local technique pour les ballons de stockage</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer la production d'eau chaude sanitaire assurée par une chaudière gaz ou fioul par une solution renouvelable pour
            améliorer son DPE, réduire les émissions de CO₂ et diminuer les consommations d'énergie.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/air-water.svg">
      <p>
        Une pompe à chaleur (PAC) air/eau collective dédiée à la production d’eau chaude sanitaire est un système qui capte la chaleur
        naturellement présente dans l'air extérieur pour chauffer l’eau d’un bâtiment.
      </p>
      <p>Contrairement à une pompe à chaleur individuelle, elle alimente un réseau d’eau chaude sanitaire centralisé.</p>
      <p>
        C'est une solution qui permet de réduire le recours aux énergies fossiles en utilisant une énergie renouvelable disponible partout.
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
      <p>Une PAC air/eau collective est composée de trois principaux éléments :</p>
      <ul>
        <SolutionListItem>
          <strong>Une ou plusieurs unités extérieures</strong>, installées en toiture, dans les garages ou au sol, qui captent les calories
          naturellement présentes dans l'air extérieur.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Une unité intérieure</strong>, installée dans un local technique, qui récupère cette énergie, en élève la température
          grâce à un cycle thermodynamique, puis la transmet au réseau d'eau du bâtiment.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Des ballons de stockage</strong> de l’eau chaude produite.
        </SolutionListItem>
      </ul>
      <p>L’eau chaude est ensuite distribuée dans le circuit centralisé.</p>
      <p>
        Pour les copropriétés importantes, plusieurs pompes à chaleur peuvent être installées afin de couvrir les besoins en eau chaude
        sanitaire.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Air extérieur',
          },
          {
            description: '(captent les calories)',
            label: 'Unités extérieures',
          },
          {
            description: '(augmente la température)',
            label: 'Unité intérieure',
          },
          {
            label: "Réseau d'eau chaude du bâtiment",
          },
          {
            label: 'Eau chaude sanitaire',
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
      <p>
        Une étude de faisabilité est indispensable pour confirmer que cette solution est adaptée aux caractéristiques du bâtiment, aux
        besoins en eau chaude sanitaire et aux équipements existants.
      </p>
      <p>
        <strong>La PAC air/eau collective dédiée à l’ECS est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>le bâtiment est équipé d'un circuit d’ECS collectif</SolutionListItem>
        <SolutionListItem>la copropriété souhaite remplacer une chaudière collective gaz ou fioul</SolutionListItem>
        <SolutionListItem>un espace est disponible pour installer les unités extérieures</SolutionListItem>
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
        <SolutionListItem>Utilise une énergie renouvelable disponible partout (air exétieur)</SolutionListItem>
        <SolutionListItem>Réduit les émissions de gaz à effet de serre liées à la production d’ECS</SolutionListItem>
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
      <p>Comme toute solution de production d’ECS, une pompe à chaleur collective présente certaines contraintes.</p>
      <p>Avant d'engager un projet, il convient notamment de vérifier :</p>
      <ul>
        <SolutionListItem>la place disponible pour installer les unités extérieures</SolutionListItem>
        <SolutionListItem>les contraintes acoustiques liées au fonctionnement des équipements</SolutionListItem>
        <SolutionListItem>la compatibilité du réseau d’ECS existant</SolutionListItem>
        <SolutionListItem>la capacité de l’installation électrique à alimenter les équipements</SolutionListItem>
        <SolutionListItem>les éventuelles contraintes architecturales ou patrimoniales</SolutionListItem>
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
      <p>Un projet de pompe à chaleur collective comprend plusieurs étapes :</p>
      <ol>
        <SolutionListItem>Recherche d’un AMO (assistant à maitrise d’ouvrage), non obligatoire mais fortement conseillé</SolutionListItem>
        <SolutionListItem>Étude de faisabilité du bâtiment</SolutionListItem>
        <SolutionListItem>Choix et dimensionnement de la solution</SolutionListItem>
        <SolutionListItem>Recherche des financements mobilisables</SolutionListItem>
        <SolutionListItem>Installation et mise en service</SolutionListItem>
        <SolutionListItem>Exploitation et maintenance</SolutionListItem>
      </ol>
      <p>
        Il est fortement conseillé de mettre en place un suivi des consommations énergétiques afin de vérifier les performances de
        l’installation dans le temps.
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
      <SolutionFaqItem question={'Une PAC air/eau collective pour l’ECS fonctionne-t-elle lorsqu’il fait froid ?'}>
        <p>
          Oui. Elle peut produire de l’eau chaude sanitaire toute l’année, mais ses performances varient en fonction de la température
          extérieure. Son dimensionnement doit donc être adapté aux besoins en eau chaude sanitaire du bâtiment.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une pompe à chaleur est-elle bruyante ?'}>
        <p>
          Les unités extérieures produisent du bruit, qu’il convient de prendre en compte dès la conception du projet. Leur implantation
          doit être étudiée afin de limiter les nuisances.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Tous les bâtiments collectifs peuvent-ils installer une PAC pour l’eau chaude sanitaire ?'}>
        <p>
          Non. La faisabilité dépend notamment des besoins en eau chaude sanitaire, des équipements existants, de l’espace disponible pour
          installer la PAC et les ballons de stockage, ainsi que des contraintes techniques du bâtiment.
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
      <p>
        Le coût dépend de la taille du bâtiment, des besoins en eau chaude sanitaire, des équipements existants et des éventuels travaux.
      </p>
      <p>
        À titre indicatif, il est généralement compris entre <strong>2</strong> <strong>000 et 3 000 € par logement</strong>, avant
        déduction des aides financières.
      </p>
      <p>Une étude de faisabilité est indispensable pour obtenir un chiffrage précis et dimensionner correctement l’installation.</p>
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
      <p>L’installation peut bénéficier de plusieurs dispositifs d’aide, sous réserve de respecter les critères d’éligibilité.</p>
      <p>Selon les projets, il est notamment possible de mobiliser :</p>
      <ul>
        <SolutionListItem funding="renovation">
          MaPrimeRénov’ Copropriété : la PAC peut être financée lorsqu’elle s’intègre dans un projet de rénovation énergétique de la
          copropriété répondant aux conditions du dispositif
        </SolutionListItem>
        <SolutionListItem funding="local">dans certains cas des aides locales</SolutionListItem>
      </ul>
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
          Le simulateur réalisé par France Chaleur Urbaine vous permet d'évaluer la pertinence d'une PAC air/eau collective dédiée à la
          production d'eau chaude sanitaire pour votre bâtiment.
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
