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
 * Presents the validated pac-geothermique-collective article.
 */
export function CollectiveGeothermalHeatPumpArticle() {
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
          <p>Bâtiments équipés d'un chauffage collectif à eau.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            <strong>8 000 à 11 000 €/logement</strong>, pour le captage géothermique et la pompe à chaleur, hors éventuelles adaptations du
            système de chauffage du bâtiment. Ce montant peut être réduit grâce aux aides financières.
          </p>
          <p>
            Malgré un investissement initial important, la géothermie peut être économiquement intéressante sur le long terme, grâce à ses
            coûts de fonctionnement.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Nécessite :</p>
          <ul>
            <SolutionListItem>
              un terrain ou une ressource en eau souterraine compatible avec le système de captage envisagé
            </SolutionListItem>
            <SolutionListItem>un espace suffisant pour réaliser les installations nécessaires</SolutionListItem>
            <SolutionListItem>un accès adapté pour la réalisation des travaux</SolutionListItem>
            <SolutionListItem>
              une étude préalable permettant de déterminer le système de captage le plus adapté au site et aux besoins du bâtiment
            </SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer une chaudière collective au gaz ou au fioul par une solution renouvelable, locale et disponible en continu,
            réduire fortement les émissions de CO₂, améliorer son DPE et bénéficier d'une source de chaleur stable et confortable tout au
            long de l'année.
          </p>
          <p>
            La géothermie permet également de réaliser des économies d'énergie importantes : une pompe à chaleur géothermique consomme 70 à
            80 % d'énergie en moins qu'un chauffage classique au gaz ou au fioul. L'énergie puisée dans le sol est gratuite et permet de
            limiter l'exposition aux fluctuations des prix des énergies fossiles.
          </p>
          <p>
            Elle peut aussi permettre de rafraîchir les bâtiments, à condition de disposer d'équipements adaptés (plancher rafraîchissant,
            ventilo-convecteurs…).
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/geothermal-collective.svg">
      <p>
        Une pompe à chaleur (PAC) géothermique est un système de chauffage qui capte la chaleur naturellement présente dans le sous-sol pour
        chauffer un bâtiment.
      </p>
      <p>
        Selon la configuration du site, cette chaleur peut être captée grâce à différents systèmes de captage : dans le sol à l’aide de
        sondes géothermiques verticales ou d’échangeurs compacts (corbeilles géothermiques), ou encore dans l’eau d’une nappe souterraine
        grâce à des forages.
      </p>
      <p>
        La chaleur récupérée est transmise à la pompe à chaleur, qui élève sa température avant de l’utiliser pour le chauffage du bâtiment.
      </p>
      <p>
        Le système peut également produire l’eau chaude sanitaire et, dans certains cas, assurer le rafraîchissement (via le géocooling)
        voire la climatisation.
      </p>
      <p>
        Grâce à la température relativement stable du sous-sol tout au long de l’année, la géothermie offre des performances très peu
        dépendantes des conditions extérieures.
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
      <p>Une PAC géothermique est composée de deux principaux éléments :</p>
      <ul>
        <SolutionListItem>
          <strong>Un système de captage géothermique</strong>, qui récupère la chaleur du sous-sol. Selon le projet, il peut s’agir de
          sondes géothermiques verticales installées dans le sol ou de forages permettant de prélever puis de réinjecter l’eau d’une nappe
          souterraine.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Une pompe à chaleur</strong>, installée dans un local technique, qui récupère cette énergie, en élève la température grâce
          à un cycle thermodynamique, puis la transmet au réseau d'eau du bâtiment
        </SolutionListItem>
      </ul>
      <p>
        La chaleur est ensuite distribuée vers les radiateurs, les planchers chauffants ou le système de production d'eau chaude sanitaire
        de l'immeuble.
      </p>
      <p>Selon les besoins, l'installation peut assurer :</p>
      <ul>
        <SolutionListItem>le chauffage du bâtiment</SolutionListItem>
        <SolutionListItem>la production d'eau chaude sanitaire</SolutionListItem>
        <SolutionListItem>le rafraîchissement, avec certains équipements compatibles.</SolutionListItem>
      </ul>
      <p>
        La température du sous-sol étant relativement stable au cours de l'année, les performances de la pompe à chaleur sont très peu
        dépendantes des variations de température extérieure.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Sous-sol / nappe souterraine',
          },
          {
            description: '(captent les calories)',
            label: 'Sondes géothermiques ou forage sur nappe',
          },
          {
            description: '(augmente la température ou permet de la diminuer pour le rafraîchir)',
            label: 'Pompe à chaleur',
          },
          {
            label: "Réseau d'eau du bâtiment",
          },
          {
            description: 'ou équipements adaptés au rafraîchissement (plancher rafraîchissant, ventilo-convecteurs)',
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
        besoins de chauffage et au potentiel géothermique de la parcelle.
      </p>
      <p>
        <strong>La PAC géothermique est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>le bâtiment est équipé d’un chauffage collectif à eau</SolutionListItem>
        <SolutionListItem>le site présente un potentiel géothermique compatible avec le projet</SolutionListItem>
        <SolutionListItem>les caractéristiques du terrain permettent la mise en œuvre d’un système de captage adapté</SolutionListItem>
        <SolutionListItem>l’espace et l’accessibilité nécessaires aux travaux sont disponibles</SolutionListItem>
        <SolutionListItem>le réseau de chauffage existant est compatible avec le fonctionnement d’une pompe à chaleur</SolutionListItem>
      </ul>
      <p>
        Une <strong>étude de faisabilité géothermique</strong> permet de déterminer le type de captage le plus adapté au site et de
        dimensionner l’installation.
      </p>
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
        <SolutionListItem>Ne nécessite pas d'unité extérieure générant des nuisances sonores</SolutionListItem>
        <SolutionListItem>Utilise une énergie renouvelable disponible localement : la chaleur du sous-sol</SolutionListItem>
        <SolutionListItem>Réduit fortement les émissions de gaz à effet de serre liées au chauffage</SolutionListItem>
        <SolutionListItem>Offre des performances stables, peu dépendantes de la température extérieure</SolutionListItem>
        <SolutionListItem>Peut assurer le chauffage et la production d'eau chaude sanitaire avec une seule installation</SolutionListItem>
        <SolutionListItem>
          Peut assurer le rafraîchissement du bâtiment avec certains équipements compatibles sans contribuer aux effets d’ilots de chaleur
          urbain
        </SolutionListItem>
        <SolutionListItem>Est discrète (pas de nuisances sonores ni visuelles)</SolutionListItem>
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
      <p>La PAC géothermique eau/eau collective est particulièrement adaptée lorsque :</p>
      <ul>
        <SolutionListItem>le bâtiment dispose d’un chauffage collectif à eau</SolutionListItem>
        <SolutionListItem>le site présente un potentiel géothermique compatible avec le projet</SolutionListItem>
        <SolutionListItem>les caractéristiques du terrain permettent la mise en œuvre d’un système de captage adapté</SolutionListItem>
        <SolutionListItem>l’espace et l’accessibilité nécessaires aux travaux sont disponibles</SolutionListItem>
        <SolutionListItem>
          le réseau de chauffage existant est compatible avec le fonctionnement optimal d’une pompe à chaleur
        </SolutionListItem>
        <SolutionListItem>
          les possibilités de faire également du froid avec l’installation géothermique et des équipements adaptés.
        </SolutionListItem>
      </ul>
      <p>
        Une <strong>étude de faisabilité géothermique</strong> permet de déterminer le type de captage le plus adapté au site et de
        dimensionner l’installation.
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
      <SolutionSteps
        steps={[
          { title: 'Recherche d’un AMO (non obligatoire mais fortement conseillée)' },
          { title: 'Étude du bâtiment et des besoins et puissances de chauffage (voire d’ECS et de froid)' },
          { title: 'Étude de faisabilité et du potentiel géothermique de la parcelle' },
          { title: 'Choix et dimensionnement de la solution' },
          { title: 'Recherche des financements mobilisables' },
          { title: 'Réalisation du système de captage et installation de la pompe à chaleur' },
          { title: 'Mise en service et réglages' },
          { title: 'Exploitation et maintenance' },
        ]}
      />
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
      <SolutionFaqItem question={"Une pompe à chaleur géothermique fonctionne-t-elle lorsqu'il fait froid ?"}>
        <p>
          Oui. Elle capte la chaleur du sous-sol, dont la température est relativement stable au cours de l'année. Ses performances sont
          donc très peu dépendantes de la température extérieure.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={"Une pompe à chaleur géothermique fonctionne-t-elle lorsqu'il fait très chaud ?"}>
        <p>
          Oui. La température du sous-sol reste relativement stable tout au long de l'année, même lorsqu'il fait très chaud. La pompe à
          chaleur géothermique peut donc continuer à fonctionner indépendamment des fortes chaleurs extérieures.
        </p>
        <p>Selon l'installation et les équipements du bâtiment, elle peut également permettre de le rafraîchir en été.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={"Peut-elle produire l'eau chaude sanitaire ?"}>
        <p>Oui. Selon la configuration retenue, elle peut assurer à la fois le chauffage et la production d'eau chaude sanitaire.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il obligatoirement réaliser des forages ?'}>
        <p>
          Pas nécessairement. Le système de captage dépend des caractéristiques du site. La chaleur peut notamment être récupérée à l’aide
          de <strong>sondes géothermiques</strong> ou par <strong>captage sur une nappe souterraine</strong>. Une étude préalable permet de
          déterminer la solution la plus adaptée au bâtiment et au potentiel géothermique du site.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une pompe à chaleur géothermique est-elle bruyante ?'}>
        <p>
          Elle ne nécessite pas d'unité extérieure comme une PAC air/eau, il n’y a donc aucune nuisance sonore à l'extérieur du bâtiment.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Toutes les copropriétés peuvent-elles installer une PAC géothermique ?'}>
        <p>
          Non. La faisabilité dépend du potentiel géothermique de la parcelle, de l'espace disponible, de son accessibilité et des
          contraintes techniques ou réglementaires.
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
        Le coût dépend notamment de la taille du bâtiment, de ses besoins en chauffage et en eau chaude sanitaire, de la puissance de la
        PAC, du <strong>système de captage retenu</strong>, des caractéristiques du sous-sol et des éventuels travaux nécessaires.
      </p>
      <p>
        À titre indicatif, le coût d’installation est généralement compris entre <strong>8 000 et 11 000 € par logement</strong>, avant
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
      <p>L'installation peut bénéficier de plusieurs dispositifs d'aide et de mobiliser des professionnels compétents et qualifiés.</p>
      <p>Selon les projets, il est notamment possible de mobiliser :</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="cee">les Certificats d'économies d'énergie (CEE)</SolutionFundingCard>
        <SolutionFundingCard kind="heatFund">le Fonds Chaleur de l'ADEME</SolutionFundingCard>
        <SolutionFundingCard kind="local">dans certains cas des aides locales</SolutionFundingCard>
      </SolutionFundingList>
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
          Le simulateur réalisé par <strong>France Chaleur</strong> <strong>Urbaine</strong> vous permet d'évaluer la pertinence d'une PAC
          géothermique pour votre bâtiment.
        </p>
        <p>Vous y trouverez :</p>
        <ul>
          <SolutionListItem>une estimation des coûts de consommation et du prix de l’installation</SolutionListItem>
          <SolutionListItem>
            une mise en lien avec un conseiller du service public capable de vous accompagner dans votre projet
          </SolutionListItem>
        </ul>
      </SolutionResourceCard>
      <SolutionResourceCard title="En savoir plus sur la géothermie" icon="📚">
        <p>
          Consultez les ressources de l'ADEME pour mieux comprendre le fonctionnement de la géothermie de surface, évaluer la faisabilité
          d'un projet et découvrir les différentes solutions possibles.
        </p>
        <p>
          <SolutionContentLink href="https://librairie.ademe.fr/energies/4919-geothermie-de-surface-une-energie-performante-et-durable-pour-les-territoires.html">
            https://librairie.ademe.fr/energies/4919-geothermie-de-surface-une-energie-performante-et-durable-pour-les-territoires.html
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://librairie.ademe.fr/energies/997-reussir-un-projet-de-qualite-en-geothermie-de-surface-9791029712807.html">
            https://librairie.ademe.fr/energies/997-reussir-un-projet-de-qualite-en-geothermie-de-surface-9791029712807.html
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://librairie.ademe.fr/batiment/7749-comment-choisir-sa-pompe-a-chaleur--9791029725517.html">
            https://librairie.ademe.fr/batiment/7749-comment-choisir-sa-pompe-a-chaleur--9791029725517.html
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://www.geothermies.fr/usages-production">
            https://www.geothermies.fr/usages-production
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
