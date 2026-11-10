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
 * Presents the validated poele-insert-bois article.
 */
export function WoodStoveArticle() {
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
          <p>Tous, dès lors qu’ils comportent une évacuation des fumées ou qu’une évacuation des fumées peut être installée</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            Environ 4 <strong>800 à 7 800</strong>, avant déduction des aides financières.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>Nécessite :</p>
          <ul>
            <SolutionListItem>un espace suffisant pour stocker le combustible</SolutionListItem>
            <SolutionListItem>un accès permettant les livraisons de bois</SolutionListItem>
            <SolutionListItem>un conduit d'évacuation des fumées adapté</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>Pour chauffer son espace par une solution renouvelable et économique.</p>
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/wood-stove.svg">
      <p>
        Un poêle, insert ou foyer fermé est un système de chauffage qui utilise le bois comme combustible,{' '}
        <strong>sous forme de bûches ou de granulés selon le type d’appareil</strong>.
      </p>
      <p>La combustion du bois produit de la chaleur, qui est diffusée directement dans la pièce.</p>
      <p>
        Ce type d’équipement permet de chauffer une partie ou l’ensemble du logement selon sa configuration et ses performances
        énergétiques.{' '}
        <strong>Il ne produit pas d’eau chaude sanitaire et nécessite généralement un système de chauffage complémentaire.</strong>
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
      <p>
        Un poêle, insert ou foyer fermé est principalement composé d’un{' '}
        <strong>foyer dans lequel le bois, sous forme de bûches ou de granulés selon l’appareil, est brûlé</strong>. La chaleur produite est
        ensuite diffusée directement dans la pièce.
      </p>
      <p>
        <strong>Un conduit d’évacuation des fumées est nécessaire</strong> pour évacuer les produits issus de la combustion.
      </p>
      <SolutionFlow
        steps={[
          {
            label: 'Bois (bûches ou granulés)',
          },
          {
            label: 'Combustion dans le foyer',
          },
          {
            label: 'Diffusion de la chaleur dans la pièce',
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
        Avant d’engager le projet, il est recommandé de vérifier le niveau de performance énergétique du logement.{' '}
        <strong>
          Un logement bien isolé permet de limiter les besoins de chauffage et de dimensionner l’appareil au plus près des besoins.
        </strong>
      </p>
      <p>Cette solution est particulièrement adaptée lorsque :</p>
      <ul>
        <SolutionListItem>le logement dispose d’un conduit de fumée adapté ou qu’il est possible d’en créer un ;</SolutionListItem>
        <SolutionListItem>un emplacement est disponible pour installer l’appareil ;</SolutionListItem>
        <SolutionListItem>le stockage du combustible est possible ;</SolutionListItem>
        <SolutionListItem>la configuration du logement permet une bonne diffusion de la chaleur.</SolutionListItem>
      </ul>
      <p>
        <strong>Le poêle, l’insert ou le foyer fermé peut constituer le chauffage principal ou un chauffage d’appoint</strong>, selon la
        configuration du logement, ses performances énergétiques et les besoins de ses occupants.
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
        <SolutionListItem>Prix de l’énergie souvent plus stable et économique</SolutionListItem>
        <SolutionListItem>Réduit les émissions de gaz à effet de serre liées au chauffage</SolutionListItem>
        <SolutionListItem>Repose sur une technologie simple, mature et éprouvée.</SolutionListItem>
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
      <p>Avant d'installer un poêle, un insert ou un foyer fermé au bois, plusieurs éléments sont à prendre en compte :</p>
      <ul>
        <SolutionListItem>L’existence ou la possibilité de créer un conduit d’évacuation des fumées adapté ;</SolutionListItem>
        <SolutionListItem>L’espace disponible pour installer l’appareil et stocker le combustible ;</SolutionListItem>
        <SolutionListItem>Les possibilités d’approvisionnement en bûches ou granulés, selon le type d’appareil ;</SolutionListItem>
        <SolutionListItem>Les éventuelles contraintes locales liées aux émissions de polluants atmosphériques ;</SolutionListItem>
        <SolutionListItem>
          L'obligation de faire entretenir l'appareil et ramoner le conduit par un professionnel qualifié ;
        </SolutionListItem>
        <SolutionListItem>
          Le chargement manuel et la présence régulière de l'utilisateur pour les appareils à bûches, qui ne sont ni automatiques ni
          programmables ;
        </SolutionListItem>
        <SolutionListItem>L'absence de production d'eau chaude sanitaire.</SolutionListItem>
      </ul>
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
          { title: 'Étude des besoins de chauffage du logement et vérification de la faisabilité de l’installation ;' },
          { title: 'Choix de l’appareil et du combustible (bûches ou granulés), du modèle et de sa puissance ;' },
          { title: 'Recherche des financements mobilisables ;' },
          {
            title:
              'Installation de l’appareil par un professionnel qualifié et, si nécessaire, création ou adaptation du conduit de fumée ;',
          },
          {
            title:
              "Mise en service de l'installation, puis entretien annuel par un professionnel qualifié et ramonage du conduit conformément aux obligations réglementaires.",
          },
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
      <SolutionFaqItem question={'Un poêle à bois peut-il chauffer toute une maison ?'}>
        <p>
          Oui, dans certains cas. Cela dépend notamment de la performance énergétique du logement, de sa configuration et de la puissance de
          l’appareil. Selon les situations, un système de chauffage complémentaire peut rester nécessaire.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Quelle est la différence entre un poêle, un insert et un foyer fermé ?'}>
        <p>
          Le poêle est un appareil de chauffage indépendant. L’insert est installé dans une cheminée existante, tandis que le foyer fermé
          est intégré à une cheminée conçue autour de l’appareil. Dans les trois cas, la chaleur produite par la combustion du bois est
          diffusée directement dans le logement.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il obligatoirement disposer d’un conduit de fumée ?'}>
        <p>
          Oui. L’appareil doit être raccordé à un conduit permettant l’évacuation des fumées. Si le logement n’en dispose pas, la création
          d’un conduit peut être envisagée sous réserve de la faisabilité technique et des règles applicables.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Bûches ou granulés : que choisir ?'}>
        <p>
          Les deux solutions présentent des caractéristiques différentes. Les appareils à granulés permettent généralement une alimentation
          automatisée et une régulation plus précise, tandis que les appareils à bûches nécessitent l’action de l’utilisateur pour l’un
          allumage, le chargement et la gestion des arrivées d’air manuel. Le choix dépend de l’usage souhaité, de l’espace disponible pour
          stocker le combustible et des possibilités d’approvisionnement.
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
        Le coût dépend notamment du type d’appareil choisi, de sa puissance, du combustible utilisé, de la configuration du logement et des
        éventuels travaux nécessaires pour le conduit de fumée.
      </p>
      <p>
        À titre indicatif, le coût d’installation (matériel + pose) est généralement compris entre <strong>4 800 et 7 800 €</strong>, avant
        déduction des aides financières.
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
        <SolutionFundingCard kind="local">
          dans certains cas, des <strong>aides locales,</strong> en particulier{' '}
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/particuliers/amenager-maison/renover/aide-fonds-air-bois">
            les Primes Air Bois
          </SolutionContentLink>
        </SolutionFundingCard>
      </SolutionFundingList>
      <p>
        Pour en savoir plus sur les aides mobilisables, utilisez le simulateur de <strong>France Chaleur Urbaine</strong>, qui vous oriente
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
        <p>Le simulateur réalisé par France Chaleur Urbaine vous permet d'évaluer la pertinence.</p>
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
