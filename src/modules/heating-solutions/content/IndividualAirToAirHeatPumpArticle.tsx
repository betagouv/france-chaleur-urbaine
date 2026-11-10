import { SolutionContentLink } from '../client/SolutionContentLink';
import { SolutionFaqItem } from '../client/SolutionFaqItem';
import { SolutionFlow } from '../client/SolutionFlow';
import { SolutionListItem } from '../client/SolutionListItem';
import { SolutionResourceCard } from '../client/SolutionResourceCard';
import { SolutionSection } from '../client/SolutionSection';
import { SolutionSteps } from '../client/SolutionSteps';
import { SolutionSummaryCard } from '../client/SolutionSummaryCard';
import { SolutionTestCallout } from '../client/SolutionTestCallout';

/**
 * Presents the validated pac-air-air-individuelle article.
 */
export function IndividualAirToAirHeatPumpArticle() {
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
          <p>Bâtiments comprenant des logements équipés d’un chauffage individuel ou maisons individuelles.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>3 000–5 000 €</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p className="mb-0">Nécessite :</p>
          <ul>
            <SolutionListItem>un emplacement adapté pour installer l’unité extérieure</SolutionListItem>
            <SolutionListItem>la possibilité d’installer une ou plusieurs unités intérieures dans le logement</SolutionListItem>
            <SolutionListItem>une installation compatible avec les règles de la copropriété ou de l’urbanisme</SolutionListItem>
            <SolutionListItem>de prendre en compte les contraintes acoustiques et architecturales.</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer ou réduire l’utilisation d’un chauffage individuel au gaz ou électrique par une solution plus performante, sans
            avoir à créer de réseau de chauffage à eau.
          </p>
          <p>La PAC air/air permet également de rafraîchir le logement en été.</p>
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/air-air.svg">
      <p>
        Une pompe à chaleur (PAC) air/air capte les calories présentes dans l’air extérieur pour chauffer directement l’air du logement.
      </p>
      <p>Elle est composée d’une unité extérieure et d’une ou plusieurs unités intérieures qui diffusent la chaleur dans les pièces.</p>
      <p>Selon la configuration, elle peut chauffer une seule pièce (monosplit) ou plusieurs pièces (multisplit).</p>
      <p>La PAC air/air est réversible : elle peut également rafraîchir le logement en été.</p>
      <p>En revanche, elle ne produit généralement pas l’eau chaude sanitaire, qui doit être assurée par un autre équipement.</p>
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
        L’unité extérieure capte les calories présentes dans l’air. La pompe à chaleur augmente leur niveau de température avec de
        l’électricité avant de diffuser la chaleur directement dans le logement grâce aux unités intérieures.
      </p>
      <p>
        Contrairement à une PAC air/eau, la chaleur n’est pas transmise à un circuit d’eau : elle est directement diffusée dans l’air des
        pièces.
      </p>
      <p>Selon l’installation :</p>
      <ul>
        <SolutionListItem>un système monosplit dessert une pièce</SolutionListItem>
        <SolutionListItem>un système multisplit peut desservir plusieurs pièces</SolutionListItem>
        <SolutionListItem>le fonctionnement peut être inversé pour rafraîchir le logement en été.</SolutionListItem>
      </ul>
      <SolutionFlow
        steps={[
          {
            label: 'Air extérieur',
          },
          {
            label: 'Unité extérieure',
          },
          {
            label: 'Pompe à chaleur',
          },
          {
            label: 'Unité(s) intérieure(s)',
          },
          {
            label: 'Air chaud en hiver/air frais en été',
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
      <p>La PAC air/air est particulièrement adaptée lorsque :</p>
      <ul>
        <SolutionListItem>
          le logement dispose d’un <strong>chauffage individuel</strong>
        </SolutionListItem>
        <SolutionListItem>il est actuellement chauffé à l’électricité (pas de réseau d’eau centralisé)</SolutionListItem>
        <SolutionListItem>un emplacement adapté est disponible pour installer l’unité extérieure</SolutionListItem>
        <SolutionListItem>la puissance électrique du contrat électrique est adapté</SolutionListItem>
        <SolutionListItem>l’installation est compatible avec les règles de la copropriété ou de l’urbanisme</SolutionListItem>
        <SolutionListItem>les contraintes acoustiques et architecturales permettent son installation.</SolutionListItem>
      </ul>
      <p>
        Elle est particulièrement adaptée aux logements chauffés à l’électricité, puisqu’elle ne nécessite pas de créer un réseau
        hydraulique dans le logement.
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
        <SolutionListItem>Faibles émissions de CO₂</SolutionListItem>
        <SolutionListItem>Permet de réduire les consommations liées à un chauffage électrique</SolutionListItem>
        <SolutionListItem>Ne nécessite pas de créer un réseau de chauffage à eau</SolutionListItem>
        <SolutionListItem>Peut chauffer une ou plusieurs pièces selon la configuration</SolutionListItem>
        <SolutionListItem>Permet également de rafraîchir le logement en été</SolutionListItem>
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
      <ul>
        <SolutionListItem>
          <strong>Bruit :</strong> les unités intérieures et extérieures peuvent générer des nuisances sonores
        </SolutionListItem>
        <SolutionListItem>
          <strong>Impact esthétique :</strong> l’unité extérieure peut modifier l’aspect du bâtiment
        </SolutionListItem>
        <SolutionListItem>
          <strong>Copropriété et urbanisme :</strong> le règlement doit être vérifié et une autorisation peut être nécessaire lorsque
          l’installation affecte les parties communes ou l’aspect extérieur
        </SolutionListItem>
        <SolutionListItem>
          <strong>Contraintes architecturales :</strong> des règles particulières peuvent s’appliquer dans certaines zones protégées
        </SolutionListItem>
        <SolutionListItem>
          <strong>Raccordement électrique :</strong> la capacité de l’installation électrique doit être vérifiée
        </SolutionListItem>
        <SolutionListItem>
          <strong>Eau chaude sanitaire :</strong> la PAC air/air ne la produit généralement pas ; un autre équipement doit donc être prévu
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
      <SolutionSteps
        steps={[
          {
            description: <p>Évaluer les besoins de chauffage et vérifier les possibilités d’implantation des équipements.</p>,
            title: 'Étudier la faisabilité',
          },
          {
            description: <p>Consulter les éventuels règlements et identifier les autorisations nécessaires.</p>,
            title: 'Vérifier les règles de la copropriété et de l’urbanisme',
          },
          {
            description: (
              <p>Déterminer la puissance nécessaire et choisir une configuration monosplit ou multisplit selon les pièces à chauffer.</p>
            ),
            title: 'Dimensionner l’installation',
          },
          {
            description: (
              <p>
                Déterminer l’implantation de l’unité extérieure et des unités intérieures en tenant compte des contraintes acoustiques et
                architecturales.
              </p>
            ),
            title: 'Choisir l’emplacement des équipements',
          },
          {
            description: <p>Installer l’unité extérieure et les unités intérieures et réaliser les raccordements nécessaires.</p>,
            title: 'Installer les équipements',
          },
          {
            description: <p>Régler l’équipement et assurer son entretien régulier.</p>,
            title: 'Mettre en service et entretenir l’installation',
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
      <SolutionFaqItem question={'Une PAC air/air peut-elle chauffer tout mon logement ?'}>
        <p>
          Oui, selon la configuration. Un système monosplit chauffe une pièce, tandis qu’un système multisplit peut chauffer plusieurs
          pièces du logement.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Peut-elle rafraîchir mon logement en été ?'}>
        <p>Oui. La PAC air/air est réversible et peut également produire du froid.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Peut-elle produire l’eau chaude sanitaire ?'}>
        <p>
          Généralement non. L’eau chaude sanitaire doit être assurée par un autre équipement, par exemple un ballon électrique ou
          thermodynamique.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Est-elle adaptée si mon logement est chauffé avec des radiateurs électriques ?'}>
        <p>
          Oui. C’est l’une des configurations particulièrement adaptées à la PAC air/air puisqu’elle permet de changer de système sans créer
          de réseau de chauffage à eau.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il l’autorisation de la copropriété ?'}>
        <p>
          Dans la majorité des cas, l’installation doit être vérifiée au regard du règlement de copropriété et peut nécessiter une
          autorisation, notamment lorsqu’elle affecte les parties communes ou l’aspect extérieur du bâtiment.
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
      <p>Le coût d’investissement est estimé à :</p>
      <p>
        <strong>3 000 à 5 000 €</strong>
      </p>
      <p>Le coût réel dépend notamment de la puissance nécessaire, du nombre d’unités intérieures et des contraintes d’installation.</p>
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
        La PAC air/air peut bénéficier des <strong>Certificats d’économies d’énergie (CEE)</strong>, sous certaines conditions.
      </p>
      <p>
        La fiche CEE <strong>BAR-TH-129</strong> concerne spécifiquement les pompes à chaleur air/air.
      </p>
      <p>Elle prévoit notamment des critères liés à la performance de l’équipement et au logement concerné.</p>
      <p>Le montant de l’aide dépend du projet et de la situation du ménage.</p>
      <p>
        <SolutionContentLink href="https://mesaides.france-renov.gouv.fr/aides/cee/BAR-TH-129/Pompe%20%C3%A0%20chaleur%20air%2Fair">
          Vérifier les aides disponibles pour une PAC air/air
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
          Le simulateur réalisé par France Chaleur Urbaine vous permet d’évaluer la pertinence d’une PAC air/air pour votre logement et de
          la comparer aux autres solutions adaptées à votre situation.
        </p>
        <p className="mb-0">Vous y trouverez :</p>
        <ul>
          <SolutionListItem>une estimation des coûts de consommation et du prix de l’installation</SolutionListItem>
          <SolutionListItem>
            une mise en lien avec un conseiller du service public capable de vous accompagner dans votre projet
          </SolutionListItem>
        </ul>
      </SolutionResourceCard>
      <SolutionResourceCard title="En savoir plus sur la PAC air/air" icon="📚">
        <p>
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/particuliers/amenager-maison/chauffer/pompe-chaleur">
            Se chauffer avec une pompe à chaleur{' '}
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/particuliers/amenager-maison/climatiser-rafraichir/bien-choisir-climatisation">
            Comment choisir sa climatisation
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
