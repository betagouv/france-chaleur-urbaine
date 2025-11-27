# Exécution de la Migration - Bug PDP id_fcu

## 📋 Prérequis

1. **Backup de la base de données**
   ```bash
   # Se connecter à la base de données
   psql -d france_chaleur_urbaine

   # Créer la table de backup
   CREATE TABLE pro_eligibility_tests_addresses_backup_20251127 AS
   SELECT * FROM pro_eligibility_tests_addresses;
   ```

2. **Vérifier que le code est à jour**
   - Le fix du code source doit être appliqué (PR #1164)
   - Le script de migration doit être présent

## 🚀 Exécution du Script

### 1. Test en mode Dry-Run (recommandé)

Avant d'appliquer les modifications, testez en mode dry-run pour voir combien d'adresses seraient affectées :

```bash
pnpm tsx src/modules/pro-eligibility-tests/commands/fix-pdp-id-fcu.ts --dry-run
```

**Sortie attendue :**
```
🔧 Correction des id_fcu incorrects pour les adresses PDP
Mode: 🔍 DRY RUN (aucune modification)

📍 ÉTAPE 1: Correction via id_sncu...
✅ 2431 adresses corrigées via id_sncu

🗺️  ÉTAPE 2: Correction via nom + géolocalisation...
✅ 21 adresses corrigées via nom + géo

🔄 ÉTAPE 3: Recalcul complet pour les adresses non corrigées...
   Trouvé 26 adresses à recalculer
✅ 26 adresses recalculées

📊 RÉSUMÉ:
   - Corrigées via id_sncu: 2431
   - Corrigées via nom+géo: 21
   - Recalculées: 26
   - TOTAL: 2478

⚠️  Aucune modification effectuée (mode dry-run)
   Relancez sans --dry-run pour appliquer les changements
```

### 2. Application des modifications

Une fois le dry-run validé, appliquez les changements :

```bash
pnpm tsx src/modules/pro-eligibility-tests/commands/fix-pdp-id-fcu.ts
```

**⚠️ Attention :** Cette commande va modifier la base de données !

## 🔍 Validation Post-Migration

### 1. Vérifier le nombre de modifications

```sql
-- Compter les différences avant/après
SELECT
  COUNT(*) as nb_adresses_pdp,
  COUNT(CASE
    WHEN backup.eligibility_history != current.eligibility_history
    THEN 1
  END) as nb_modifiees,
  COUNT(CASE
    WHEN backup.eligibility_history = current.eligibility_history
    THEN 1
  END) as nb_inchangees
FROM pro_eligibility_tests_addresses_backup_20251127 backup
JOIN pro_eligibility_tests_addresses current ON current.id = backup.id
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(backup.eligibility_history) as h
  WHERE h->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
);
```

**Résultat attendu :** ~2478 adresses modifiées

### 2. Vérifier la diversité des id_fcu

```sql
-- Avant vs Après
SELECT
  'AVANT' as periode,
  COUNT(DISTINCT history_item->'eligibility'->>'id_fcu') as nb_id_fcu_distincts
FROM pro_eligibility_tests_addresses_backup_20251127,
  jsonb_array_elements(eligibility_history) as history_item
WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')

UNION ALL

SELECT
  'APRES' as periode,
  COUNT(DISTINCT history_item->'eligibility'->>'id_fcu') as nb_id_fcu_distincts
FROM pro_eligibility_tests_addresses,
  jsonb_array_elements(eligibility_history) as history_item
WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur');
```

**Résultat attendu :** Augmentation significative du nombre d'id_fcu distincts

### 3. Exemples de corrections

```sql
-- Voir quelques exemples
SELECT
  current.source_address,
  backup_item->'eligibility'->>'id_sncu' as id_sncu,
  backup_item->'eligibility'->>'id_fcu' as id_fcu_avant,
  current_item->'eligibility'->>'id_fcu' as id_fcu_apres,
  current_item->'eligibility'->>'nom' as nom_reseau
FROM pro_eligibility_tests_addresses_backup_20251127 backup
JOIN pro_eligibility_tests_addresses current ON current.id = backup.id
CROSS JOIN LATERAL jsonb_array_elements(backup.eligibility_history) WITH ORDINALITY as backup_item
CROSS JOIN LATERAL jsonb_array_elements(current.eligibility_history) WITH ORDINALITY as current_item
WHERE backup_item.ordinality = current_item.ordinality
  AND backup_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
  AND backup_item->'eligibility'->>'id_fcu' != current_item->'eligibility'->>'id_fcu'
LIMIT 20;
```

## 🔙 Rollback (si nécessaire)

En cas de problème, restaurer depuis la sauvegarde :

```sql
-- Restaurer les données
UPDATE pro_eligibility_tests_addresses peta
SET eligibility_history = backup.eligibility_history
FROM pro_eligibility_tests_addresses_backup_20251127 backup
WHERE peta.id = backup.id;
```

## 🧹 Nettoyage

Une fois la migration validée (attendre 1-2 semaines), supprimer la sauvegarde :

```sql
DROP TABLE pro_eligibility_tests_addresses_backup_20251127;
```

## ⚠️ Troubleshooting

### Le script échoue avec "Cannot read property 'id_fcu'"

**Cause :** Certaines adresses n'ont pas de géométrie valide.

**Solution :** Le script ignore automatiquement ces cas avec un warning.

### Le recalcul prend trop de temps

**Cause :** L'étape 3 (recalcul) fait des appels API pour chaque adresse.

**Solution :** C'est normal pour ~26 adresses. Compter environ 1-2 secondes par adresse.

### Nombre de modifications différent de l'attendu

**Cause :** Les données ont peut-être changé depuis l'analyse.

**Solution :** Vérifier avec le dry-run avant d'appliquer, et comparer avec les statistiques attendues.

## 📊 Métriques de Succès

- ✅ 99% des adresses PDP corrigées
- ✅ Diversité des id_fcu augmentée
- ✅ Aucune erreur pendant l'exécution
- ✅ Validation SQL conforme aux attentes

## 🔗 Références

- [Analyse et Plan de Correction](./analyse-et-plan-correction.md)
- [PR #1164](https://github.com/betagouv/france-chaleur-urbaine/pull/1164)
- Script : `src/modules/pro-eligibility-tests/commands/fix-pdp-id-fcu.ts`
