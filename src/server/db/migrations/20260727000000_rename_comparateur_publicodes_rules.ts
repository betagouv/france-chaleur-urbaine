import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';
import type { Kysely } from 'kysely';

import { createLogger } from '@/server/helpers/logger';

const logger = createLogger('migration:rename_comparateur_publicodes_rules');

/**
 * Renomme les clés publicodes des configurations du comparateur enregistrées par les utilisateurs.
 *
 * La réorganisation du modèle publicodes a fusionné les namespaces historiques
 * (`Bilan x …`, `Calcul Eco …`, `ratios …`, `Paramètres économiques …`) en
 * `<mode> . <section> . <champ>` et la couche de compatibilité a été supprimée ; puis la
 * réorganisation des racines (84 → 41) a supprimé les clés d'entrée restées à la racine
 * (`type de bâtiment`, `DPE`, `Inclure la climatisation`…) au profit des namespaces
 * `bâtiment . `, `climat . `, `besoins . `, `ecs . `, `climatisation . `, et vidé
 * `ratios . `, `Calcul Eco . ` et `Paramètres économiques . `.
 *
 * Sans ce renommage, les situations stockées lèvent une erreur au chargement (clé inconnue).
 *
 * Table dérivée de compat.publicodes et des tables de renommage du modèle. Les clés
 * absentes de la table sont conservées telles quelles (elles existent toujours).
 * Les cibles sont typées `RuleName` : une clé qui n'existe plus dans le modèle casse
 * la compilation au lieu de passer inaperçue.
 */
const renamedRules: Record<string, RuleName> = {
  'augmenter la température de chauffe': 'bâtiment . augmenter la température de chauffe',
  'besoins chauffage par appartement': 'besoins . chauffage par logement',
  'besoins eau chaude sanitaire par appartement': 'besoins . ECS par logement',
  'besoins en climatisation par appartement': 'besoins . climatisation par logement',
  "Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part abonnement": 'combustibles . réseau de chaleur . abonnement',
  "Calcul Eco . Coût d'achat du combustible . Chaleur RCU x Part consommation": 'combustibles . réseau de chaleur . consommation',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe eau glacée tertiaire":
    'climatisation additionnelle . entretien groupe eau glacée tertiaire',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe eau glacée tertiaire . gros entretien P3":
    'climatisation additionnelle . entretien groupe eau glacée tertiaire . gros entretien P3',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe eau glacée tertiaire . gros entretien P3 par logement tertiaire":
    'climatisation additionnelle . entretien groupe eau glacée tertiaire . gros entretien P3 par logement tertiaire',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe eau glacée tertiaire . petit entretien P2":
    'climatisation additionnelle . entretien groupe eau glacée tertiaire . petit entretien P2',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe eau glacée tertiaire . petit entretien P2 par logement tertiaire":
    'climatisation additionnelle . entretien groupe eau glacée tertiaire . petit entretien P2 par logement tertiaire',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe froid résidentiel": 'climatisation additionnelle . entretien groupe froid résidentiel',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe froid résidentiel . gros entretien P3":
    'climatisation additionnelle . entretien groupe froid résidentiel . gros entretien P3',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe froid résidentiel . gros entretien P3 par logement tertiaire":
    'climatisation additionnelle . entretien groupe froid résidentiel . gros entretien P3 par logement tertiaire',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe froid résidentiel . petit entretien P2":
    'climatisation additionnelle . entretien groupe froid résidentiel . petit entretien P2',
  "Calcul Eco . P2 P3 Coût de l'entretien . Groupe froid résidentiel . petit entretien P2 par logement tertiaire":
    'climatisation additionnelle . entretien groupe froid résidentiel . petit entretien P2 par logement tertiaire',
  'caractéristique réseau de chaleur': 'réseau de chaleur . caractéristiques',
  'caractéristique réseau de chaleur . contenu CO2': 'réseau de chaleur . caractéristiques . contenu CO2',
  'caractéristique réseau de chaleur . contenu CO2 ACV': 'réseau de chaleur . caractéristiques . contenu CO2 ACV',
  'caractéristique réseau de chaleur . livraisons totales': 'réseau de chaleur . caractéristiques . livraisons totales',
  'caractéristique réseau de chaleur . part fixe': 'réseau de chaleur . caractéristiques . part fixe',
  'caractéristique réseau de chaleur . part variable': 'réseau de chaleur . caractéristiques . part variable',
  'caractéristique réseau de chaleur . prix moyen': 'réseau de chaleur . caractéristiques . prix moyen',
  'caractéristique réseau de chaleur . production totale': 'réseau de chaleur . caractéristiques . production totale',
  'caractéristique réseau de chaleur . taux EnRR': 'réseau de chaleur . caractéristiques . taux EnRR',
  'caractéristique réseau de froid': 'réseau de froid . caractéristiques',
  'caractéristique réseau de froid . contenu CO2': 'réseau de froid . caractéristiques . contenu CO2',
  'caractéristique réseau de froid . contenu CO2 ACV': 'réseau de froid . caractéristiques . contenu CO2 ACV',
  'caractéristique réseau de froid . livraisons totales': 'réseau de froid . caractéristiques . livraisons totales',
  'caractéristique réseau de froid . part fixe': 'réseau de froid . caractéristiques . part fixe',
  'caractéristique réseau de froid . prix moyen': 'réseau de froid . caractéristiques . prix moyen',
  'caractéristique réseau de froid . production totale': 'réseau de froid . caractéristiques . production totale',
  'code département': 'climat . code département',
  'coefficient intermittence': 'dimensionnement . coefficient intermittence',
  'consommation spécifique chauffage': 'besoins . consommation spécifique chauffage',
  'consommation spécifique climatisation': 'besoins . consommation spécifique climatisation',
  'consommation spécifique ECS': 'besoins . consommation spécifique ECS',
  'contenu CO2 réseau de chaleur': 'réseau de chaleur . environnement . contenu CO2 net',
  DPE: 'bâtiment . DPE',
  'degré jours unifié spécifique chaud': 'climat . degré jours chaud',
  'degré jours unifié spécifique froid': 'climat . degré jours froid',
  'Inclure la climatisation': 'climatisation . incluse',
  'Installation x PAC air-air x Collectif . gamme de puissance existante': 'PAC air-air coll . installation . puissance retenue',
  'Installation x Réseaux de chaleur x Collectif . gamme de puissance existante': 'réseau de chaleur . installation . puissance retenue',
  'Investissement x frais de raccordement au réseaux x RCU': 'réseau de chaleur . ratios . frais de raccordement',
  'Investissement x Groupe eau glacée x tertiaire': 'climatisation additionnelle . coût équipement groupe eau glacée tertiaire',
  'Investissement x Groupe froid x résidentiel': 'climatisation additionnelle . coût équipement groupe froid résidentiel',
  'méthode de calcul pour les besoins en chauffage et refroidissement': 'bâtiment . méthode de calcul',
  'méthode résidentiel': 'bâtiment . méthode résidentiel',
  'méthode tertiaire': 'bâtiment . méthode tertiaire',
  'méthode tertiaire 2026': 'bâtiment . méthode tertiaire 2026',
  "Nombre d'habitants moyen par appartement": 'bâtiment . habitants par logement',
  'nom département': 'climat . nom département',
  "nombre de logements dans l'immeuble concerné": 'bâtiment . nombre de logements',
  'normes thermiques et âge du bâtiment': 'bâtiment . normes thermiques et âge',
  'normes thermiques tertiaire': 'bâtiment . normes thermiques tertiaire',
  'Paramètres économiques . Aides . Aides x Éligible CEE': 'aides . éligibilité . éligible CEE',
  'Paramètres économiques . Aides . Aides x Éligible Coup de pouce chauffage': 'aides . éligibilité . éligible coup de pouce',
  "Paramètres économiques . Aides . Aides x Éligible Ma prime renov'": 'aides . éligibilité . éligible ma prime rénov',
  'Paramètres économiques . Aides . Valeur CEE': 'aides . valeur CEE',
  "Paramètres économiques . Aides . Éligibilité x Je dispose actuellement d'une chaudière gaz ou fioul":
    'aides . éligibilité . chaudière gaz ou fioul actuelle',
  'Paramètres économiques . Aides . Éligibilité x Je suis un particulier': 'aides . éligibilité . particulier',
  'Paramètres économiques . Aides . Éligibilité x Prise en compte des aides': 'aides . éligibilité . prise en compte des aides',
  'Paramètres économiques . Aides . Éligibilité x Ressources du ménage': 'aides . éligibilité . ressources du ménage',
  'Paramètres économiques . Electricité x Consommation Part variable en heure creuse':
    'combustibles . électricité . part variable heure creuse',
  'Paramètres économiques . Electricité x Consommation Part variable en heure pleine':
    'combustibles . électricité . part variable heure pleine',
  'Paramètres économiques . Electricité x Option tarifaire': 'combustibles . électricité . option tarifaire',
  'Paramètres économiques . Electricité x Taxe . Part Fixe x TVA': 'combustibles . électricité . taxes . Part Fixe x TVA',
  "Paramètres économiques . Electricité x Taxe . Part Variable x Accise sur l'électricité ex TIPCSE CSPE":
    "combustibles . électricité . taxes . Part Variable x Accise sur l'électricité ex TIPCSE CSPE",
  'Paramètres économiques . Gaz x Abonnement x Part Fixe TTC collectif ou tertiaire':
    'combustibles . gaz . abonnement part fixe collectif ou tertiaire',
  'Paramètres économiques . Gaz x Abonnement x Part Fixe TTC individuel': 'combustibles . gaz . abonnement part fixe individuel',
  'Paramètres économiques . Gaz x Consommation x Part Variable TTC': 'combustibles . gaz . consommation part variable TTC',
  'Paramètres économiques . Gaz x Coût de la molécule HT': 'combustibles . gaz . coût de la molécule HT',
  'Paramètres économiques . Gaz x Coût de transport HT': 'combustibles . gaz . coût de transport HT',
  'Paramètres économiques . Gaz x Coût des CEE HT': 'combustibles . gaz . coût des CEE HT',
  'Paramètres économiques . Gaz x Coût distribution HT': 'combustibles . gaz . coût distribution HT',
  'Paramètres économiques . Gaz x Puissance souscrite pour calcul installation collective ou tertiaire':
    'combustibles . gaz . puissance souscrite collectif ou tertiaire',
  "Paramètres économiques . Gaz x Taxe x Part fixe x Contribution tarifaire d'acheminement CTA": 'combustibles . gaz . taxes . CTA',
  'Paramètres économiques . Gaz x Taxe x Part fixe x TVA': 'combustibles . gaz . taxes . TVA part fixe',
  'Paramètres économiques . Gaz x Taxe x Part variable x Taxe intérieure de consommation sur le gaz naturel TICGN':
    'combustibles . gaz . taxes . TICGN',
  'Paramètres économiques . Gaz x Taxe x Part variable x TVA': 'combustibles . gaz . taxes . TVA part variable',
  'Paramètres économiques . Gros entretien P3 . Gaz coll avec cond': 'gaz coll avec cond . ratios . gros entretien P3',
  'Paramètres économiques . Gros entretien P3 . RCU': 'réseau de chaleur . ratios . gros entretien P3',
  'Paramètres économiques . Gros entretien P3 . TVA': 'investissement . TVA gros entretien P3',
  'Paramètres économiques . Petit entretien P2 . Gaz coll avec cond': 'gaz coll avec cond . ratios . petit entretien P2',
  'Paramètres économiques . Petit entretien P2 . Gaz indiv avec cond': 'gaz indiv avec cond . ratios . petit entretien P2',
  'Paramètres économiques . Petit entretien P2 . Gaz indiv sans cond': 'gaz indiv sans cond . ratios . petit entretien P2',
  'Paramètres économiques . Petit entretien P2 . RCU': 'réseau de chaleur . ratios . petit entretien P2',
  'Paramètres économiques . Petit entretien P2 . TVA': 'investissement . TVA petit entretien P2',
  'Paramètres économiques . Réseaux chaleur . Coût': 'combustibles . réseau de chaleur . coût',
  'Paramètres économiques . Réseaux chaleur . Part fixe': 'combustibles . réseau de chaleur . part fixe',
  'Part de la surface à climatiser': 'bâtiment . part de la surface à climatiser',
  'Production eau chaude sanitaire': 'ecs . production',
  'Puissance installation x Capacité chauffe eau électrique à accumulation': 'ecs additionnelle . capacité du ballon électrique',
  'ratios . GAZ IND COND Conso auxiliaire chauffage': 'gaz indiv avec cond . ratios . conso auxiliaire chauffage',
  'ratios . GAZ IND COND Conso auxiliaire ECS': 'gaz indiv avec cond . ratios . conso auxiliaire ECS',
  'ratios . GNRL Appartement ou maison': 'bâtiment . appartement ou maison',
  'ratios . GNRL DJU REF chaud': 'climat . ratios . DJU de référence chaud',
  'ratios . GNRL Hauteur': 'bâtiment . ratios . hauteur sous plafond',
  "ratios . GNRL Nombre de logement dans l'immeuble concerné": 'bâtiment . ratios . nombre de logements',
  'ratios . GNRL Nombre habitant par logement': 'bâtiment . ratios . habitants par logement',
  'ratios . GNRL Part surface à climatiser résidentiel': 'bâtiment . ratios . part surface à climatiser résidentiel',
  'ratios . GNRL Part surface à climatiser tertiaire': 'bâtiment . ratios . part surface à climatiser tertiaire',
  'ratios . GNRL Production ECS': 'ecs . ratios . production par défaut',
  'ratios . GNRL Surface de référence appartement': 'bâtiment . ratios . surface de référence appartement',
  'ratios . GNRL Surface de référence tertiaire': 'bâtiment . ratios . surface de référence tertiaire',
  'ratios . PAC AIR AIR Durée de vie coll': 'PAC air-air coll . ratios . durée de vie',
  'ratios . PAC AIR EAU Durée de vie coll': 'PAC air-eau coll . ratios . durée de vie',
  'ratios . PAC AIR EAU SCOP coll': 'PAC air-eau coll . ratios . SCOP',
  'ratios . PAC GNRL Conso auxiliaire chauffage climatisation hors PAC air-air': 'pac . conso auxiliaire chauffage climatisation',
  'ratios . PAC GNRL Conso auxiliaire ECS hors PAC air-air': 'pac . conso auxiliaire ECS',
  'ratios . PAC GNRL SCOP mini': 'pac . SCOP mini',
  'ratios . PUIS Coefficient de foisonnement chauffage collectif':
    'dimensionnement . ratios . coefficient de foisonnement chauffage collectif',
  'ratios . PUIS Coefficient de foisonnement ECS': 'dimensionnement . ratios . coefficient de foisonnement ECS',
  'ratios . PUIS Facteur de surpuissance': 'dimensionnement . ratios . facteur de surpuissance',
  'ratios . PUIS Nombre heure de fonctionnement non climatique ECS':
    'dimensionnement . ratios . heures de fonctionnement non climatique ECS',
  'ratios . PUIS Température de non chauffage': 'dimensionnement . ratios . température de non chauffage',
  'ratios . RCU Durée avant renouvellement': 'réseau de chaleur . ratios . durée avant renouvellement',
  'ratios économiques . Amortissement x Taux actualisation': 'amortissement . taux actualisation',
  'ratios économiques . Chauffe-eau x panneaux solaire thermique x coût investissement': 'ecs additionnelle . coût des panneaux solaires',
  'ratios économiques . Chauffe-eau x solaire x coût investissement': 'ecs additionnelle . coût du chauffe-eau solaire',
  'ratios économiques . Chauffe-eau x électrique à accumulation x coût investissement':
    'ecs additionnelle . coût du chauffe-eau électrique',
  'ratios économiques . Gaz x coll avec cond': 'gaz coll avec cond . ratios . investissement équipement',
  'ratios économiques . Gaz x indiv avec cond': 'gaz indiv avec cond . ratios . investissement équipement',
  "ratios économiques . Investissement x Pose et mise en place de l'installation": 'investissement . pose et mise en place',
  'ratios économiques . Investissement x TVA': 'investissement . TVA',
  'ratios économiques . PAC x air-eau réversible x Collectif': 'PAC air-eau coll . ratios . investissement équipement',
  'ratios économiques . Radiateur électrique x Individuel x investissement total':
    'radiateur électrique . ratios . investissement équipement',
  'sous zone climatique': 'climat . sous zone',
  'surface logement type tertiaire': 'bâtiment . surface tertiaire',
  'Température émetteurs': 'bâtiment . température émetteurs',
  'température de référence chaud': 'climat . température de référence chaud',
  'température de référence chaud commune': 'climat . température de référence chaud commune',
  'température émetteurs delta': 'pac . température émetteurs delta',
  'type de bâtiment': 'bâtiment . type',
  'type de production de froid': 'climatisation . type de production',
  'type de production ECS': 'ecs . type de production',
  'volume du ballon ECS': 'ecs additionnelle . volume du ballon',
  'zone climatique': 'climat . zone',
};

export async function up(db: Kysely<any>): Promise<void> {
  const configurations = await db.selectFrom('pro_comparateur_configurations').select(['id', 'name', 'situation']).execute();

  const migrations = configurations
    .map((configuration) => {
      const situation = configuration.situation as Record<string, unknown>;
      const renamedKeys = Object.keys(situation).filter((key) => key in renamedRules);
      if (renamedKeys.length === 0) {
        return null;
      }
      const migratedSituation = Object.fromEntries(Object.entries(situation).map(([key, value]) => [renamedRules[key] ?? key, value]));
      return { configuration, migratedSituation, renamedKeys, situation };
    })
    .filter((migration) => migration !== null);

  migrations
    .flatMap(({ configuration, renamedKeys, situation }) =>
      renamedKeys.map((key) => ({
        configurationId: configuration.id,
        configurationName: configuration.name,
        from: key,
        to: renamedRules[key],
        value: situation[key],
      }))
    )
    .forEach((renamedValue) => logger.info('renomme une clé', renamedValue));

  await Promise.all(
    migrations.map(({ configuration, migratedSituation }) =>
      db
        .updateTable('pro_comparateur_configurations')
        .set({ situation: JSON.stringify(migratedSituation) })
        .where('id', '=', configuration.id)
        .execute()
    )
  );

  const renamedValuesCount = migrations.reduce((total, migration) => total + migration.renamedKeys.length, 0);
  logger.info('migration terminée', {
    configurationsMigrated: migrations.length,
    configurationsTotal: configurations.length,
    renamedValuesCount,
  });
}

export async function down(): Promise<void> {
  // Irréversible : les anciennes clés n'existent plus dans le modèle publicodes.
}
