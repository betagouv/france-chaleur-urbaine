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
 * Presents the validated chaudiere-biomasse-individuelle article.
 */
export function IndividualBiomassBoilerArticle() {
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
          <p>Maisons individuelles équipées d’un chauffage central à eau.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            Environ <strong>12 000 à 21 000 €</strong>, avant déduction des aides financières (D’après prix 2025 étude Observ’ER)
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Nécessite :</p>
          <ul>
            <SolutionListItem>un espace disponible pour installer la chaudière</SolutionListItem>
            <SolutionListItem>un espace suffisant pour stocker le combustible</SolutionListItem>
            <SolutionListItem>la possibilité d’installer ou d’adapter un conduit d’évacuation des fumées</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>Pour remplacer une chaudière individuelle utilisant une énergie fossile par un système de chauffage utilisant le bois</p>
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
        Une chaudière à bois ou biomasse individuelle est un système de chauffage qui utilise le bois comme combustible, sous forme de
        bûches ou de granulés.
      </p>
      <p>La combustion du bois produit de la chaleur, qui est transmise au circuit de chauffage central de la maison.</p>
      <p>La chaudière peut également assurer la production d’eau chaude sanitaire.</p>
    </SolutionSection>
  );
}

/**
 * Renders the article's fonctionnement section.
 */
function OperationSection() {
  return (
    <SolutionSection id="fonctionnement">
      <p>Une chaudière à bois ou biomasse individuelle est principalement composée :</p>
      <ul>
        <SolutionListItem>d’une chaudière, dans laquelle le bois est brûlé pour produire de la chaleur</SolutionListItem>
        <SolutionListItem>d’un système d’alimentation en combustible manuel ou automatisé selon le type de chaudière</SolutionListItem>
        <SolutionListItem>d’un espace de stockage du combustible</SolutionListItem>
        <SolutionListItem>d’un conduit permettant l’évacuation des fumées</SolutionListItem>
      </ul>
      <p>
        La chaleur produite est transmise au réseau d’eau de la maison, qui alimente ensuite les radiateurs ou le plancher chauffant. La
        chaudière peut également produire l’eau chaude sanitaire.
      </p>
      <p>
        Un ballon tampon, qui permet de stocker temporairement la chaleur produite, est souvent installé entre la chaudière et le réseau de
        chauffage. Il est systématiquement prévu pour les chaudières à bûches.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Bois (bûches ou granulés)',
          },
          {
            label: 'Chaudière biomasse',
          },
          {
            label: 'Ballon tampon (systématique pour les chaudières à bûches)',
          },
          {
            label: 'Réseau d’eau de la maison',
          },
          {
            label: 'Radiateurs / Plancher chauffant / Eau chaude sanitaire',
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
        Avant d'engager le projet, il est recommandé de vérifier que la maison présente un niveau de performance énergétique satisfaisant ou
        qu'une rénovation de son enveloppe est prévue. Réduire les besoins de chauffage permet de limiter la puissance de la chaudière et
        les besoins en combustible.
      </p>
      <p>
        Une étude de faisabilité permet de confirmer que la solution est adaptée aux caractéristiques de la maison et aux possibilités
        d'approvisionnement.
      </p>
      <p>
        <strong>La chaudière à bois ou biomasse est particulièrement adaptée lorsque :</strong>
      </p>
      <ul>
        <SolutionListItem>la maison est équipée d'un chauffage central à eau</SolutionListItem>
        <SolutionListItem>un espace suffisant pour installer la chaudière et, si nécessaire, un ballon tampon</SolutionListItem>
        <SolutionListItem>un espace peut être dédié au stockage du combustible</SolutionListItem>
        <SolutionListItem>l'approvisionnement en bois peut être organisé dans de bonnes conditions</SolutionListItem>
        <SolutionListItem>un conduit d'évacuation des fumées adapté existe ou peut être créé</SolutionListItem>
        <SolutionListItem>une filière d'approvisionnement en bois est disponible à proximité</SolutionListItem>
      </ul>
      <p>
        Les maisons actuellement chauffées au fioul peuvent présenter une configuration particulièrement favorable : elles disposent souvent
        déjà d'un espace de stockage et d'un accès prévu pour l'approvisionnement en combustible.
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
        <SolutionListItem>Permet de remplacer une chaudière individuelle au gaz ou au fioul</SolutionListItem>
        <SolutionListItem>Utilise une énergie renouvelable pouvant être produite localement : le bois</SolutionListItem>
        <SolutionListItem>Peut assurer le chauffage et la production d’eau chaude sanitaire</SolutionListItem>
        <SolutionListItem>
          Peut produire de l’eau à température élevée, ce qui facilite son intégration dans une maison équipée de radiateurs fonctionnant à
          haute température
        </SolutionListItem>
        <SolutionListItem>
          Solution particulièrement adaptée au remplacement d’une chaudière au fioul, notamment lorsque la maison dispose déjà d’un espace
          de stockage pour le combustible
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
      <p>
        <strong>Avant d'engager un projet, vérifier :</strong>
      </p>
      <ul>
        <SolutionListItem>la place disponible pour installer la chaudière</SolutionListItem>
        <SolutionListItem>l'espace nécessaire au stockage du combustible</SolutionListItem>
        <SolutionListItem>l'accessibilité pour l'approvisionnement en combustible</SolutionListItem>
        <SolutionListItem>les possibilités d'approvisionnement locales en bûches ou en granulés</SolutionListItem>
        <SolutionListItem>la possibilité d'installer ou d'adapter le conduit d'évacuation des fumées</SolutionListItem>
        <SolutionListItem>les contraintes locales éventuelles liées aux émissions atmosphériques</SolutionListItem>
        <SolutionListItem>les conditions d'entretien de l'installation</SolutionListItem>
      </ul>
      <p>Le besoin de stockage constitue une contrainte importante et doit être anticipé</p>
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
          { title: 'Étude des besoins de la maison et de la faisabilité de la solution biomasse' },
          { title: 'Choix du combustible et dimensionnement de la chaudière et du stockage' },
          { title: 'Recherche des financements mobilisables' },
          {
            title: 'Installation de la chaudière, du système de stockage et, si nécessaire, adaptation du conduit d’évacuation des fumées',
          },
          { title: 'Mise en service, organisation de l’approvisionnement et entretien de l’installation' },
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
      <SolutionFaqItem question={'Une chaudière biomasse peut-elle remplacer une chaudière au fioul ou au gaz ?'}>
        <p>
          Oui. Une chaudière biomasse peut remplacer une chaudière individuelle au fioul ou au gaz lorsque la maison dispose d’un réseau de
          chauffage à eau compatible et que les conditions d’installation sont réunies.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il prévoir un espace de stockage pour le bois ?'}>
        <p>
          Oui. L’espace nécessaire dépend du combustible utilisé. Une chaudière à granulés nécessitent un silo à proximité de la chaudière
          et accessible pour la livraison en granulés
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Une chaudière biomasse peut-elle produire l’eau chaude sanitaire ?'}>
        <p>Oui. Selon l’installation, elle peut assurer à la fois le chauffage de la maison et la production d’eau chaude sanitaire.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'L’alimentation de la chaudière est-elle automatique ?'}>
        <p>
          Cela dépend du type de chaudière. Les chaudières à granulés peuvent généralement être alimentées automatiquement depuis un espace
          de stockage, tandis que les chaudières à bûches nécessitent un chargement manuel.
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
        Le coût dépend du type de chaudière choisi, de sa puissance, du combustible utilisé, du système de stockage et des éventuels travaux
        nécessaires.
      </p>
      <p>
        À titre indicatif, il est généralement compris entre 12 000 et 21 000 € HT, pose comprise, avant déduction des aides financières.
      </p>
      <p>
        Un devis réalisé par un professionnel permet d’obtenir un chiffrage adapté à la configuration de la maison et à l’équipement choisi.
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
      <p>L'installation peut bénéficier de plusieurs dispositifs d'aide, sous réserve de respecter les critères d'éligibilité.</p>
      <p>Selon les projets, il est notamment possible de mobiliser :</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="cee">
          les <strong>Certificats d'économies d'énergie (CEE)</strong>
        </SolutionFundingCard>
        <SolutionFundingCard kind="local">
          dans certains cas, des <strong>aides locales,</strong> en particulier{' '}
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/particuliers/amenager-maison/renover/aide-fonds-air-bois">
            les Primes Air Bois
          </SolutionContentLink>
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
        <p>
          Le simulateur réalisé par France Chaleur Urbaine vous permet d’évaluer la pertinence d’une chaudière biomasse pour votre maison.
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
