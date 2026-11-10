import { SolutionContentLink } from '../client/SolutionContentLink';
import { SolutionFaqItem } from '../client/SolutionFaqItem';
import { SolutionListItem } from '../client/SolutionListItem';
import { SolutionResourceCard } from '../client/SolutionResourceCard';
import { SolutionSection } from '../client/SolutionSection';
import { SolutionSummaryCard } from '../client/SolutionSummaryCard';
import { SolutionTestCallout } from '../client/SolutionTestCallout';

/**
 * Presents the validated reseau-de-chaleur article.
 */
export function HeatNetworkArticle() {
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
            Principalement les bâtiments disposant d’un chauffage collectif, situés à proximité d’un réseau de chaleur existant ou en cours
            de développement.
          </p>
          <p>Le cas le plus favorable est un bâtiment actuellement chauffé collectivement au gaz ou au fioul.</p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="cost">
          <p>
            Variable selon le réseau et le bâtiment. Le coût dépend notamment de la distance au réseau, des travaux nécessaires pour
            raccorder l’immeuble et de la politique tarifaire du gestionnaire.
          </p>
          <p>
            <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/ressources/cout-raccordement#contenu">
              https://france-chaleur-urbaine.beta.gouv.fr/ressources/cout-raccordement#contenu
            </SolutionContentLink>
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="feasibility">
          <p>
            Elle dépend avant tout de la proximité du réseau, de la puissance nécessaire au bâtiment et des conditions proposées par le
            gestionnaire du réseau.
          </p>
        </SolutionSummaryCard>
        <SolutionSummaryCard tone="benefits">
          <p>
            Pour remplacer une production de chaleur fossile par une chaleur produite de manière centralisée, pouvant mobiliser des énergies
            renouvelables et de récupération difficiles à exploiter directement à l’échelle d’un immeuble.
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
    <SolutionSection id="de-quoi-sagit-il" photo="/img/heating-solutions/network.svg">
      <p>
        Un réseau de chaleur produit de la chaleur de façon centralisée puis la distribue à plusieurs bâtiments à l’échelle d’un quartier ou
        d’une ville.
      </p>
      <p>
        Il peut utiliser différentes sources d’énergie :{' '}
        <strong>géothermie, biomasse, chaleur issue de l’incinération ou de procédés industriels, solaire thermique</strong>, mais
        également, selon les réseaux, des énergies fossiles.
      </p>
      <p>
        Le raccordement permet ainsi à un immeuble d'accéder à des sources de chaleur renouvelables ou de récupération sans avoir à
        installer son propre système de production correspondant dans le bâtiment.
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
      <p>La chaleur est produite dans une ou plusieurs installations centralisées.</p>
      <p>Elle circule ensuite dans un réseau de canalisations souterraines jusqu’aux bâtiments raccordés.</p>
      <p>
        Dans l’immeuble, une sous-station permet de transférer la chaleur du réseau vers le circuit de chauffage du bâtiment. La chaleur est
        ensuite distribuée dans les logements via le réseau collectif existant.
      </p>
      <p>Selon le réseau, elle peut servir au chauffage et à la production d’eau chaude sanitaire.</p>
    </SolutionSection>
  );
}

/**
 * Renders the article's conditions section.
 */
function SuitabilitySection() {
  return (
    <SolutionSection id="conditions">
      <p>Le raccordement est particulièrement pertinent lorsque :</p>
      <ul>
        <SolutionListItem>l’immeuble dispose déjà d’un chauffage collectif, notamment au gaz ou au fioul</SolutionListItem>
        <SolutionListItem>un réseau de chaleur passe à proximité du bâtiment ou une extension est prévue</SolutionListItem>
        <SolutionListItem>
          la puissance nécessaire au bâtiment est compatible avec les conditions de raccordement du réseau
        </SolutionListItem>
        <SolutionListItem>
          les conditions techniques et économiques proposées par le gestionnaire rendent le raccordement pertinent.
        </SolutionListItem>
      </ul>
      <p>
        Le passage d'une production collective gaz ou fioul à un réseau de chaleur présente généralement peu de contraintes techniques au
        niveau du bâtiment.
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
        <SolutionListItem>
          Accès à des énergies renouvelables et de récupération difficiles à mobiliser directement à l’échelle d’un bâtiment.
        </SolutionListItem>
        <SolutionListItem>
          Pas d’unité de production principale à installer dans la copropriété : la chaleur est produite à l’échelle du réseau.
        </SolutionListItem>
        <SolutionListItem>
          Bonne compatibilité avec un chauffage collectif existant, notamment en remplacement d’une chaudière collective gaz ou fioul.
        </SolutionListItem>
        <SolutionListItem>Mutualisation de la production de chaleur entre plusieurs bâtiments.</SolutionListItem>
        <SolutionListItem>Possibilité de couvrir le chauffage et, selon le réseau, l’eau chaude sanitaire.</SolutionListItem>
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
          La distance entre l’immeuble et le réseau est déterminante : un raccordement peut devenir très coûteux si le réseau est trop
          éloigné.
        </SolutionListItem>
        <SolutionListItem>Les conditions et le coût de raccordement varient fortement d’un réseau à l’autre.</SolutionListItem>
        <SolutionListItem>Le prix de la chaleur et le mix énergétique sont propres à chaque réseau.</SolutionListItem>
        <SolutionListItem>
          La puissance demandée par l’immeuble doit être compatible avec les conditions fixées par le gestionnaire.
        </SolutionListItem>
        <SolutionListItem>
          Si le réseau doit assurer également l’eau chaude sanitaire, il faut vérifier qu’il fonctionne toute l’année : certains réseaux ne
          fonctionnent qu’en période de chauffe.
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
      <p>
        <strong>1. Vérifier si le bâtiment est raccordable</strong>
      </p>
      <p>La première étape consiste à identifier les réseaux existants ou en construction à proximité du bâtiment.</p>
      <p>
        <strong>2. Faire une demande de raccordement</strong>
      </p>
      <p>Le gestionnaire du réseau étudie la possibilité de raccorder le bâtiment et les conditions techniques du projet.</p>
      <p>
        <strong>3. Étudier la proposition</strong>
      </p>
      <p>
        La copropriété peut notamment comparer le coût du raccordement, le prix de la chaleur, le mix énergétique du réseau et les travaux
        nécessaires dans l’immeuble.
      </p>
      <p>
        <strong>4. Faire voter le projet en copropriété</strong>
      </p>
      <p>Le raccordement et les travaux associés doivent être soumis à la copropriété.</p>
      <p>
        <strong>5. Réaliser les travaux</strong>
      </p>
      <p>
        Les travaux permettent de relier le bâtiment au réseau et d’installer la sous-station assurant l’échange avec le circuit de
        chauffage de l’immeuble.
      </p>
      <p>
        Lorsque le réseau est en cours de création ou d’extension, le raccordement peut être facilité car son tracé peut être adapté aux
        bâtiments souhaitant se raccorder.
      </p>
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
      <SolutionFaqItem question={'Comment savoir si un réseau de chaleur passe près de mon immeuble ?'}>
        <p>
          La{' '}
          <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/carte">carte France Chaleur Urbaine</SolutionContentLink>{' '}
          permet de visualiser les réseaux existants et en construction et de tester une adresse.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Un immeuble doit-il obligatoirement être juste à côté du réseau ?'}>
        <p>
          Pas nécessairement, mais la distance est un critère essentiel. Plus les travaux de réseau à réaliser sont importants, plus le
          raccordement peut être complexe ou coûteux. Le potentiel est également plus intéressant lorsque plusieurs bâtiments peuvent être
          raccordés dans un même secteur.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Le réseau de chaleur utilise-t-il uniquement des énergies renouvelables ?'}>
        <p>
          Non. Le mix énergétique varie selon les réseaux. Ils peuvent mobiliser de la biomasse, de la géothermie, du solaire thermique ou
          de la chaleur récupérée, mais certains utilisent également des énergies fossiles. Il faut donc regarder les caractéristiques du
          réseau concerné.
        </p>
      </SolutionFaqItem>
      <SolutionFaqItem question={'Peut-il produire aussi l’eau chaude sanitaire ?'}>
        <p>
          Oui, selon le réseau et la configuration du bâtiment. Dans ce cas, il faut notamment vérifier que le réseau fonctionne toute
          l’année.
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
      <p>Il n’existe pas de coût de raccordement unique : il dépend notamment du réseau, du bâtiment et des travaux nécessaires.</p>
      <p>Pour connaître le prix de la chaleur pratiqué par un réseau, consultez la liste des réseaux de chaleur.</p>
      <p>Les données tarifaires disponibles sont celles de l’année N-2.</p>
      <p>
        <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/reseaux">
          Consultez la liste des réseaux de chaleur
        </SolutionContentLink>
        ?
      </p>
      <p>Le montant dépend notamment :</p>
      <ul>
        <SolutionListItem>de la distance entre le bâtiment et le réseau</SolutionListItem>
        <SolutionListItem>des travaux nécessaires sur la voirie et dans le bâtiment</SolutionListItem>
        <SolutionListItem>des éventuelles contraintes rencontrées sur le tracé</SolutionListItem>
        <SolutionListItem>de la politique du gestionnaire du réseau.</SolutionListItem>
      </ul>
      <p>
        Selon les réseaux et leur phase de développement, le raccordement peut être partiellement financé, pris en charge dans certaines
        conditions ou facturé au bâtiment.
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
        <strong>À vérifier au moment du projet :</strong>
      </p>
      <ul>
        <SolutionListItem funding="renovation">les aides mobilisables par la copropriété</SolutionListItem>
        <SolutionListItem funding="local">les éventuelles aides ou conditions proposées localement</SolutionListItem>
        <SolutionListItem funding="financing">
          les modalités de financement du raccordement proposées par le gestionnaire du réseau
        </SolutionListItem>
      </ul>
    </SolutionSection>
  );
}

/**
 * Renders the article's aller-plus-loin section.
 */
function ResourcesSection() {
  return (
    <SolutionSection id="aller-plus-loin">
      <SolutionResourceCard title="Tester votre adresse et préparer votre projet" icon="🧮">
        <p>
          France Chaleur Urbaine permet de vérifier si un réseau de chaleur se trouve à proximité de votre bâtiment et d’évaluer la
          possibilité d’un raccordement.
        </p>
        <p>
          <strong>Testez votre adresse :</strong>
        </p>
        <div className="print:hidden">
          <iframe
            src="/iframe/form"
            title="Test d’adresse France Chaleur Urbaine"
            className="h-[330px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p className="text-right text-xs">
            Fourni par <a href="/">France Chaleur Urbaine</a>
          </p>
        </div>
        <p>
          Si le raccordement est envisageable, vous pourrez ensuite <strong>transmettre une demande de raccordement</strong> afin d’être mis
          en relation avec le gestionnaire du réseau concerné.
        </p>
        <p>Pour mieux comprendre le fonctionnement d’un réseau de chaleur et les différentes étapes d’un projet :</p>
        <p>
          <SolutionContentLink href="https://france-chaleur-urbaine.beta.gouv.fr/ressources/articles">
            <strong>En savoir plus sur les réseaux de chaleur</strong>
          </SolutionContentLink>
        </p>
      </SolutionResourceCard>
    </SolutionSection>
  );
}
