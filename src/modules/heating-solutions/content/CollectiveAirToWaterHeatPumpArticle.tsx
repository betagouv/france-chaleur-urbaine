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
 * Presents the validated pac-air-eau-collective article.
 */
export function CollectiveAirToWaterHeatPumpArticle() {
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
          <p>Bâtiments équipés d'un chauffage collectif.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>4 000 à 6 000 €/logement, pouvant être réduit grâce à des aides financières.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Sa mise en œuvre nécessite :</p>
          <ul>
            <SolutionListItem>un espace extérieur suffisant pour installer les unités de PAC</SolutionListItem>
            <SolutionListItem>un local technique</SolutionListItem>
            <SolutionListItem>un bâtiment dont les besoins en chauffage sont compatibles avec cette technologie</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer une chaudière collective gaz ou fioul par une solution renouvelable pour améliorer son DPE, réduire les émissions
            de CO₂ et diminuer les consommations d'énergie.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/air-water-photo.webp">
      <p>
        Une pompe à chaleur (PAC) air/eau collective est un{' '}
        <strong>système de chauffage qui capte la chaleur naturellement présente dans l'air extérieur pour chauffer un bâtiment</strong>.
      </p>
      <p>Elle peut également produire l'eau chaude sanitaire et, dans certains cas, assurer le rafraîchissement.</p>
      <p>
        Contrairement à une pompe à chaleur individuelle, <strong>elle alimente un réseau de chauffage commun.</strong>
      </p>
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
      <p>Une PAC air/eau collective est composée de deux principaux éléments :</p>
      <ul>
        <SolutionListItem>
          <strong>Une ou plusieurs unités extérieures</strong>, installées en toiture, dans les garages ou au sol, qui captent les calories
          naturellement présentes dans l'air extérieur.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Une unité intérieure</strong>, installée dans un local technique, qui récupère cette énergie, en élève la température
          grâce à un cycle thermodynamique, puis la transmet au réseau d'eau du bâtiment.
        </SolutionListItem>
      </ul>
      <p>
        La chaleur est ensuite distribuée vers les radiateurs, les planchers chauffants ou le système de production d'eau chaude sanitaire
        de l'immeuble.
      </p>
      <p>
        <strong>Selon les besoins, l'installation peut assurer :</strong>
      </p>
      <ul>
        <SolutionListItem>
          <strong>le chauffage du bâtiment</strong>
        </SolutionListItem>
        <SolutionListItem>
          <strong>la production d'eau chaude sanitaire</strong>
        </SolutionListItem>
        <SolutionListItem>
          <strong>le rafraîchissement</strong>, avec certains équipements compatibles.
        </SolutionListItem>
      </ul>
      <p>
        Pour les copropriétés importantes, plusieurs pompes à chaleur peuvent être installées afin de couvrir les besoins en chauffage et en
        eau chaude sanitaire.
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
            label: "Réseau d'eau du bâtiment",
          },
          {
            label: 'Radiateurs\nPlancher chauffant\nEau chaude sanitaire',
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
        Avant d'engager le projet, il est recommandé de vérifier que le bâtiment présente un niveau de performance énergétique satisfaisant
        (ou qu'une rénovation de son enveloppe est prévue) afin d'optimiser les performances de la pompe à chaleur.
      </p>
      <p>
        Une étude de faisabilité est indispensable pour confirmer que cette solution est adaptée aux caractéristiques du bâtiment, aux
        besoins de chauffage et aux équipements existants.
      </p>
      <p>
        <strong>La PAC air/eau collective est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>le bâtiment est équipé d'un chauffage collectif</SolutionListItem>
        <SolutionListItem>le bâtiment est correctement isolé</SolutionListItem>
        <SolutionListItem>la copropriété souhaite remplacer une chaudière collective gaz ou fioul</SolutionListItem>
        <SolutionListItem>les logements sont équipés de radiateurs à eau ou d'un plancher chauffant hydraulique</SolutionListItem>
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
        <SolutionListItem>Réduit les émissions de gaz à effet de serre liées au chauffage</SolutionListItem>
        <SolutionListItem>Peut assurer le chauffage et la production d'eau chaude sanitaire avec une seule installation</SolutionListItem>
        <SolutionListItem>
          Peut assurer le rafraîchissement du bâtiment lorsque les émetteurs sont adaptés (remplacement des radiateurs par des
          ventilo-convecteurs par exemple)
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
      <p>Comme toute solution de chauffage, une pompe à chaleur collective présente certaines contraintes.</p>
      <p>Avant d'engager un projet, il convient notamment de vérifier :</p>
      <ul>
        <SolutionListItem>la place disponible pour installer les unités extérieures</SolutionListItem>
        <SolutionListItem>les contraintes acoustiques liées au fonctionnement des équipements</SolutionListItem>
        <SolutionListItem>la compatibilité du réseau de chauffage existant</SolutionListItem>
        <SolutionListItem>le niveau d'isolation du bâtiment</SolutionListItem>
        <SolutionListItem>la capacité de l’installation électrique à alimenter les équipements</SolutionListItem>
        <SolutionListItem>les éventuelles contraintes architecturales ou patrimoniales</SolutionListItem>
      </ul>
      <p>
        Dans certains projets, une pompe à chaleur peut être associée à une chaudière d'appoint afin d'assurer les besoins lors des périodes
        les plus froides.
      </p>
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
      <SolutionSteps
        steps={[
          { title: 'Recherche d’un AMO (assistant à maitrise d’ouvrage), non obligatoire mais fortement conseillé' },
          { title: 'Étude de faisabilité du bâtiment' },
          { title: 'Choix et dimensionnement de la solution' },
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
      <SolutionFaqItem question={"Une pompe à chaleur air/eau collective fonctionne-t-elle lorsqu'il fait froid ?"}>
        <p>
          Oui. Elle continue de fonctionner en hiver, mais ses performances diminuent progressivement lorsque la température extérieure
          baisse. Son dimensionnement est donc une étape essentielle.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={"Peut-elle produire l'eau chaude sanitaire ?"}>
        <p>Oui. Selon la configuration retenue, elle peut assurer à la fois le chauffage et la production d'eau chaude sanitaire.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une pompe à chaleur peut-elle être associée à une chaudière existante ?'}>
        <p>Oui, dans certains projets, une solution hybride est retenue.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une pompe à chaleur est-elle bruyante ?'}>
        <p>
          Les unités extérieures produisent un niveau sonore qu'il convient de prendre en compte dès la conception du projet. Leur
          implantation est étudiée afin de limiter les nuisances.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Toutes les copropriétés peuvent-elles installer une pompe à chaleur collective ?'}>
        <p>
          Non. La faisabilité dépend notamment du bâtiment, des équipements existants, de l'espace disponible et des contraintes techniques
          ou réglementaires.
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
        Le coût dépend de la taille du bâtiment, des besoins en chauffage et en eau chaude sanitaire, des équipements existants et des
        éventuels travaux.
      </p>
      <p>
        À titre indicatif, il est généralement compris entre <strong>4 000 et 6 000 € par logement</strong>, avant déduction des aides
        financières.
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
      <SolutionFundingList>
        <SolutionFundingCard kind="cee">les Certificats d’économies d’énergie (CEE)</SolutionFundingCard>
        <SolutionFundingCard kind="renovation">
          <strong>MaPrimeRénov’</strong>, lorsque l’installation s’intègre dans un projet de rénovation de la copropriété répondant aux
          conditions du dispositif.
        </SolutionFundingCard>
        <SolutionFundingCard kind="local">dans certains cas des aides locales</SolutionFundingCard>
      </SolutionFundingList>
      <p>
        Pour en savoir plus sur les aides mobilisables, utilisez le simulateur <strong>France Chaleur Urbaine</strong>, qui vous oriente
        notamment vers France Rénov’.
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
          Le simulateur réalisé par <strong>France Chaleur Urbaine</strong> vous permet d'évaluer la pertinence d'une PAC air/eau collective
          pour votre bâtiment.
        </p>
        <p>Vous y trouverez :</p>
        <ul>
          <SolutionListItem>des ressources pour vous accompagner dans votre projet</SolutionListItem>
          <SolutionListItem>des ressources pour identifier les aides financières et les interlocuteurs adaptés</SolutionListItem>
        </ul>
      </SolutionResourceCard>
      <SolutionResourceCard
        title="Découvrir des retours d'expérience"
        icon="🏘️"
        actionHref="https://cepac-experts.org/carte-realisations-exemplaires/?type-doperation=renovation&amp;type-de-pac=pac-air-eau&amp;type-de-solution=collective"
        actionLabel="Découvrez les réalisations exemplaires du CEPAC"
      >
        <p>
          Consultez des exemples de copropriétés ayant installé une PAC air/eau collective pour découvrir les travaux réalisés, les coûts du
          projet et les bénéfices observés.
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
