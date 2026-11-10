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
 * Presents the validated pac-geothermique-individuelle article.
 */
export function IndividualGeothermalHeatPumpArticle() {
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
          <p>
            Maisons équipées d'un chauffage à eau, ou pouvant être adaptées pour accueillir un système de chauffage compatible avec une
            pompe à chaleur géothermique (radiateurs, plancher chauffant, plafond rayonnant, etc.).
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            <strong>20 000 à 25 000 €</strong>, pour le système de captage et la pompe à chaleur, hors éventuels travaux sur les radiateurs
            ou le réseau de chauffage. Ce coût peut être réduit grâce à des aides financières.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p className="mb-0">Nécessite :</p>
          <ul>
            <SolutionListItem>un terrain adapté au système de captage envisagé</SolutionListItem>
            <SolutionListItem>un emplacement pour la pompe à chaleur</SolutionListItem>
            <SolutionListItem>
              une étude préalable pour déterminer la solution de captage adaptée au terrain et aux besoins de la maison.
            </SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer une chaudière gaz ou fioul par une solution renouvelable, locale et disponible en continu, réduire fortement les
            émissions de CO₂, améliorer son DPE et bénéficier d'une chaleur stable et confortable toute l'année. Elle permet également de
            réduire sa consommation d'énergie et de mieux maîtriser ses factures de chauffage, grâce à une chaleur puisée gratuitement dans
            le sol, moins exposée aux fluctuations des prix des énergies fossiles. Avec des équipements adaptés, comme un plancher
            rafraîchissant, elle peut aussi rafraîchir la maison en été.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/geothermal-house.svg">
      <p>
        Une pompe à chaleur (PAC) géothermique eau/eau ou eau glycolée/eau individuelle est un système de chauffage qui utilise la chaleur
        naturellement présente dans le sous-sol pour chauffer une maison.
      </p>
      <p>
        Selon la configuration du terrain, cette chaleur peut être récupérée grâce à différents systèmes de captage géothermique, notamment
        des sondes verticales, un captage horizontaldes échangeurs horizontaux ou des échangeurs dits « compacts » (corbeilles ou murs
        géothermiques).
      </p>
      <p>Lorsque les caractéristiques du site le permettent, la chaleur peut également être prélevée dans une nappe souterraine.</p>
      <p>
        La chaleur récupérée est transmise à la pompe à chaleur, qui élève sa température avant de l’utiliser pour chauffer le logement.
      </p>
      <p>
        Elle peut également produire l’eau chaude sanitaire et, dans certains cas, assurer le rafraîchissement (via le géocooling) voire la
        climatisation.
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
      <p>Une PAC géothermique individuelle est principalement composée :</p>
      <ul>
        <SolutionListItem>
          <strong>d’un système de captage</strong>, installé dans le sol ou utilisant une nappe souterraine, qui récupère la chaleur
          naturellement présente dans le sous-sol ;
        </SolutionListItem>
        <SolutionListItem>
          <strong>d’une pompe à chaleur</strong>, installée dans la maison ou dans un local adapté, qui élève la température de la chaleur
          récupérée grâce à un cycle thermodynamique ;
        </SolutionListItem>
        <SolutionListItem>
          <strong>d’un réseau de chauffage à eau</strong>, qui distribue ensuite la chaleur dans la maison grâce à des équipements adaptés,
          comme des radiateurs, un plancher chauffant ou un plafond rayonnant.
        </SolutionListItem>
      </ul>
      <p>
        Selon les besoins et l'installation, la PAC peut également produire de l'eau chaude sanitaire et rafraîchir la maison en été, de
        deux façons :
      </p>
      <ul>
        <SolutionListItem>
          <strong>Le rafraîchissement passif (géocooling)</strong> : la fraîcheur naturelle du sous-sol est utilisée sans faire fonctionner
          le compresseur de la pompe à chaleur.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Le refroidissement actif</strong> : la pompe à chaleur fonctionne pour produire du froid, comme une climatisation.
        </SolutionListItem>
      </ul>
      <p>Ces possibilités nécessitent des équipements adaptés.</p>
      <p>
        La température du sous-sol étant relativement stable au cours de l’année, les performances de la PAC sont peu dépendantes des
        variations de température extérieure.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Sous-sol / nappe souterraine',
          },
          {
            label: 'Système de captage géothermique (sondes verticales, échangeurs horizontaux, corbeilles ou captage sur nappe)',
          },
          {
            label: 'Pompe à chaleur (augmente la température)',
          },
          {
            label: 'Réseau de chauffage à eau',
          },
          {
            description: "La production d'eau chaude sanitaire peut également être assurée par la PAC, selon l'installation.",
            label: 'Radiateurs / Plancher chauffant / Plafond rayonnant',
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
        Avant d'engager le projet, il est recommandé de vérifier que la maison présente un niveau de performance énergétique satisfaisant
        (ou qu'une rénovation de son enveloppe est prévue) afin d'optimiser les performances de la pompe à chaleur.
      </p>
      <p>
        Une étude de faisabilité est indispensable pour confirmer que cette solution est adaptée aux caractéristiques de la maison, aux
        besoins de chauffage et au potentiel géothermique de la parcelle.
      </p>
      <p>
        <strong>La PAC géothermique est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>la maison est équipée de radiateurs à eau ou d'un plancher chauffant hydraulique</SolutionListItem>
        <SolutionListItem>la parcelle est située dans une zone favorable au forage</SolutionListItem>
        <SolutionListItem>la ressource géothermique disponible est suffisante pour couvrir les besoins</SolutionListItem>
        <SolutionListItem>
          un espace suffisant est disponible pour implanter les sondes géothermiques (ou les forages sur nappe le cas échéant)
        </SolutionListItem>
        <SolutionListItem>la parcelle est accessible aux machines nécessaires aux travaux de forage</SolutionListItem>
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
        <SolutionListItem>Utilise une énergie renouvelable disponible localement et H24</SolutionListItem>
        <SolutionListItem>Réduit fortement les émissions de gaz à effet de serre liées au chauffage</SolutionListItem>
        <SolutionListItem>Offre des performances stables tout au long de l’année</SolutionListItem>
        <SolutionListItem>
          Peut assurer le chauffage et la production d’eau chaude sanitaire et, selon l’installation, le rafraîchissement sans contribuer
          aux effets d’ilots de chaleur urbain
        </SolutionListItem>
        <SolutionListItem>Est discrète car ne nécessite pas d’unité extérieure de PAC en façade ou dans le jardin.</SolutionListItem>
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
        <SolutionListItem>les caractéristiques du terrain et du sous-sol</SolutionListItem>
        <SolutionListItem>le système de captage pouvant être mis en œuvre</SolutionListItem>
        <SolutionListItem>l’espace disponible, notamment pour un captage horizontal ou des corbeilles</SolutionListItem>
        <SolutionListItem>
          l’accessibilité du terrain aux équipements nécessaires aux travaux lorsque des forages sont nécessaires
        </SolutionListItem>
        <SolutionListItem>la compatibilité du réseau de chauffage existant avec la pompe à chaleur</SolutionListItem>
        <SolutionListItem>les éventuelles contraints réglementaires associées au captage envisagé</SolutionListItem>
        <SolutionListItem>
          les possibilités de faire également du froid avec l’installation géothermique et des équipements adaptés.
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
      <p>Un projet de PAC géothermique individuelle comprend plusieurs étapes :</p>
      <SolutionSteps
        steps={[
          { title: 'Étude de la maison, du terrain et des besoins de chauffage (voire d’ECS et de froid)' },
          { title: 'Étude de faisabilité et choix du système de captage' },
          { title: 'Dimensionnement de la pompe à chaleur et du système de captage' },
          { title: 'Recherche des financements mobilisables' },
          { title: 'Réalisation du captage et installation de la PAC' },
          { title: 'Mise en service' },
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
      <SolutionFaqItem question={'Faut-il obligatoirement réaliser un forage ?'}>
        <p>
          Non. Plusieurs systèmes de captage géothermique existent. Selon le terrain, il peut notamment s’agir de sondes verticales, d’un
          captage horizontal, de corbeilles ou murs géothermiques ou de forages sur nappe.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={"Faut-il disposer d'un grand terrain ?"}>
        <p>
          Cela dépend du système de captage. Un captage horizontal nécessite davantage de surface, tandis que les solutions verticales ou
          les corbeilles ont une emprise au sol différente. Une étude permet de déterminer la solution adaptée à la parcelle.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'La géothermie fonctionne-t-elle lorsqu’il fait très froid  ?'}>
        <p>
          Oui. La température du sous-sol varie généralement moins que celle de l'air extérieur, ce qui permet à une pompe à chaleur
          géothermique de conserver de bonnes performances en hiver, même lorsqu'il fait très froid.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'La géothermie fonctionne-t-elle lorsqu’il fait très chaud ?'}>
        <p>
          Oui. La PAC géothermique est peu dépendante des températures extérieures. En été, elle peut également contribuer à rafraîchir la
          maison grâce au rafraîchissement passif (géocooling) ou au refroidissement actif, si l'installation est adaptée.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Peut-elle produire l’eau chaude sanitaire ?'}>
        <p>
          Oui. Une PAC géothermique peut également assurer la production d’eau chaude sanitaire lorsqu'elle est dimensionnée pour cet usage.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Peut-elle rafraîchir la maison ?'}>
        <p>Oui, certaines installations peuvent également assurer le rafraîchissement, sous réserve d'équipements compatibles.</p>
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
        Le coût dépend notamment de la puissance nécessaire, du <strong>type de captage retenu</strong>, des caractéristiques du terrain et
        des éventuels travaux d’adaptation du système de chauffage.
      </p>
      <p>
        À titre indicatif, le coût de l’installation est compris entre <strong>20 000 et 25 000 € par logement</strong>, avant déduction des
        aides financières.
      </p>
      <p>Une étude de faisabilité permet de déterminer la solution adaptée et d’obtenir un chiffrage précis.</p>
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
      <p>
        L’installation peut bénéficier de plusieurs dispositifs d’aide, sous réserve de respecter les critères d’éligibilité et de mobiliser
        des professionnels compétents et qualifiés.
      </p>
      <p>Selon le projet, il est notamment possible de mobiliser :</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="renovation">
          <strong>MaPrimeRénov’</strong> : la pompe à chaleur géothermique est éligible, sous conditions de ressources et de respect des
          critères techniques
        </SolutionFundingCard>
        <SolutionFundingCard kind="cee">
          <strong>les Certificats d’économies d’énergie (CEE)</strong>, sous conditions
        </SolutionFundingCard>
        <SolutionFundingCard kind="local">
          <strong>des aides locales</strong>, selon le territoire.
        </SolutionFundingCard>
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
        <p>Le simulateur France Chaleur Urbaine vous permet d'évaluer la pertinence d'une PAC géothermique pour votre maison.</p>
        <p className="mb-0">Vous y trouverez :</p>
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
          <SolutionContentLink href="https://librairie.ademe.fr/batiment/7749-comment-choisir-sa-pompe-a-chaleur--9791029725517.html">
            https://librairie.ademe.fr/batiment/7749-comment-choisir-sa-pompe-a-chaleur--9791029725517.html
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
