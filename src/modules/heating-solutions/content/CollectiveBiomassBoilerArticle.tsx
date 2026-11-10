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
 * Presents the validated chaudiere-biomasse-collective article.
 */
export function CollectiveBiomassBoilerArticle() {
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
            Environ <strong>6 000 à 8 000 €/logement</strong>, avant déduction des aides financières.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Nécessite :</p>
          <ul>
            <SolutionListItem>un local technique adapté</SolutionListItem>
            <SolutionListItem>un espace suffisant pour stocker le combustible</SolutionListItem>
            <SolutionListItem>un accès permettant les livraisons de bois</SolutionListItem>
            <SolutionListItem>un conduit d'évacuation des fumées adapté</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer une chaudière collective au gaz ou au fioul par une solution renouvelable, réduire fortement les émissions de CO₂
            liées au chauffage et conserver un système capable de produire de l'eau à température élevée.
          </p>
          <p>
            Elle est particulièrement adaptée aux copropriétés disposant déjà d'une chaufferie collective et de suffisamment d'espace pour
            stocker le combustible.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/biomass-boiler.svg">
      <p>
        Une chaudière à bois ou biomasse est un système de chauffage collectif qui utilise du bois comme combustible, principalement sous
        forme de granulés ou de plaquettes de bois.
      </p>
      <p>La combustion du bois produit de la chaleur, qui est transmise à l'eau du réseau de chauffage du bâtiment.</p>
      <p>Elle peut assurer le chauffage et la production d'eau chaude sanitaire de l'immeuble.</p>
      <p>
        Elle peut produire de l'eau à température élevée, ce qui facilite son intégration dans des bâtiments anciens équipés de radiateurs
        fonctionnant à haute température.
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
      <p>Une installation biomasse collective est principalement composée de :</p>
      <ul>
        <SolutionListItem>
          <strong>Une chaudière à bois ou biomasse</strong>, qui brûle le bois et transmet la chaleur produite à l'eau du circuit de
          chauffage.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Un silo de stockage</strong>, dans lequel sont stockés les granulés ou les plaquettes de bois.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Un système d'alimentation automatique</strong>, qui transporte le combustible du silo jusqu'à la chaudière.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Un conduit d'évacuation des fumées</strong>, nécessaire à l'évacuation des produits issus de la combustion.
        </SolutionListItem>
      </ul>
      <p>La chaleur produite est ensuite distribuée dans le bâtiment grâce au réseau de chauffage collectif existant.</p>
      <p>Selon les besoins, l'installation peut assurer :</p>
      <ul>
        <SolutionListItem>le chauffage du bâtiment</SolutionListItem>
        <SolutionListItem>la production d'eau chaude sanitaire.</SolutionListItem>
      </ul>
      <SolutionFlow
        steps={[
          {
            label: 'Livraison de la biomasse',
          },
          {
            description: '(granulés ou plaquettes)',
            label: 'Silo',
          },
          {
            description: '(combustion du bois)',
            label: 'Chaudière à bois ou biomasse',
          },
          {
            label: "Réseau d'eau du bâtiment",
          },
          {
            label: 'Radiateurs / plancher chauffant / eau chaude sanitaire',
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
        ou qu'une rénovation de son enveloppe est prévue. Réduire les besoins de chauffage permet de limiter la puissance de la chaudière et
        les besoins en combustible.
      </p>
      <p>
        Une étude de faisabilité permet de confirmer que la solution est adaptée aux caractéristiques du bâtiment et aux possibilités
        d'approvisionnement.
      </p>
      <p>
        <strong>La chaudière à bois ou biomasse est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>le bâtiment est équipé d'un chauffage collectif à eau</SolutionListItem>
        <SolutionListItem>une chaufferie suffisamment grande est disponible</SolutionListItem>
        <SolutionListItem>un espace peut être dédié au stockage du combustible</SolutionListItem>
        <SolutionListItem>la parcelle est accessible aux véhicules assurant les livraisons</SolutionListItem>
        <SolutionListItem>un conduit d'évacuation des fumées adapté existe ou peut être créé</SolutionListItem>
        <SolutionListItem>une filière d'approvisionnement en bois est disponible à proximité</SolutionListItem>
      </ul>
      <p>
        Les bâtiments actuellement chauffés au fioul peuvent présenter une configuration particulièrement favorable : ils disposent souvent
        déjà d'un espace de stockage et d'un accès prévu pour les livraisons.
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
        <SolutionListItem>Utilise une énergie renouvelable pouvant être produite localement</SolutionListItem>
        <SolutionListItem>
          Réduit fortement les émissions de gaz à effet de serre liées au chauffage par rapport à une chaudière fossile
        </SolutionListItem>
        <SolutionListItem>Permet de remplacer une chaudière collective au gaz ou au fioul</SolutionListItem>
        <SolutionListItem>Peut assurer à la fois le chauffage et la production d'eau chaude sanitaire.</SolutionListItem>
        <SolutionListItem>
          Peut produire de l'eau à température élevée, ce qui facilite son intégration dans des bâtiments anciens.
        </SolutionListItem>
        <SolutionListItem>Permet généralement de conserver le réseau de chauffage et les radiateurs existants</SolutionListItem>
        <SolutionListItem>Repose sur une technologie mature et éprouvée.</SolutionListItem>
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
      <p>Avant d'engager un projet, vérifier :</p>
      <ul>
        <SolutionListItem>la place disponible dans la chaufferie</SolutionListItem>
        <SolutionListItem>l'espace nécessaire au silo de stockage</SolutionListItem>
        <SolutionListItem>l'accessibilité du bâtiment aux véhicules de livraison</SolutionListItem>
        <SolutionListItem>les possibilités d'approvisionnement locales en granulés ou en plaquettes</SolutionListItem>
        <SolutionListItem>la possibilité d'installer ou d'adapter le conduit d'évacuation des fumées</SolutionListItem>
        <SolutionListItem>les contraintes locales éventuelles liées aux émissions atmosphériques</SolutionListItem>
        <SolutionListItem>les conditions d'exploitation et de maintenance de l'installation</SolutionListItem>
      </ul>
      <p>
        Le besoin de stockage constitue une contrainte importante : les plaquettes de bois nécessitent davantage de place que les granulés.
      </p>
      <p>
        La combustion du bois génère également des émissions de particules. La qualité du combustible, les performances de la chaudière et
        son entretien sont donc importants pour limiter ces émissions.
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
          { title: "Recherche d'un AMO (non obligatoire mais fortement conseillée)" },
          { title: 'Étude des besoins du bâtiment et de la faisabilité de la solution biomasse' },
          { title: 'Choix du combustible (granulés ou plaquettes) et dimensionnement de la chaudière et du stockage' },
          { title: 'Recherche des financements mobilisables' },
          { title: "Travaux d'aménagement de la chaufferie et du silo, puis installation de la chaudière" },
          { title: "Mise en service, organisation de l'approvisionnement, exploitation et maintenance" },
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
      <SolutionFaqItem question={'Quelle différence entre une chaudière à granulés et une chaudière à bois déchiqueté ?'}>
        <p>
          Les granulés sont standardisés, plus denses et plus faciles à transporter et à stocker. Le bois déchiqueté nécessite davantage
          d’espace de stockage et une logistique de livraison plus contraignante. Il est plutôt adapté aux projets de grande taille et aux
          bâtiments proches des zones de production.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il prévoir un espace de stockage pour le bois ?'}>
        <p>
          Oui. Le combustible doit être stocké dans un silo à proximité de la chaufferie. L’espace nécessaire dépend notamment du type de
          combustible : le bois déchiqueté nécessite un volume de stockage plus important que les granulés.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Comment le combustible est-il livré ?'}>
        <p>
          Pour les granulés, la livraison peut être réalisée par soufflage : le camion doit pouvoir s'approcher à environ 20 mètres maximum
          du silo. Pour le bois déchiqueté, le camion doit pouvoir accéder directement au silo pour décharger, ce qui nécessite une voirie
          adaptée.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une chaudière à bois ou biomasse est-elle adaptée à une copropriété actuellement chauffée au fioul ?'}>
        <p>
          C'est une configuration particulièrement favorable. Les bâtiments chauffées au fioul disposent souvent déjà d'un espace de
          stockage et d'un accès permettant les livraisons par camion, ce qui facilite l'installation d'une chaudière à granulés.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem
        question={'Une chaudière à bois ou biomasse peut-elle chauffer un bâtiment qui nécessite une eau à haute température ?'}
      >
        <p>
          Oui. Une chaudière biomasse peut répondre à des besoins de chauffage à haute température, y compris dans un bâtiment non isolé. En
          revanche, plus les besoins du bâtiment sont importants, plus la chaudière et le stockage du combustible doivent être dimensionnés
          en conséquence.
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
        Le coût dépend de la taille du bâtiment, des besoins en chauffage et en eau chaude sanitaire, de la puissance de la chaudière, du
        type de combustible, de la création ou de l'adaptation du silo et des éventuels travaux dans la chaufferie.
      </p>
      <p>
        À titre indicatif, il est généralement compris entre <strong>6 000 et 8 000 € par logement</strong>, avant déduction des aides
        financières.
      </p>
      <p>Une étude de faisabilité est indispensable pour obtenir un chiffrage précis et dimensionner correctement l'installation.</p>
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
      <p>L'installation peut bénéficier de plusieurs dispositifs d'aide, sous réserve de respecter les critères d'éligibilité.</p>
      <p>Selon les projets, il est notamment possible de mobiliser :</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="cee">
          les <strong>Certificats d'économies d'énergie (CEE)</strong>
        </SolutionFundingCard>
        <SolutionFundingCard kind="heatFund">
          le <strong>Fonds Chaleur de l'ADEME</strong>
        </SolutionFundingCard>
        <SolutionFundingCard kind="local">
          dans certains cas, des <strong>aides locales</strong>
        </SolutionFundingCard>
      </SolutionFundingList>
      <p>
        Pour en savoir plus sur les aides mobilisables, utilisez le simulateur <strong>France Chaleur Urbaine</strong>, qui vous oriente
        vers les dispositifs adaptés
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
          Le simulateur réalisé par France Chaleur Urbaine vous permet d'évaluer la pertinence d'une chaudière à bois ou biomasse pour votre
          bâtiment.
        </p>
        <p>Vous y trouverez :</p>
        <ul>
          <SolutionListItem>une estimation des coûts de consommation et du prix de l’installation</SolutionListItem>
          <SolutionListItem>
            une mise en lien avec un conseiller du service public capable de vous accompagner dans votre projet
          </SolutionListItem>
        </ul>
      </SolutionResourceCard>
      <SolutionResourceCard title="En savoir plus sur la biomasse" icon="📚">
        <p>
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/particuliers/amenager-maison/chauffer/chauffage-bois-moins-consommer-moins-polluer">
            Se chauffer au bois : les bons gestes pour moins consommer et moins polluer{' '}
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/entreprises/aides-financieres/catalogue/2026/etudes-des-projets-de-chaufferie-biomasse">
            Études des projets de chaufferie biomasse
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
