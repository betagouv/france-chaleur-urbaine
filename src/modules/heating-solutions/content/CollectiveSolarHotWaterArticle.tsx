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
 * Presents the validated solaire-thermique-eau-chaude-collective article.
 */
export function CollectiveSolarHotWaterArticle() {
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
            Immeubles collectifs avec production d’eau chaude sanitaire centralisée et disposant d'une surface de toiture adaptée à
            l'installation de capteurs solaires.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>2000 à 3000 €/logement</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p className="mb-0">Nécessite :</p>
          <ul>
            <SolutionListItem>une surface suffisante pour installer les capteurs solaires</SolutionListItem>
            <SolutionListItem>une exposition adaptée et peu ombragée</SolutionListItem>
            <SolutionListItem>un espace permettant d'installer le ballon de stockage</SolutionListItem>
            <SolutionListItem>un système d'appoint pour produire de l'eau chaude lorsque l'énergie solaire ne suffit pas</SolutionListItem>
          </ul>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour utiliser l’énergie du soleil afin de couvrir une partie des besoins en eau chaude sanitaire du bâtiment et réduire la
            consommation d’énergie associée.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/solar-thermal.svg">
      <p>
        Un chauffe-eau solaire collectif (CESC) utilise l’énergie du soleil pour produire une partie de l’eau chaude sanitaire d’un
        bâtiment.
      </p>
      <p>Des capteurs solaires thermiques, généralement installés en toiture, récupèrent la chaleur du soleil.</p>
      <p>Cette chaleur est transmise à un ballon de stockage qui alimente ensuite le réseau d’eau chaude sanitaire du bâtiment.</p>
      <p>Un système d’appoint reste nécessaire lorsque l’énergie solaire disponible ne suffit pas.</p>
    </SolutionSection>
  );
}

/**
 * Renders the article's fonctionnement section.
 */
function OperationSection() {
  return (
    <SolutionSection id="fonctionnement">
      <p>Le système comprend :</p>
      <ul>
        <SolutionListItem>des capteurs solaires thermiques, qui récupèrent la chaleur du soleil</SolutionListItem>
        <SolutionListItem>un circuit contenant un fluide caloporteur, qui transporte cette chaleur</SolutionListItem>
        <SolutionListItem>un ballon de stockage, dans lequel l’eau est chauffée et conservée</SolutionListItem>
        <SolutionListItem>un système d’appoint, qui prend le relais lorsque la production solaire est insuffisante</SolutionListItem>
      </ul>
      <SolutionFlow
        steps={[
          { label: 'Soleil' },
          { label: 'Capteurs solaires thermiques' },
          { label: 'Ballon de stockage' },
          { label: 'Eau chaude sanitaire' },
        ]}
      />
      <p>L’appoint complète la production lorsque cela est nécessaire.</p>
    </SolutionSection>
  );
}

/**
 * Renders the article's conditions section.
 */
function SuitabilitySection() {
  return (
    <SolutionSection id="conditions">
      <p>Cette solution est particulièrement adaptée lorsque :</p>
      <ul>
        <SolutionListItem>le bâtiment présente des besoins réguliers en eau chaude toute l’année</SolutionListItem>
        <SolutionListItem>le bâtiment dispose d'un système de production d'eau chaude sanitaire (ECS) centralisé</SolutionListItem>
        <SolutionListItem>une surface suffisamment exposée au soleil est disponible pour installer les capteurs</SolutionListItem>
        <SolutionListItem>les capteurs peuvent être installés avec peu d’ombrage</SolutionListItem>
        <SolutionListItem>un emplacement est disponible pour le ballon de stockage</SolutionListItem>
        <SolutionListItem>un système d’appoint peut compléter la production solaire.</SolutionListItem>
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
        <SolutionListItem>Utilise une énergie renouvelable et disponible localement.</SolutionListItem>
        <SolutionListItem>Réduit la consommation d’énergie nécessaire à la production d’eau chaude.</SolutionListItem>
        <SolutionListItem>Consomme peu d’énergie en fonctionnement</SolutionListItem>
        <SolutionListItem>Ne génère pas directement de CO₂ ni de polluants lors de son fonctionnement</SolutionListItem>
        <SolutionListItem>Peut fonctionner avec un système d’appoint existant.</SolutionListItem>
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
          <strong>Surface et exposition</strong> : les performances dépendent de l’implantation des capteurs et de l’ombrage.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Dimensionnement</strong> : la surface de capteurs et le volume du ballon doivent être adaptés aux besoins du foyer.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Emplacement du ballon</strong> : il est préférable de limiter la distance entre les capteurs et le ballon afin de réduire
          les pertes de chaleur.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Surchauffe</strong> : l’installation doit prévoir une gestion des périodes où la production solaire est importante mais
          les besoins faibles.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Appoint</strong> : un autre système reste nécessaire lorsque l’énergie solaire est insuffisante.
        </SolutionListItem>
        <SolutionListItem>
          <strong>Entretien</strong> : un suivi régulier permet de vérifier le bon fonctionnement et les performances de l’installation.
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
            description: <p>Prendre en compte le nombre d’occupants et les besoins en eau chaude du bâtiment.</p>,
            title: 'Évaluer les besoins en eau chaude',
          },
          {
            description: (
              <p>Étudier la surface disponible, l’exposition, l’inclinaison, les éventuels ombrages et l’emplacement du ballon.</p>
            ),
            title: 'Vérifier la faisabilité de l’installation',
          },
          {
            description: <p>Déterminer la surface de capteurs et le volume de stockage adaptés aux besoins.</p>,
            title: 'Dimensionner l’installation',
          },
          {
            description: <p>Prévoir le système qui complètera la production solaire lorsqu’elle sera insuffisante.</p>,
            title: 'Définir le système d’appoint',
          },
          { title: 'Identifier les aides et établir le financement' },
          {
            description: <p>Installation des capteurs, du ballon, du circuit et de la régulation.</p>,
            title: 'Installer et mettre en service les équipements',
          },
          {
            description: <p>Contrôler régulièrement son fonctionnement et ses performances.</p>,
            title: 'Entretenir l’installation',
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
      <SolutionFaqItem question={'Le solaire thermique peut-il produire toute mon eau chaude ?'}>
        <p>
          Il peut couvrir une partie importante des besoins, mais un système d’appoint reste nécessaire lorsque l’énergie solaire est
          insuffisante.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Est-ce que cela fonctionne partout en France ?'}>
        <p>
          Oui. l’ensoleillement est suffisant sur tout le territoire français, y compris dans le nord de la France, pour envisager un
          chauffe-eau solaire.
        </p>
        <p>Le dimensionnement est adapté à la localisation.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Quelle différence avec des panneaux photovoltaïques ?'}>
        <p>
          Les panneaux photovoltaïques produisent de l’électricité. Les capteurs solaires thermiques récupèrent directement la chaleur du
          soleil pour chauffer l’eau.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Faut-il toujours un système d’appoint ?'}>
        <p>Oui. Il assure la production d’eau chaude lorsque l’apport solaire est insuffisant.</p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Est-ce que cette solution chauffe aussi la maison ?'}>
        <p>
          Non, pas dans la configuration présentée ici : cette solution est destinée uniquement à l’eau chaude sanitaire. Un système solaire
          combiné (SSC) peut, lui, contribuer à la fois au chauffage et à la production d’eau chaude
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
        <strong>2 000 à 3 000 €/logement</strong>
      </p>
      <p>
        Le coût réel dépend notamment de la surface de capteurs, du volume du ballon, de la configuration du bâtiment et des travaux
        nécessaires à l’installation.
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
      <p>Plusieurs aides peuvent contribuer au financement d’une installation solaire thermique collective, sous conditions</p>
      <SolutionFundingList>
        <SolutionFundingCard kind="heatFund">Fonds Chaleur : le chauffe-eau solaire collectif est éligible</SolutionFundingCard>
        <SolutionFundingCard kind="cee">Certificats d’économies d’énergie (CEE)</SolutionFundingCard>
        <SolutionFundingCard kind="local">Aides locales, selon le territoire.</SolutionFundingCard>
      </SolutionFundingList>
      <p>Le montant des aides dépend notamment des caractéristiques du bâtiment et du projet.</p>
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
          Le simulateur réalisé par France Chaleur Urbaine vous permet d’évaluer la pertinence du solaire thermique pour votre bâtiment et
          de le comparer aux autres solutions adaptées à votre situation.
        </p>
        <p className="mb-0">Vous y trouverez :</p>
        <ul>
          <SolutionListItem>une estimation des coûts de consommation et du prix de l’installation</SolutionListItem>
          <SolutionListItem>
            une mise en lien avec un conseiller du service public capable de vous accompagner dans votre projet
          </SolutionListItem>
        </ul>
      </SolutionResourceCard>
      <SolutionResourceCard title="En savoir plus sur le chauffe-eau solaire" icon="📚">
        <p>
          <SolutionContentLink href="https://agirpourlatransition.ademe.fr/particuliers/amenager-maison/chauffer/production-eau-chaude-avec-energies-renouvelables">
            Produire de l’eau chaude avec des énergies renouvelables
          </SolutionContentLink>
        </p>
        <p>
          <SolutionContentLink href="https://france-renov.gouv.fr/renovation/chauffage/solaire">
            Le chauffage solaire - France Rénov’
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
