import CallOut from '@codegouvfr/react-dsfr/CallOut';
import Image from 'next/image';

function PacImmeubleUsage() {
  return (
    <>
      <CallOut>
        Avant de remplacer un système de chauffage, il est essentiel de procéder à des travaux d'isolation de l'immeuble. Une isolation
        performante des murs, toitures, fenêtres et planchers réduit les déperditions de chaleur et permet de maintenir une température
        intérieure confortable tout en consommant moins d'énergie. Pour les pompes à chaleur (PAC), une bonne isolation est particulièrement
        importante, car leur efficacité est optimale lorsqu'elles fonctionnent à basse température. En isolant correctement, on peut
        abaisser la température de consigne du chauffage, maximisant ainsi le rendement de la PAC et réalisant des économies d'énergie tout
        en réduisant l'empreinte carbone du bâtiment.
      </CallOut>
      <h2>Est-ce qu’on peut installer des PAC en immeuble ?</h2>
      <p>
        Le choix du type de PAC et la faisabilité du projet dépendent de plusieurs facteurs, notamment le type de chauffage existant dans
        l'immeuble : individuel ou collectif.
      </p>
      <Image src="/img/choix_chauffage.webp" alt="tableau comparatif des modes de chauffage" width="1000" height="300" className="w-full" />
      <p>
        Si vous êtes en système collectif : félicitations beaucoup de solutions s’offrent à vous ! En plus vous pourrez choisir parmi les
        plus vertueuses : le réseau de chaleur urbain, les PAC géothermiques, les PAC air/eau collectives, le solaire thermique pour l’eau
        chaude et la biomasse.
      </p>
      <p>
        Si vous êtes en système individuel : l’installation d’une PAC est moins évidente et plus compliqué. Vous pouvez cependant opter pour
        une PAC air/air ou une PAC air/eau avec unité extérieure sur le balcon.
      </p>
      <h2>Quelles sont les contraintes à prendre en compte ?</h2>
      <p>
        <strong>La place disponible</strong> : Les PAC géothermiques exigent un espace suffisant pour les forages, ce qui peut être un
        obstacle dans les zones urbaines denses. Les PAC air/eau nécessitent également de l'espace pour les unités extérieures, qui doivent
        être placées judicieusement pour éviter les nuisances sonores.
      </p>
      <p>
        <strong>Les autorisations administratives</strong> : pour l’installation d’une PAC en collectif ou individuel, il est nécessaire
        d'obtenir l'accord de l'assemblée générale des copropriétaires. Des autorisations supplémentaires peuvent être exigées pour les
        forages en cas de PAC géothermiques.
      </p>
      <p>
        <strong>L'isolation du bâtiment</strong> : Que le chauffage soit individuel ou collectif, il est important de réaliser des travaux
        d'isolation avant l'installation d'une PAC. Une meilleure isolation réduit les pertes de chaleur, permettant aux PAC de fonctionner
        à basse température, optimisant ainsi leur efficacité.
      </p>
      <h2>En savoir plus sur les PAC: quels sont les différents types de PAC et comment elles fonctionnent ?</h2>
      <p>
        Les pompes à chaleur (PAC) sont des solutions thermodynamiques qui permettent de chauffer, refroidir et/ou produire de l'eau chaude
        sanitaire (ECS) à partir de l'énergie récupérée dans l'environnement (air, sol, eau). Différentes technologies existent et elles
        n’ont pas toutes les mêmes fonctions. En plus d'améliorer l'efficacité énergétique des bâtiments, elles jouent un rôle clé dans la
        transition vers les énergies renouvelables :{' '}
        <strong>
          les PAC ont un rendement en moyenne 4 fois supérieur à une chaudière et elles utilisent de l’électricité qui est beaucoup moins
          carbonée que le gaz ou le fioul.
        </strong>
      </p>
      <p>Les PAC se divisent en plusieurs types, selon la source d'énergie utilisée et les besoins spécifiques couverts.</p>
      <Image src="/img/type_pac.webp" alt="différences entre les types de PAC" width="500" height="300" className="m-auto fr-pb-5w" />
      <h3>1. Pompe à chaleur Eau/Eau géothermique</h3>
      <p>
        Les pompes à chaleur eau/eau sont moins courantes, mais elles offrent une excellente efficacité, surtout dans les grands bâtiments.
        Elles puisent l'énergie dans une source d'eau naturelle (nappes phréatiques, lacs, rivières) ou dans le sol à travers des sondes
        géothermiques.
      </p>
      <p>
        Pour installer une pompe à chaleur (PAC) géothermique eau/eau dans une copropriété, il est nécessaire de disposer d'un terrain
        suffisamment vaste pour accueillir les sondes géothermiques. Ces sondes sont forées en profondeur dans le sol pour capter la
        chaleur, et l'espace disponible doit être adapté à la taille du bâtiment et aux besoins de chauffage. Les installations en milieu
        urbain peuvent être plus complexes si le terrain est limité.
      </p>
      <h4>Principe de fonctionnement</h4>
      <p>
        La PAC eau/eau capte les calories contenues dans une source d'eau ou dans le sol et les transfère à un réseau de chauffage central
        (radiateurs, planchers chauffants, etc.). Elle peut également être réversible et produire du froid en utilisant la fraicheur du sol
        ou de la nappe.
      </p>
      <h4>Avantages</h4>
      <ul>
        <li>
          <strong>Efficacité énergétique exceptionnelle</strong> : Les PAC eau/eau affichent des coefficients de performance (COP) parmi les
          plus élevés, car la température de l'eau ou du sol est plus stable que celle de l'air, même en hiver.
        </li>
        <li>
          <strong>Solution idéale pour les grands bâtiments</strong> : Elles conviennent particulièrement aux grandes copropriétés ou aux
          bâtiments ayant un accès à une source d'eau.
        </li>
        <li>
          <strong>Possibilité de rafraîchissement passif</strong> : En été, il est possible de contourner la pompe à chaleur et d'utiliser
          directement l'eau froide pour rafraîchir le bâtiment (géocooling), ce qui permet de réaliser des économies d'énergie.
        </li>
        <li>
          <strong>Aucune nuisance sonore ou visuelle</strong> : les PAC eau/eau n’ont pas d’unité extérieure. Une fois le forage effectué,
          la PAC eau/eau n’a aucun impact sur l’extérieur.
        </li>
      </ul>
      <h4>Inconvénients</h4>
      <ul>
        <li>
          <strong>Coût d'installation plus élevé</strong> : Les travaux nécessaires pour installer des forages géothermiques ou des captages
          d'eau peuvent être coûteux et nécessitent des études de faisabilité.
        </li>
        <li>
          <strong>Réglementation stricte</strong>: L'utilisation de l'eau de nappe est soumise à des régulations strictes, et il peut être
          nécessaire d'obtenir des autorisations pour l'extraction et la réinjection de l'eau.
        </li>
      </ul>
      <h3>2. Pompe à chaleur Air/Eau collective</h3>
      <p>
        La pompe à chaleur air/eau est l'une des solutions les plus populaires dans les copropriétés, notamment parce qu'elle s'adapte
        facilement aux systèmes de chauffage central existants.
      </p>
      <h4>Principe de fonctionnement</h4>
      <p>
        La PAC air/eau capte les calories de l'air extérieur et les transfère à un circuit d'eau, utilisé pour alimenter les radiateurs, les
        planchers chauffants ou les ventilo-convecteurs du bâtiment. Elle peut également produire de l'eau chaude sanitaire, ce qui en fait
        une solution complète pour les besoins en chauffage et en ECS.
      </p>
      <Image src="/img/pac_air_eau.webp" alt="schéma de fonctionnement d'une PAC air/eau" width="500" height="300" className="m-auto" />
      <em className="block text-center fr-mb-5w">
        une PAC air/eau avec l’unité extérieure soit en toiture, soit dehors au sol, soit en sous-sol.
      </em>
      <h4>Avantages</h4>
      <ul>
        <li>
          <strong>Facilité d'installation</strong> : La PAC air/eau s'installe facilement dans les copropriétés existantes, qu'il s'agisse
          de remplacer une chaudière collective ou d'améliorer un système de chauffage central. Elle nécessite néanmoins d’avoir de la place
          en extérieur pour positionner l’unité extérieure.
        </li>
        <li>
          <strong>Polyvalence</strong> : Elle est compatible avec de nombreux émetteurs de chaleur à eau (radiateurs basse température,
          planchers chauffants, etc.), ce qui permet de s'adapter aux configurations existantes.
        </li>
        <li>
          <strong>Confort thermique tout au long de l'année</strong> : Certains modèles sont réversibles, ce qui signifie qu'ils peuvent
          être utilisés pour rafraîchir les pièces en été, offrant ainsi un confort thermique optimal en toutes saisons.
        </li>
        <li>
          <strong>Efficacité énergétique</strong> : La PAC air/eau permet de diviser par trois ou quatre la consommation d'énergie par
          rapport à un chauffage électrique classique, grâce à un coefficient de performance (COP) élevé.
        </li>
      </ul>
      <h4>Inconvénients</h4>
      <ul>
        <li>
          <strong>Performance dépendante des conditions extérieures</strong>: Son efficacité diminue lorsque la température extérieure
          baisse fortement, ce qui peut nécessiter un système d'appoint pour les périodes très froides.
        </li>
        <li>
          <strong>Bruit potentiel</strong> : Les unités extérieures, qui comprennent un ventilateur, peuvent générer du bruit. Il est
          important de bien choisir leur emplacement pour minimiser les nuisances sonores.
        </li>
      </ul>
      <Image src="/img/photo_pac_air_eau.webp" alt="image d'une PAC air-eau" width="500" height="300" className="m-auto fr-mb-5w" />
      <h3>3. Pompe à chaleur Air/Air</h3>
      <p>
        La pompe à chaleur air/air, aussi appelée "climatisation réversible", utilise l'air extérieur pour chauffer ou refroidir l'air
        intérieur. Elle est particulièrement adaptée aux climats tempérés et aux bâtiments nécessitant une solution de chauffage et de
        climatisation.
      </p>
      <p>⚠️ La PAC air/air ne fait pas d’eau chaude sanitaire.</p>
      <h4>Principe de fonctionnement</h4>
      <p>
        La PAC air/air prélève les calories de l'air extérieur pour les injecter directement dans l'air intérieur. Les unités intérieures,
        placées dans les différentes pièces à chauffer ou à refroidir, diffusent la chaleur ou la fraîcheur grâce à des ventilateurs appelés
        ventilo-convecteurs.
      </p>
      <h4>Avantages</h4>
      <ul>
        <li>
          <strong>Installation simple et rapide</strong> : Les PAC air/air ne nécessitent pas de circuit hydraulique, ce qui réduit les
          travaux d'installation, surtout en rénovation.
        </li>
        <li>
          <strong>Chauffage et climatisation combinés</strong> : Les modèles réversibles permettent de chauffer en hiver et de rafraîchir en
          été avec un seul et même équipement.
        </li>
        <li>
          <strong>Régulation pièce par pièce</strong> : Chaque unité intérieure est équipée d'un thermostat, ce qui permet de régler
          individuellement la température de chaque pièce, offrant ainsi une gestion plus fine du confort.
        </li>
      </ul>
      <h4>Inconvénients</h4>
      <ul>
        <li>
          <strong>Efficacité réduite en cas de très basses températures</strong> : Les performances diminuent lorsque la température
          extérieure est très basse, ce qui peut nécessiter un chauffage d'appoint.
        </li>
        <li>
          <strong>Distribution inégale de la chaleur</strong> : La diffusion de la chaleur par air soufflé peut être moins homogène et moins
          confortable que celle d'un chauffage par radiateur ou plancher chauffant.
        </li>
        <li>
          <strong>Niveau sonore</strong> : Les unités intérieures et extérieures produisent du bruit, il est important de bien choisir leur
          emplacement pour minimiser les nuisances sonores.
        </li>
        <li>
          <strong>Ilot de chaleur</strong> : si elles sont utilisées en climatisation, les PAC air/air rejettent de la chaleur qui peut
          contribuer à créer des îlots de chaleur, surtout en zone urbaine.
        </li>
      </ul>
      <Image src="/img/photo_pac_air_air.webp" alt="image d'une PAC air-air" width="500" height="300" className="m-auto fr-pb-5w" />
      <h3>4. Pompe à chaleur Air Extrait/Eau</h3>
      <p>
        La pompe à chaleur air extrait/eau est une solution innovante qui récupère l'énergie thermique présente dans l'air vicié provenant
        du système de ventilation du bâtiment. Cette technologie permet de chauffer l'eau de manière très efficace en exploitant une source
        d'énergie renouvelable souvent sous-utilisée.
      </p>
      <p>Elle n’est possible qu’en cas de logement bien isolé, elle est envisageable en rénovation globale.</p>
      <Image
        src="/img/schema_pac_air_extrait.webp"
        alt="schéma d'une PAC air extrait"
        width="500"
        height="300"
        className="m-auto fr-pb-5w"
      />
      <h4>Principe de fonctionnement</h4>
      <p>
        Le système capte les calories de l'air extrait des pièces humides (cuisine, salle de bains, toilettes) avant qu'il ne soit expulsé à
        l'extérieur. La PAC utilise ensuite cette énergie pour chauffer un circuit d'eau, qui peut alimenter le chauffage de l’appartement
        ou produire de l'eau chaude sanitaire.
      </p>
      <h4>Avantages</h4>
      <ul>
        <li>
          <strong>Récupération d'énergie existante</strong> : La PAC air extrait/eau tire parti de l'air déjà chauffé à l'intérieur du
          bâtiment, ce qui améliore son efficacité énergétique.
        </li>
        <li>
          <strong>Stabilité des performances</strong> : L'air extrait des pièces intérieures a une température relativement stable tout au
          long de l'année, ce qui garantit un bon rendement même en hiver.
        </li>
        <li>
          <strong>Réduction de la consommation énergétique</strong> : En exploitant la chaleur présente dans l'air extrait, ce type de PAC
          permet de réduire les besoins en énergie primaire, contribuant à des économies sur les factures de chauffage.
        </li>
        <li>
          <strong>Pas d’emprise extérieure</strong> : Le système ne nécessite pas d'unité extérieure, ce qui le rend idéal pour les
          copropriétés où l'espace extérieur est limité.
        </li>
      </ul>
      <h4>Inconvénients</h4>
      <ul>
        <li>
          <strong>Nécessité d'un système de ventilation centralisé</strong> : Pour fonctionner, la PAC air extrait/eau doit être couplée à
          un système de ventilation mécanique contrôlée (VMC), ce qui peut limiter son installation dans les bâtiments qui n'en sont pas
          équipés.
        </li>
        <li>
          <strong>Puissance limitée</strong> : Cette solution convient davantage aux logements bien isolés, car la quantité de chaleur
          récupérable dépend du volume d'air extrait.
        </li>
      </ul>
      <Image src="/img/photo_pac_air_extrait.webp" alt="photo d'une PAC air extrait" width="500" height="300" className="m-auto fr-pb-5w" />
      <h3>5. Chauffe-eau Thermodynamique Air Extrait/Eau</h3>
      <p>
        Le chauffe-eau thermodynamique air extrait/eau est une variante de la pompe à chaleur air extrait, spécifiquement conçue pour la
        production d'eau chaude sanitaire. Il offre une solution efficace et économique pour répondre aux besoins d'ECS dans les logements.
      </p>
      <Image src="/img/schema_cet.webp" alt="schéma d'un chauffe-eau thermodynamique" width="500" height="300" className="m-auto" />
      <em className="block text-center fr-pb-5w">solution individuelle de production d’eau chaude sanitaire</em>
      <h4>Principe de fonctionnement</h4>
      <p>
        Ce système utilise une petite pompe à chaleur intégrée pour récupérer la chaleur de l'air extrait, qui est ensuite utilisée pour
        chauffer l'eau stockée dans un ballon. Le réseau de ventilation aspire l'air des pièces humides (cuisine, salle de bains, toilettes)
        et l'achemine vers le chauffe-eau avant de le rejeter à l'extérieur.
      </p>
      <h4>Avantages</h4>
      <ul>
        <li>
          <strong>Amélioration de l'efficacité énergétique</strong> : En récupérant la chaleur contenue dans l'air extrait, le chauffe-eau
          thermodynamique consomme beaucoup moins d'électricité qu'un chauffe-eau classique, réduisant ainsi les coûts énergétiques.
        </li>
        <li>
          <strong>Installation simple en rénovation</strong> : Ce type de chauffe-eau peut être facilement intégré dans les logements
          existants disposant d'une VMC, sans nécessiter de travaux importants.
        </li>
        <li>
          <strong>Stabilité de la performance</strong> : La température de l'air extrait reste stable toute l'année, ce qui garantit une
          production d'eau chaude efficace, indépendamment des conditions climatiques extérieures.
        </li>
        <li>
          <strong>Faible encombrement</strong>: Le chauffe-eau thermodynamique air extrait/eau s'intègre généralement dans un placard
          standard ou dans un local technique, ce qui le rend adapté aux espaces restreints.
        </li>
      </ul>
      <h4>Inconvénients</h4>
      <ul>
        <li>
          <strong>Dépendance à la VMC</strong> : Comme pour la PAC air extrait/eau, un réseau de ventilation centralisé est nécessaire pour
          capter l'air vicié, ce qui limite l'installation dans les bâtiments ne disposant pas d'une VMC.
        </li>
        <li>
          <strong>Entretien du filtre</strong> : Le bon fonctionnement du système dépend de l'entretien régulier du filtre d'air, qui doit
          être nettoyé ou remplacé pour éviter une baisse des performances.
        </li>
      </ul>
      <Image src="/img/photo_cet.webp" alt="photo d'un chauffe-eau thermodynamique" width="500" height="300" className="m-auto fr-pb-5w" />
      <h3>6. Pompe à chaleur avec capteur solaire</h3>
      <p>
        La pompe à chaleur avec capteur solaire combine une pompe à chaleur classique (généralement air/eau) et des capteurs solaires
        thermiques installés sur le toit de l'immeuble. Les capteurs captent l'énergie solaire et l'air ambiant, permettant à la pompe à
        chaleur de produire du chauffage, de l'eau chaude sanitaire, voire de rafraîchir les espaces intérieurs en été.
      </p>
      <h4>Principe de fonctionnement</h4>
      <p>
        Ce système utilise des capteurs solaires qui absorbent la chaleur du soleil et de l'air extérieur, même en l'absence de rayonnement
        solaire direct. Les calories récupérées sont transmises à un fluide caloporteur qui circule jusqu'à la pompe à chaleur, laquelle
        augmente ensuite la température pour alimenter le circuit de chauffage central ou les ballons d'eau chaude sanitaire.
      </p>
      <p>
        Les capteurs solaires hybrides, qui intègrent à la fois des cellules photovoltaïques pour la production d'électricité et un
        échangeur thermique pour la récupération de chaleur, permettent de produire à la fois de l'énergie thermique et de l'électricité
        renouvelable.
      </p>
      <h4>Avantages</h4>
      <ul>
        <li>
          <strong>Double source d'énergie renouvelable</strong> : En combinant l'énergie solaire et l'air ambiant, la pompe à chaleur
          solaire permet de maximiser l'utilisation des énergies renouvelables, réduisant encore plus la consommation d'énergie primaire.
        </li>
        <li>
          <strong>Rendement énergétique élevé</strong> : La présence de capteurs solaires améliore le coefficient de performance (COP) de la
          pompe à chaleur, surtout pendant les périodes ensoleillées. Cela permet de produire de l'eau chaude à moindre coût, même lorsque
          les températures extérieures sont basses.
        </li>
        <li>
          <strong>Réduction significative des factures énergétiques</strong> : En exploitant une source d'énergie gratuite et renouvelable,
          la pompe à chaleur solaire permet de réduire considérablement les coûts de chauffage et de production d'eau chaude.
        </li>
        <li>
          <strong>Valorisation de la copropriété</strong> : Ce type d'installation améliore l'efficacité énergétique du bâtiment et augmente
          son attractivité, en particulier pour les futurs acheteurs ou locataires qui recherchent des logements plus durables.
        </li>
      </ul>
      <h4>Inconvénients</h4>
      <ul>
        <li>
          <strong>Investissement initial plus élevé</strong> : L'installation d'une pompe à chaleur avec capteurs solaires nécessite un
          investissement plus important que les pompes à chaleur classiques, en raison du coût des capteurs et des travaux d'installation
          associés.
        </li>
        <li>
          <strong>Dépendance aux conditions d'ensoleillement</strong> : Bien que la pompe à chaleur puisse fonctionner même par temps
          nuageux, les performances des capteurs solaires sont maximisées lors des journées ensoleillées. Il est donc important de
          dimensionner correctement le système pour garantir une couverture suffisante des besoins énergétiques.
        </li>
        <li>
          <strong>Encombrement en toiture</strong> : Les capteurs solaires nécessitent un espace libre suffisant en toiture, ce qui peut
          poser problème dans les copropriétés avec une surface de toit limitée ou encombrée par d'autres équipements.
        </li>
      </ul>
      <Image src="/img/photo_pac_solaire.webp" alt="photo de panneau solaire" width="500" height="300" className="m-auto fr-pb-5w" />
      <h2>Conclusion</h2>
      <p>
        Les pompes à chaleur offrent toutes des solutions intéressantes pour la rénovation énergétique des copropriétés. Chaque système
        présente des avantages spécifiques, et le choix dépendra de plusieurs facteurs tels que les caractéristiques du bâtiment, le climat
        local, la présence d'un système de ventilation, et les besoins en chauffage et en eau chaude sanitaire.
      </p>
      <ul>
        <li>
          <strong>PAC Eau/Eau</strong> : Convient aux grands bâtiments ou aux projets avec accès à une source d'eau, offrant une efficacité
          énergétique très intéressante.
        </li>
        <li>
          <strong>PAC Air/Eau</strong> : Idéale pour les copropriétés avec un réseau de chauffage à eau et des besoins en chauffage et en
          ECS.
        </li>
        <li>
          <strong>PAC Air/Air</strong> : Solution pratique pour le chauffage et la climatisation des bâtiments ne nécessitant pas de circuit
          hydraulique.
        </li>
        <li>
          <strong>PAC Air Extrait/Eau</strong> : Solution efficace pour les bâtiments avec VMC centralisée, exploitant la chaleur de l'air
          extrait.
        </li>
        <li>
          <strong>Chauffe-eau Thermodynamique Air Extrait/Eau</strong> : Option économique et performante pour la production d'eau chaude
          sanitaire dans les logements individuels.
        </li>
        <li>
          <strong>PAC avec Capteur Solaire</strong> : Maximisation de l'utilisation des énergies renouvelables, avec un rendement amélioré
          grâce à l'énergie solaire.
        </li>
      </ul>
      <p>
        Ces systèmes, en fonction de leur configuration, peuvent significativement améliorer l'efficacité énergétique, le confort thermique
        et la valeur patrimoniale de la copropriété.
      </p>
    </>
  );
}

export default PacImmeubleUsage;
