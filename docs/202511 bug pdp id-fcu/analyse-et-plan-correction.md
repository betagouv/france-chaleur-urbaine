# Bug : id_fcu incorrect pour les adresses PDP

## 📋 Résumé

Un bug a été identifié dans le calcul de l'éligibilité pour les adresses situées dans un Périmètre de Développement Prioritaire (PDP). Le champ `id_fcu` utilisait `pdp.id_fcu` au lieu de `networkInfos.id_fcu`, conduisant à des valeurs incorrectes dans l'historique d'éligibilité.

## 🐛 Description du Bug

### Localisation
- **Fichier** : `src/server/services/addresseInformation.ts`
- **Ligne** : 562
- **Code incorrect** :
```typescript
// Dans un PDP
if (pdp) {
  const networkInfos = await findPDPAssociatedNetwork(pdp, lat, lon);
  return {
    communes: pdp.communes ?? [],
    distance: networkInfos?.distance ?? 0,
    id_fcu: pdp.id_fcu,  // ❌ INCORRECT
    id_sncu: pdp['Identifiant reseau'] ?? '',
    nom: networkInfos?.nom_reseau ?? '',
    tags: networkInfos?.tags ?? [],
    type: networkInfos?.type === 'existant' ? 'dans_pdp_reseau_existant' : 'dans_pdp_reseau_futur',
  };
}
```

### Explication
Le code récupère `networkInfos` via `findPDPAssociatedNetwork()` qui contient le bon `id_fcu` du réseau associé, mais utilise ensuite `pdp.id_fcu` qui est l'ID du PDP lui-même, pas du réseau.

## 📊 Impact

### Données Affectées
| Type | Total | Avec id_sncu | Sans id_sncu |
|------|-------|--------------|--------------|
| PDP existants (`dans_pdp_reseau_existant`) | 2 210 | 2 208 (99.9%) | 2 (0.1%) |
| PDP futurs (`dans_pdp_reseau_futur`) | 268 | 237 (88.4%) | 31 (11.6%) |
| **TOTAL** | **2 478** | **2 445 (98.7%)** | **33 (1.3%)** |

### Exemples d'Erreurs
| Réseau | id_sncu | id_fcu Incorrect | id_fcu Correct | Écart |
|--------|---------|------------------|----------------|-------|
| Paris et communes limitrophes | 7501C | 28 | 21 | -7 |
| Réseau de Lyon | 6905C | 159 | 592 | +433 |
| Strasbourg Centre Energies | 6703C | 213 | 258 | +45 |
| Réseau de Bagneux-Chatillon | 9236C | 138 | 582 | +444 |

## ✅ Possibilité de Correction

### Récupération via id_sncu
Les `id_fcu` corrects peuvent être récupérés via une jointure entre `pro_eligibility_tests_addresses.eligibility_history[].eligibility.id_sncu` et `reseaux_de_chaleur."Identifiant reseau"`.

| Type | Corrigeable | Non-corrigeable | Taux de récupération |
|------|-------------|-----------------|---------------------|
| PDP existants | 2 208 | 2 | 99.9% |
| PDP futurs (avec id_sncu) | 223 | 14 | 94.1% |
| PDP futurs (sans id_sncu) | 0 | 31 | 0% |
| **TOTAL** | **2 431** | **47** | **98.1%** |

### Cas Non-Récupérables (47 adresses)
1. **2 PDP existants** : Pas d'id_sncu dans l'historique
2. **14 PDP futurs** : id_sncu présent mais non trouvé dans `reseaux_de_chaleur`
3. **31 PDP futurs** : Pas d'id_sncu dans l'historique

## 🔧 Plan de Correction

### Étape 1 : Fixer le Code Source

```typescript
// src/server/services/addresseInformation.ts:558-567
if (pdp) {
  const networkInfos = await findPDPAssociatedNetwork(pdp, lat, lon);
  return {
    communes: pdp.communes ?? [],
    distance: networkInfos?.distance ?? 0,
    id_fcu: networkInfos?.id_fcu ?? pdp.id_fcu, // ✅ CORRECT avec fallback
    id_sncu: pdp['Identifiant reseau'] ?? '',
    nom: networkInfos?.nom_reseau ?? '',
    tags: networkInfos?.tags ?? [],
    type: networkInfos?.type === 'existant' ? 'dans_pdp_reseau_existant' : 'dans_pdp_reseau_futur',
  };
}
```

### Étape 2 : Migration de Données

#### 2.1 Backup de Sécurité
```sql
-- Créer une sauvegarde de la table avant modification
CREATE TABLE pro_eligibility_tests_addresses_backup_20251127 AS
SELECT * FROM pro_eligibility_tests_addresses;
```

#### 2.2 Correction des Données
```sql
-- Migration pour corriger les id_fcu dans eligibility_history
-- Affecte 2 431 adresses sur 2 478 (98.1%)

WITH corrected_history AS (
  SELECT
    peta.id,
    jsonb_agg(
      CASE
        -- Corriger uniquement les PDP avec id_sncu valide et correspondance trouvée
        WHEN
          item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
          AND item->'eligibility'->>'id_sncu' IS NOT NULL
          AND item->'eligibility'->>'id_sncu' != ''
          AND rdc.id_fcu IS NOT NULL
        THEN
          jsonb_set(
            item,
            '{eligibility,id_fcu}',
            to_jsonb(rdc.id_fcu::text),
            true
          )
        -- Garder les autres entrées inchangées
        ELSE item
      END
      ORDER BY ordinality
    ) as new_history
  FROM pro_eligibility_tests_addresses peta
  CROSS JOIN LATERAL jsonb_array_elements(peta.eligibility_history) WITH ORDINALITY as item
  LEFT JOIN reseaux_de_chaleur rdc
    ON rdc."Identifiant reseau" = item->'eligibility'->>'id_sncu'
  WHERE EXISTS (
    SELECT 1
    FROM jsonb_array_elements(peta.eligibility_history) as h
    WHERE h->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
  )
  GROUP BY peta.id
)
UPDATE pro_eligibility_tests_addresses peta
SET eligibility_history = ch.new_history
FROM corrected_history ch
WHERE peta.id = ch.id;
```

#### 2.3 Identifier les Cas Non-Corrigés
```sql
-- Lister les 47 adresses qui n'ont pas pu être corrigées
-- Pour investigation manuelle

SELECT
  peta.id,
  peta.source_address,
  peta.ban_address,
  history_item->'eligibility'->>'id_sncu' as id_sncu,
  history_item->'eligibility'->>'id_fcu' as id_fcu_incorrect,
  history_item->'eligibility'->>'nom' as nom_reseau,
  history_item->'eligibility'->>'type' as type,
  CASE
    WHEN history_item->'eligibility'->>'id_sncu' IS NULL
      OR history_item->'eligibility'->>'id_sncu' = ''
    THEN 'Pas d''id_sncu'
    ELSE 'id_sncu non trouvé dans reseaux_de_chaleur'
  END as raison_non_corrige
FROM pro_eligibility_tests_addresses peta
CROSS JOIN jsonb_array_elements(peta.eligibility_history) as history_item
LEFT JOIN reseaux_de_chaleur rdc
  ON rdc."Identifiant reseau" = history_item->'eligibility'->>'id_sncu'
WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')
  AND rdc.id_fcu IS NULL
ORDER BY type, raison_non_corrige;
```

### Étape 3 : Validation Post-Migration

#### 3.1 Vérifier le Nombre d'Entrées Modifiées
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

#### 3.2 Vérifier la Distribution des id_fcu
```sql
-- Vérifier que la diversité des id_fcu a augmenté (signe de correction)
SELECT
  'AVANT' as periode,
  COUNT(DISTINCT history_item->'eligibility'->>'id_fcu') as nb_id_fcu_distincts,
  COUNT(*) as nb_total_entrees
FROM pro_eligibility_tests_addresses_backup_20251127,
  jsonb_array_elements(eligibility_history) as history_item
WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur')

UNION ALL

SELECT
  'APRES' as periode,
  COUNT(DISTINCT history_item->'eligibility'->>'id_fcu') as nb_id_fcu_distincts,
  COUNT(*) as nb_total_entrees
FROM pro_eligibility_tests_addresses,
  jsonb_array_elements(eligibility_history) as history_item
WHERE history_item->'eligibility'->>'type' IN ('dans_pdp_reseau_existant', 'dans_pdp_reseau_futur');
```

#### 3.3 Exemples de Corrections Effectuées
```sql
-- Montrer quelques exemples de corrections réussies
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

### Étape 4 : Rollback (si nécessaire)

```sql
-- En cas de problème, restaurer depuis la sauvegarde
UPDATE pro_eligibility_tests_addresses peta
SET eligibility_history = backup.eligibility_history
FROM pro_eligibility_tests_addresses_backup_20251127 backup
WHERE peta.id = backup.id;

-- Supprimer la sauvegarde une fois la migration validée
DROP TABLE pro_eligibility_tests_addresses_backup_20251127;
```

## 🎯 Résultats Attendus

- ✅ **2 431 adresses corrigées** (98.1% du total)
- ⚠️ **47 adresses non corrigées** (1.9% du total) - nécessitent investigation manuelle
- ✅ Code source fixé pour éviter le bug à l'avenir
- ✅ Documentation complète du bug et de la correction

## 📅 Timeline

1. **Fix du code** : Priorité haute - empêcher le bug pour les nouvelles données
2. **Migration des données** : Peut être fait après le fix du code
3. **Validation** : Vérifier les résultats de la migration
4. **Cleanup** : Supprimer la table de backup après validation (garde 1-2 semaines)

## 🔗 Références

- Issue/PR: https://github.com/betagouv/france-chaleur-urbaine/pull/1164
- Date de détection: 2025-11-27
- Fichier concerné: `src/server/services/addresseInformation.ts:562`
- Table affectée: `pro_eligibility_tests_addresses.eligibility_history`
