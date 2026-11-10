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
 * Presents the validated pac-air-eau-hybride-gaz-collective article.
 */
export function CollectiveHybridHeatPumpArticle() {
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
            Bâtiments équipés d’un chauffage collectif à eau, notamment lorsque les besoins du bâtiment rendent difficile l’installation
            d’une PAC air/eau seule.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            <strong>3 000 à 5 000 € par logement</strong>
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p className="mb-0">Nécessite :</p>
          <ul>
            <SolutionListItem>un chauffage collectif avec réseau d’eau</SolutionListItem>
            <SolutionListItem>un espace extérieur suffisant pour installer les unités de PAC</SolutionListItem>
            <SolutionListItem>un local technique adapté</SolutionListItem>
            <SolutionListItem>un raccordement électrique adapté</SolutionListItem>
            <SolutionListItem>de conserver une chaudière gaz pour assurer l’appoint</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>Pour réduire l’utilisation du gaz tout en limitant la puissance de PAC à installer</p>
          <p>
            La PAC couvre la majorité des besoins et la chaudière gaz prend le relais lorsque les besoins sont les plus importants,
            notamment lors des périodes les plus froides.
          </p>
          <p>
            Cette configuration permet de réduire l’investissement et les contraintes d’intégration par rapport à une installation 100 %
            PAC, mais le bâtiment reste partiellement dépendant du gaz.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/hybrid.svg">
      <p>
        Une solution hybride associe une <strong>pompe à chaleur air/eau collective</strong> et une <strong>chaudière gaz</strong>.
      </p>
      <p>
        La PAC capte les calories présentes dans l’air extérieur pour chauffer l’eau qui circule dans le réseau de chauffage du bâtiment.
        Elle assure la production de chaleur en fonctionnement courant.
      </p>
      <p>
        La chaudière gaz intervient en complément lorsque la PAC ne suffit plus à couvrir les besoins, notamment lors des périodes de grand
        froid ou lorsque des températures d’eau élevées sont nécessaires.
      </p>
      <p>L’objectif est donc de bénéficier des performances d’une PAC tout en conservant la chaudière gaz comme appoint.</p>
      <p>Cette configuration permet d’installer une PAC moins puissante qu'avec une solution 100 % thermodynamique.</p>
    </SolutionSection>
  );
}

/**
 * Renders the article's fonctionnement section.
 */
function OperationSection() {
  return (
    <SolutionSection id="fonctionnement">
      <p>La PAC air/eau utilise les calories présentes dans l’air extérieur pour chauffer l’eau du réseau de chauffage.</p>
      <p>Elle fonctionne en priorité et couvre la majorité des besoins.</p>
      <p>
        Lorsque les besoins deviennent trop importants ou que les conditions extérieures réduisent ses performances, la chaudière gaz assure
        l’appoint.
      </p>
      <p>Deux configurations sont possibles :</p>
      <ul>
        <SolutionListItem>
          la PAC et la chaudière gaz assurent ensemble <strong>le chauffage et l’eau chaude sanitaire</strong>
        </SolutionListItem>
        <SolutionListItem>
          la PAC et la chaudière assurent <strong>le chauffage</strong>, tandis que l’eau chaude sanitaire est produite par un autre système
        </SolutionListItem>
      </ul>
      <SolutionFlow
        steps={[
          {
            label: 'Air extérieur',
          },
          {
            label: 'PAC air/eau',
          },
          {
            label: 'Production principale de chaleur',
          },
          {
            label: 'Chaudière gaz en appoint',
          },
          {
            label: 'Réseau d’eau du bâtiment',
          },
          {
            label: 'Radiateurs / plancher chauffant',
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
      <p>La solution hybride est particulièrement adaptée lorsque :</p>
      <ul>
        <SolutionListItem>
          le bâtiment dispose d’un <strong>chauffage collectif à eau</strong>
        </SolutionListItem>
        <SolutionListItem>il est actuellement chauffé avec une énergie fossile</SolutionListItem>
        <SolutionListItem>
          l’espace disponible ne permet pas facilement d’installer la puissance nécessaire pour une solution 100 % PAC
        </SolutionListItem>
        <SolutionListItem>le bâtiment présente des besoins importants lors des périodes les plus froides</SolutionListItem>
        <SolutionListItem>les émetteurs nécessitent ponctuellement des températures d’eau élevées</SolutionListItem>
        <SolutionListItem>un espace extérieur permet d’installer les unités de PAC</SolutionListItem>
        <SolutionListItem>le raccordement électrique peut supporter la puissance nécessaire en 100% PAC.</SolutionListItem>
      </ul>
      <p>
        L’hybridation permet notamment de réduire la puissance de PAC à installer et donc les contraintes de place, d’acoustique et de
        raccordement électrique.
      </p>
      <p>En revanche, elle nécessite d’installer 2 appareils.</p>
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
        <SolutionListItem>Réduit la consommation de gaz en faisant fonctionner prioritairement la PAC</SolutionListItem>
        <SolutionListItem>Réduit les émissions de CO₂ par rapport à une solution fonctionnant uniquement au gaz</SolutionListItem>
        <SolutionListItem>Permet d’installer une PAC moins puissante, donc moins coûteuse et plus facile à intégrer</SolutionListItem>
        <SolutionListItem>
          Limite les contraintes liées à l’espace disponible, au raccordement électrique et à l’acoustique
        </SolutionListItem>
        <SolutionListItem>La chaudière gaz permet de couvrir les pointes de besoins en hiver</SolutionListItem>
        <SolutionListItem>Peut être adaptée à des bâtiments nécessitant ponctuellement des températures d’eau élevées</SolutionListItem>
        <SolutionListItem>Peut permettre le rafraîchissement lorsque la PAC et les émetteurs sont adaptés</SolutionListItem>
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
          <strong>Le gaz reste nécessaire :</strong> contrairement à une solution 100 % PAC, le bâtiment reste partiellement dépendant d’une
          énergie fossile.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Émissions de CO₂ :</strong> elles restent supérieures à celles d’une installation 100 % thermodynamique.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Double système :</strong> la présence d’une PAC et d’une chaudière implique deux équipements à exploiter et entretenir.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Coûts d’exploitation :</strong> deux énergies restent utilisées, avec les abonnements associés.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Espace extérieur :</strong> il faut disposer d’un emplacement suffisant pour les unités extérieures de la PAC.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Acoustique :</strong> l’implantation des unités extérieures doit tenir compte des nuisances sonores.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Raccordement électrique :</strong> la capacité du réseau électrique doit être vérifiée.
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
            description: (
              <p>
                Il est recommandé de faire appel à un <strong>AMO</strong> pour accompagner la copropriété dans la définition et le suivi du
                projet.
              </p>
            ),
            title: 'Se faire accompagner',
          },
          {
            description: (
              <p>Analyser les besoins de chauffage du bâtiment, les équipements existants et les possibilités d’implantation de la PAC.</p>
            ),
            title: 'Réaliser une étude de faisabilité',
          },
          {
            description: <p>Déterminer la puissance de la PAC et les conditions dans lesquelles la chaudière gaz intervient en appoint.</p>,
            title: 'Dimensionner la solution hybride',
          },
          {
            description: (
              <p>
                Étudier l’espace disponible, l’acoustique, le raccordement électrique, le local technique et la compatibilité avec le réseau
                de chauffage existant.
              </p>
            ),
            title: 'Vérifier les contraintes techniques',
          },
          {
            description: (
              <p>Identifier les aides mobilisables, établir le plan de financement et soumettre le projet au vote de la copropriété.</p>
            ),
            title: 'Définir le financement et faire voter les travaux',
          },
          {
            description: <p>Installer la PAC et adapter la chaufferie et les équipements existants.</p>,
            title: 'Réaliser les travaux',
          },
          {
            description: (
              <p>
                Régler le pilotage entre la PAC et la chaudière afin de privilégier le fonctionnement de la PAC et assurer le suivi des
                performances.
              </p>
            ),
            title: "Mettre en service et suivre l'installation",
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
      <SolutionFaqItem question={'Pourquoi conserver une chaudière gaz avec une PAC ?'}>
        <p>
          La chaudière permet d’assurer l’appoint lorsque les besoins de chauffage sont importants, notamment pendant les périodes les plus
          froides. Cela permet de limiter la puissance de PAC à installer.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'La PAC fonctionne-t-elle en priorité ?'}>
        <p>
          Oui. Dans le principe retenu pour cette solution, la PAC assure la production de chaleur en base et la chaudière gaz intervient en
          appoint.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Pourquoi ne pas installer uniquement une PAC ?'}>
        <p>
          Une installation 100 % PAC peut nécessiter davantage de puissance électrique et d’espace extérieur pas toujours disponible.
          L’hybridation permet de réduire ces contraintes et peut donc faciliter l’installation dans certains bâtiments.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'La solution peut-elle produire l’eau chaude sanitaire ?'}>
        <p>
          Oui, selon la configuration. La PAC et la chaudière peuvent assurer ensemble le chauffage et l’ECS. Il est également possible de
          les utiliser uniquement pour le chauffage et de produire l’ECS avec un autre système.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Est-ce une solution entièrement renouvelable ?'}>
        <p>
          Non. La PAC utilise principalement les calories présentes dans l’air extérieur et de l’électricité, mais la chaudière d’appoint
          continue à consommer du gaz. Le bâtiment reste donc partiellement dépendant d'une énergie fossile.
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
      <p>Le coût d’investissement :</p>
      <p>
        <strong>3 000 à 5 000 €</strong>
      </p>
      <p>
        Le coût réel dépend notamment de la puissance de PAC nécessaire, des équipements existants et des contraintes d’intégration au
        bâtiment.
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
      <p>
        Les aides mobilisables dépendent de la configuration de l’installation, des équipements installés et du projet global de rénovation.
      </p>
      <p>
        Une solution hybride associant une pompe à chaleur et une chaudière ne bénéficie pas nécessairement des mêmes dispositifs qu’une PAC
        fonctionnant seule.
      </p>
      <p>Il est donc recommandé de vérifier les aides disponibles pour le projet avant d’engager les travaux.</p>
      <p>
        <SolutionContentLink href="https://mesaides.france-renov.gouv.fr">Estimer les aides disponibles</SolutionContentLink>
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
          Le simulateur réalisé par France Chaleur Urbaine vous permet d'évaluer la pertinence d'une solution hybride associant une PAC
          air/eau collective et une chaudière gaz pour votre bâtiment.
        </p>
        <p className="mb-0">Vous y trouverez :</p>
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
