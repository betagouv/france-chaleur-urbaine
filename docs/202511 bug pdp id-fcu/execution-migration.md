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

## 🎯 Choix de la Méthode

### Option 1 : Recalcul Complet (Recommandé) ⭐

**Script :** `recalculate-pdp-eligibility.ts`

**Avantages :**
- ✅ Plus simple et plus fiable
- ✅ Garantit des données 100% correctes
- ✅ Pas de risque d'erreur de mapping

**Inconvénients :**
- ⏱️ Plus lent (~2-3 secondes par adresse, ~2h pour 2478 adresses)

**Quand utiliser :**
- Si vous avez le temps
- Si vous voulez la solution la plus sûre
- Pour garantir la cohérence des données

### Option 2 : Correction Ciblée (Rapide)

**Script :** `fix-pdp-id-fcu.ts`

**Avantages :**
- ⚡ Très rapide (quelques secondes pour 99% des adresses)
- ✅ Corrige 99% des cas automatiquement

**Inconvénients :**
- ⚠️ Plus complexe
- ⚠️ 1% des adresses nécessitent un recalcul complet

**Quand utiliser :**
- Si vous devez être rapide
- Si un taux de correction de 99% est acceptable
- Pour une correction d'urgence

## 🚀 Option 1 : Recalcul Complet (Recommandé)

### 1. Test sur un échantillon (recommandé)

Testez d'abord sur un petit nombre d'adresses pour vérifier que tout fonctionne :

```bash
# Tester sur 10 adresses seulement
pnpm tsx src/modules/pro-eligibility-tests/commands/recalculate-pdp-eligibility.ts --limit=10
```

**Sortie attendue :**
```
🔄 Recalcul de l'éligibilité pour les adresses PDP
Mode: ✍️  ÉCRITURE
Limite: 10 adresses

📍 Recherche des adresses PDP...
✅ 2478 adresses trouvées

🔄 Recalcul de l'éligibilité...

[1/10] ✅ Rue Robespierre 33400 Talence
[2/10] ✅ 10 Avenue du Pontet 33600 Pessac
...
[10/10] ✅ Rue Odilon Redon 33400 Talence

📊 RÉSUMÉ:
   - Total traité: 10
   - Succès: 10
   - Erreurs: 0
   - Ignorés: 0

⚠️  Seulement 10 adresses sur 2478 ont été traitées
   Relancez sans --limit pour traiter toutes les adresses
```

### 2. Test en mode Dry-Run (optionnel)

Pour voir ce qui serait fait sans modifier la base :

```bash
pnpm tsx src/modules/pro-eligibility-tests/commands/recalculate-pdp-eligibility.ts --dry-run --limit=10
```

### 3. Application sur toutes les adresses

Une fois les tests validés, lancez sur toutes les adresses :

```bash
pnpm tsx src/modules/pro-eligibility-tests/commands/recalculate-pdp-eligibility.ts
```

**⚠️ Attention :**
- Cette commande va modifier la base de données
- Durée estimée : ~2 heures pour 2478 adresses
- Le script fait une pause toutes les 10 adresses pour ne pas surcharger l'API

**💡 Astuce :** Vous pouvez relancer le script si besoin, il traitera toutes les adresses à chaque fois (idempotent).

## 🚀 Option 2 : Correction Ciblée (Rapide)

### 1. Test en mode Dry-Run

```bash
pnpm tsx src/modules/pro-eligibility-tests/commands/fix-pdp-id-fcu.ts --dry-run
```

### 2. Application

```bash
pnpm tsx src/modules/pro-eligibility-tests/commands/fix-pdp-id-fcu.ts
```

**⚠️ Attention :** Beaucoup plus rapide (~1 minute) mais nécessite une validation SQL manuelle.

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
