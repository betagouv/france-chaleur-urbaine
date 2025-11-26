# Migration Demandes: Airtable → PostgreSQL + tRPC - Réalisations

**Date**: Novembre 2025
**Status**: ✅ **COMPLÉTÉ**

---

## 📋 Vue d'Ensemble

### Objectifs Atteints

- ✅ Migration complète des données d'Airtable vers PostgreSQL
- ✅ Architecture tRPC type-safe
- ✅ Pages `/admin/demandes` et `/pro/demandes` migrées (pas de v2, migration sur place)
- ✅ Module `src/modules/demands/` complet
- ✅ Module `src/modules/email/` réorganisé
- ✅ Historique emails migré vers PostgreSQL
- ✅ Composants déplacés dans le module demands
- ✅ Performance optimisée (requêtes SQL, indexes ciblés)

### Différences vs Plan Initial

**Plan original**: Créer nouvelles pages `-v2` en parallèle
**Réalisé**: Migration directe des pages existantes vers tRPC

**Plan original**: Schéma PostgreSQL complexe avec champs séparés
**Réalisé**: Schéma simple avec `legacy_values` JSONB (approche pragmatique)

**Plan original**: Assignment rules hors scope
**Réalisé**: Assignment rules service implémenté

**Raisons des changements**:
- 🚀 Plus rapide: pas de maintien de 2 versions en parallèle
- 🔧 Plus simple: JSONB permet de garder toutes les données Airtable sans mapping complexe
- 📈 Même résultat: fonctionnalités identiques, juste l'approche technique différente

---

## 🏗️ Architecture Implémentée

### Base de Données PostgreSQL

#### Table `demands`

```sql
CREATE TABLE demands (
  id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
  airtable_id TEXT,                    -- Pour référence Airtable
  legacy_values jsonb NOT NULL,        -- Toutes les données Airtable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete
);
```

**Indexes optimisés**:
- Date de la demande (tri)
- Gestionnaires validés (filtre admin)
- Status (filtres)
- Notification envoyé, Relance à activer, Relance ID
- GIN index sur array `Gestionnaires` (opérateur `?|`)

#### Table `demand_emails`

```sql
CREATE TABLE demand_emails (
  id uuid PRIMARY KEY,
  airtable_id TEXT,
  demand_id uuid REFERENCES demands(id) ON DELETE CASCADE,
  email_key TEXT NOT NULL,
  "to" TEXT NOT NULL,
  cc TEXT,
  reply_to TEXT,
  object TEXT NOT NULL,
  body TEXT NOT NULL,
  signature TEXT,
  user_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Remplace**: Table Airtable `UTILISATEURS_EMAILS`

#### Table `pro_eligibility_tests_addresses` (modifiée)

Anciennement liée uniquement aux tests d'éligibilité, maintenant partagée:
- Ajout de `demand_id uuid REFERENCES demands(id)`
- Stockage de l'historique d'éligibilité (JSONB array)
- 1 adresse peut avoir N tests d'éligibilité (historique)

---

## 🎯 Routes tRPC Implémentées

### Admin Routes

**Fichier**: `src/modules/demands/server/trpc-routes.ts`

```typescript
demandsRouter.admin.list
  - Auth: ['admin']
  - Retourne: { count: number, items: Demand[] }
  - Includes: recommendedTags, recommendedAssignment (via assignment rules)

demandsRouter.admin.update
  - Auth: ['admin']
  - Input: { demandId: string, values: Partial<AirtableLegacyRecord> }
  - Actions:
    * Merge values dans legacy_values (SQL: || operator)
    * Détection changement "Gestionnaire Affecté à" → email auto
    * Retourne demand augmentée
```

### Gestionnaire Routes

```typescript
demandsRouter.gestionnaire.list
  - Auth: ['gestionnaire', 'demo']
  - Filtre automatique par tags user
  - Demo: données anonymisées (faker)

demandsRouter.gestionnaire.listEmails
  - Auth: ['gestionnaire', 'admin']
  - Input: { demand_id: string }
  - Retourne: historique emails de la demande

demandsRouter.gestionnaire.sendEmail
  - Auth: ['gestionnaire', 'admin']
  - Input: { demand_id, emailContent, key }
  - Actions:
    * Enregistrement dans demand_emails
    * Mise à jour signature user si changée
    * Envoi email réel via sendEmailTemplate

demandsRouter.gestionnaire.update
  - Auth: ['gestionnaire', 'demo']
  - Input: { demandId, values }
  - Merge values dans legacy_values
```

### User Routes (public)

```typescript
demandsRouter.user.create
  - Auth: public
  - Input: CreateDemandInput (formulaire contact)
  - Actions:
    * Formatage vers legacy Airtable
    * Insertion dans demands
    * Création adresse dans pro_eligibility_tests_addresses
    * Retourne demand créée

demandsRouter.user.update
  - Auth: public
  - Input: { demandId, values } (ex: sondage)
  - Merge values dans legacy_values

demandsRouter.user.addRelanceComment
  - Auth: public
  - Input: { relanceId, comment }
  - Trouve demande par Relance ID
  - Update "Commentaire relance"
```

---

## 💼 Service Layer

### Fonctions CRUD

**Fichier**: `src/modules/demands/server/demands-service.ts`

```typescript
// Listes
listAdmin(): Promise<{ count: number; items: Demand[] }>
  - JOIN avec pro_eligibility_tests_addresses
  - Calcul recommendedTags/recommendedAssignment via assignment rules
  - Logs performance

list(user: User): Promise<Demand[]>
  - Filtre par role (admin, demo, gestionnaire)
  - Demo: données faker
  - Gestionnaire: filtre par tags (opérateur ?|)

// CRUD
create(values: CreateDemandInput): Promise<Demand>
  - Formatage → legacy_values
  - Insertion demands
  - Création pro_eligibility_tests_addresses

update(recordId: string, values: Partial<AirtableLegacyRecord>): Promise<Demand>
  - Récupération version actuelle (détection changements)
  - Merge JSONB: legacy_values || new_values
  - Automations:
    * Changement "Gestionnaire Affecté à" → email admin
    * "Recontacté par le gestionnaire" via relance → email admin

remove(id: string): Promise<void>
  - Soft delete (deleted_at)

// Emails
listEmails(demandId: string): Promise<DemandEmail[]>
createEmail(values): Promise<DemandEmail>
sendEmail(params): Promise<void>
  - Enregistrement demand_emails
  - Update signature user
  - Envoi template 'legacy.manager'

// Relances
getAllToRelanceDemands(): Promise<Demand[]>
  - Critères: >1 mois OU >45j après 1ère relance
  - Requête SQL complexe sur legacy_values

dailyRelanceMail(): Promise<void>
  - Pour chaque demand à relancer:
    * Génération UUID
    * Update "Relance envoyée" ou "Seconde relance envoyée"
    * Envoi template 'demands.user-relance'

updateFromRelanceId(relanceId, values): Promise<Demand>
updateCommentFromRelanceId(relanceId, comment): Promise<Demand>
updateSatisfactionFromRelanceId(relanceId, satisfaction): Promise<Demand>
  - Automation: email admin si structure = Bailleur/Tertiaire

// Géolocalisation
buildFeatures(properties: string[]): Promise<GeoJSON.Feature[]>
  - Pour export carte/map
```

### Assignment Rules Service

**Fichier**: `src/modules/demands/server/assignment_rules-service.ts`

```typescript
list(): Promise<AssignmentRule[]>
  - Récupération depuis table assignment_rules

parseAssignmentRules(rules): Promise<ParsedRule[]>
  - Parse expressions en AST

applyParsedRulesToEligibilityData(parsedRules, data): { tags: string[], assignment: string | null }
  - Évalue règles sur données éligibilité
  - Retourne tags recommandés + assignment
```

**Intégration**:
- Appelé dans `listAdmin()` pour calculer `recommendedTags` et `recommendedAssignment`
- Utilise les tags des `reseaux_de_chaleur` matchés par `id_fcu`

---

## 🎨 Pages Frontend

### `/admin/demandes`

**Fichier**: `src/pages/admin/demandes.tsx`

**Changements**:
- ❌ Supprimé: `useFetch('/api/admin/demands')`
- ✅ Ajouté: `trpc.demands.admin.list.useQuery()`
- ✅ Ajouté: `trpc.demands.admin.update.useMutation()`

**Fonctionnalités conservées**:
- Table avec tri/filtres
- Carte interactive (panneau droit)
- Filtres rapides (à affecter, à traiter, en PDP, toutes)
- Édition inline (gestionnaires, affecté à, distance, réseau)
- Validation/suppression

**Nouveaux composants**:
```tsx
// Avant: src/components/Manager/Contact.tsx
// Après: src/modules/demands/client/Contact.tsx
import Contact from '@/modules/demands/client/Contact';
import Comment from '@/modules/demands/client/Comment';
import Status from '@/modules/demands/client/Status';
// etc.
```

### `/pro/demandes`

**Fichier**: `src/pages/pro/demandes.tsx`

**Changements**:
- ❌ Supprimé: `useFetch('/api/demands')`
- ✅ Ajouté: `trpc.demands.gestionnaire.list.useQuery()`
- ✅ Ajouté: `trpc.demands.gestionnaire.update.useMutation()`
- ✅ Ajouté: `trpc.demands.gestionnaire.listEmails.useQuery()` (modal email)
- ✅ Ajouté: `trpc.demands.gestionnaire.sendEmail.useMutation()` (envoi email)

**Fonctionnalités conservées**:
- Table avec tri/filtres
- Filtres rapides (toutes, haut potentiel, à traiter, en PDP)
- Carte interactive
- Modal email avec historique
- Export XLSX
- Édition inline (status, prise de contact, commentaire)

---

## 🧩 Composants Déplacés

### Avant (dispersés)

```
src/components/Manager/
├── AdditionalInformation.tsx
├── AdditionalInformation.styles.ts  ❌ supprimé (inline styles)
├── Comment.tsx
├── Contact.tsx
├── Contacted.tsx
├── Contacted.styles.ts              ❌ supprimé (inline styles)
├── DemandStatusBadge.tsx
├── Status.tsx                        ❌ supprimé (utilisait Airtable)
└── DemandEmailForm.tsx              ✅ conservé (hors module demands)
```

### Après (module demands)

```
src/modules/demands/client/
├── AdditionalInformation.tsx
├── Comment.tsx
├── Contact.tsx
├── Contacted.tsx
├── DemandSondageForm.tsx            ✨ nouveau (page satisfaction)
├── DemandStatusBadge.tsx
└── Status.tsx                        ✨ nouveau (dropdown status)
```

**Conservé dans `src/components/Manager/`**:
- `DemandEmailForm.tsx` - Modal email (utilisé uniquement dans pages)
- `Tag.tsx` - Composant tag générique

---

## 📧 Module Email Réorganisé

### Avant

```
src/server/email/
├── index.tsx
└── react-email/
    ├── index.tsx
    ├── components.tsx
    └── templates/
        ├── activation.tsx
        ├── inscription.tsx
        ├── reset-password.tsx
        ├── creation-demande.tsx
        ├── new-demands.tsx
        ├── old-demands.tsx
        ├── relance.tsx
        ├── manager-email.tsx
        └── tests/
            └── ...
```

### Après

```
src/modules/email/
├── index.tsx
├── email.config.tsx                 ✨ nouveau
└── react-email/
    ├── components.tsx
    └── templates/
        ├── auth/                    ✨ organisé
        │   ├── activation.tsx
        │   ├── inscription.tsx
        │   └── reset-password.tsx
        ├── demands/                 ✨ organisé
        │   ├── _data.ts             ✨ données de test
        │   ├── admin-assignment-change.tsx    ✨ automation
        │   ├── admin-gestionnaire-contact.tsx ✨ automation
        │   ├── admin-new.tsx
        │   ├── gestionnaire-new.tsx
        │   ├── gestionnaire-old.tsx
        │   ├── user-new.tsx
        │   ├── user-relance.tsx
        │   └── tests/
        │       └── ...
        └── legacy/
            └── manager-email.tsx    ✅ conservé (email gestionnaire custom)
```

**Nouveautés**:
- Templates organisés par contexte (auth, demands, legacy)
- Automations Airtable recréées en templates:
  - `admin-assignment-change.tsx` - Changement affectation
  - `admin-gestionnaire-contact.tsx` - Contact gestionnaire après relance

---

## 🔄 Migration CLI

### Scripts

**Fichiers**:
- `src/modules/demands/commands/migrate-from-airtable.ts`
- `src/modules/demands/commands/migrate-from-airtable-full.ts`

**Commandes**:
```bash
# Migration incrémentale (nouvelles demandes)
pnpm cli demands migrate-from-airtable

# Migration complète (toutes les demandes)
pnpm cli demands migrate-from-airtable-full
```

**Processus**:
1. Connexion Airtable via SDK
2. Récupération records (batch 100)
3. Pour chaque record:
   ```typescript
   await kdb.insertInto('demands').values({
     airtable_id: record.id,
     legacy_values: record.fields,
     created_at: record.fields['Date de la demande'],
     updated_at: new Date(),
   });

   if (record.fields.Latitude && record.fields.Longitude) {
     await createEligibilityTestAddress({
       demand_id: demand.id,
       address: record.fields.Adresse,
       latitude: record.fields.Latitude,
       longitude: record.fields.Longitude,
     });
   }
   ```

4. Migration emails (demand_emails):
   ```typescript
   const airtableEmails = await AirtableDB(Airtable.UTILISATEURS_EMAILS).select();
   for (const email of airtableEmails) {
     await kdb.insertInto('demand_emails').values({
       airtable_id: email.id,
       demand_id: findDemandByAirtableId(email.fields.demand_id),
       email_key: email.fields.email_key,
       to: email.fields.to,
       // ...
     });
   }
   ```

**Données préservées**:
- ✅ 100% des données Airtable dans `legacy_values`
- ✅ `airtable_id` pour traçabilité
- ✅ Historique emails dans `demand_emails`
- ✅ Tests d'éligibilité dans `pro_eligibility_tests_addresses`

---

## 📊 Performance & Optimisations

### Indexes Ciblés

**Stratégie**: Indexes ciblés au lieu d'un GIN global

**Avantages**:
- ✅ Requêtes plus rapides sur champs fréquents
- ✅ Moins de coût d'écriture (pas de mise à jour GIN global)
- ✅ Taille d'index réduite
- ✅ Peut utiliser plusieurs indexes en parallèle (bitmap scan)

**Indexes créés**:
```sql
-- Tri par date (très fréquent)
idx_demands_date_demande ON ((legacy_values->>'Date de la demande'))

-- Filtres admin (à affecter)
idx_demands_gestionnaires_valides ON ((legacy_values->>'Gestionnaires validés'))
  WHERE legacy_values->>'Gestionnaires validés' = 'true'

-- Filtres status
idx_demands_status ON ((legacy_values->>'Status'))
  WHERE legacy_values->>'Status' IS NOT NULL

-- Relances
idx_demands_relance_a_activer ON ((legacy_values->>'Relance à activer'))
  WHERE legacy_values->>'Relance à activer' = 'true'
idx_demands_relance_id ON ((legacy_values->>'Relance ID'))
  WHERE legacy_values->>'Relance ID' IS NOT NULL

-- Array Gestionnaires (opérateur ?|)
idx_demands_gestionnaires_gin ON USING gin ((legacy_values->'Gestionnaires'))
```

### Requêtes Optimisées

**Admin list** (1 requête au lieu de N+1):
```sql
SELECT
  demands.*,
  to_jsonb(pro_eligibility_tests_addresses) as testAddress
FROM demands
INNER JOIN pro_eligibility_tests_addresses
  ON pro_eligibility_tests_addresses.demand_id = demands.id
ORDER BY legacy_values->>'Date de la demande' DESC
```

**Gestionnaire list** (filtre par array avec `?|`):
```sql
SELECT * FROM demands
WHERE legacy_values->>'Gestionnaires validés' = 'true'
  AND legacy_values->'Gestionnaires' ?| ARRAY['Paris', 'Île-de-France']
ORDER BY legacy_values->>'Date de la demande' DESC
```

**Relances** (requête complexe optimisée):
```sql
SELECT * FROM demands
WHERE (
  -- Première relance: >1 mois, non contacté, non relancé
  (legacy_values->>'Date de la demande')::date < NOW() - INTERVAL '1 month'
  AND legacy_values->>'Relance à activer' = 'true'
  AND (legacy_values->>'Recontacté par le gestionnaire' IS NULL
       OR legacy_values->>'Recontacté par le gestionnaire' = '')
  AND (legacy_values->>'Relance envoyée' IS NULL
       OR legacy_values->>'Relance envoyée' = '')
) OR (
  -- Seconde relance: >45j après 1ère, toujours non contacté
  (legacy_values->>'Date de la demande')::date < NOW() - INTERVAL '45 days'
  AND legacy_values->>'Relance à activer' = 'true'
  AND (legacy_values->>'Recontacté par le gestionnaire' IS NULL
       OR legacy_values->>'Recontacté par le gestionnaire' = '')
  AND legacy_values->>'Relance envoyée' IS NOT NULL
  AND legacy_values->>'Relance envoyée' != ''
  AND (legacy_values->>'Seconde relance envoyée' IS NULL
       OR legacy_values->>'Seconde relance envoyée' = '')
)
```

### Logs de Performance

```typescript
logger.info('kdb.getAdminDemands', {
  duration: Date.now() - startTime,
  recordsCount: records.length,
});

logger.info('getDetailedEligilityStatus', {
  duration: Date.now() - startTime,
  recordsCount: records.length,
});
```

---

## ✅ Résumé des Changements

### Base de Données

| Avant (Airtable) | Après (PostgreSQL) |
|------------------|-------------------|
| Table `FCU - Utilisateurs` | Table `demands` + `legacy_values` JSONB |
| Table `FCU - Utilisateurs emails` | Table `demand_emails` |
| Table `FCU - Utilisateurs relance` | ⏸️ Conservé (hors scope) |
| Requêtes via SDK Airtable | Requêtes SQL optimisées via Kysely |

### API

| Avant (REST) | Après (tRPC) |
|--------------|--------------|
| `GET /api/admin/demands` | `trpc.demands.admin.list.useQuery()` |
| `PUT /api/admin/demands/[id]` | `trpc.demands.admin.update.useMutation()` |
| `DELETE /api/admin/demands/[id]` | ❌ Supprimé (soft delete dans update) |
| `GET /api/demands` | `trpc.demands.gestionnaire.list.useQuery()` |
| `PUT /api/demands/[id]` | `trpc.demands.gestionnaire.update.useMutation()` |
| `GET /api/managerEmail?demand_id=` | `trpc.demands.gestionnaire.listEmails.useQuery()` |
| `POST /api/managerEmail` | `trpc.demands.gestionnaire.sendEmail.useMutation()` |
| `POST /api/airtable/records` | `trpc.demands.user.create.useMutation()` |

**Avantages tRPC**:
- ✅ Type-safety complète (client & serveur)
- ✅ Pas de génération OpenAPI/Swagger
- ✅ Autocomplete IDE
- ✅ Validation Zod automatique
- ✅ Moins de boilerplate

### Structure Code

| Avant | Après |
|-------|-------|
| `src/components/Manager/*` | `src/modules/demands/client/*` |
| `src/server/email/*` | `src/modules/email/*` |
| `src/pages/api/admin/demands.ts` | ❌ Supprimé |
| `src/pages/api/demands/[id].ts` | ❌ Supprimé |
| `src/pages/api/managerEmail.ts` | ❌ Supprimé |
| `src/pages/api/airtable/records/index.ts` | ⚠️ Partiellement (reste relances) |
| `src/server/services/manager.ts` | ⚠️ Partiellement (reste cron) |

### Nouvelles Routes REST Supprimées

Ces routes ont été complètement supprimées car remplacées par tRPC:

- ❌ `src/pages/api/admin/demands.ts`
- ❌ `src/pages/api/demands/index.ts`
- ❌ `src/pages/api/managerEmail.ts`

### Fichiers Conservés (Partiellement Modifiés)

Ces fichiers ont été modifiés mais pas supprimés:

- ⚠️ `src/pages/api/airtable/records/index.ts` - Conservé pour relances uniquement
- ⚠️ `src/server/services/manager.ts` - Conservé pour cron jobs
- ⚠️ `src/services/airtable.ts` - Formatage données (toujours utilisé)

---

## 🎯 Prochaines Étapes (Optionnelles)

### Phase 2 - Nettoyage Complet

- [ ] Migrer table `RELANCE` vers PostgreSQL
- [ ] Migrer cron jobs vers services PostgreSQL uniquement
- [ ] Supprimer complètement dépendance Airtable
- [ ] Supprimer `src/pages/api/airtable/records/index.ts`
- [ ] Nettoyer `src/server/services/manager.ts`

### Phase 3 - Optimisations Avancées

- [ ] Normaliser schéma (extraire champs fréquents hors JSONB)
- [ ] Cache Redis pour listes admin/gestionnaire
- [ ] Pagination curseur-based pour grandes listes
- [ ] Webhook temps réel au lieu de polling

---

## 📚 Documentation de Référence

### Fichiers Clés

**Migrations**:
- `src/server/db/migrations/20251106000000_create_demands_tables.ts`
- `src/server/db/migrations/20251112000000_make_pro_eligibility_tests_addresses_shared.ts`

**tRPC**:
- `src/modules/demands/server/trpc-routes.ts` - Routes
- `src/modules/trpc/trpc.config.ts` - Config principale
- `src/modules/demands/constants.ts` - Schémas Zod

**Services**:
- `src/modules/demands/server/demands-service.ts` - Service principal
- `src/modules/demands/server/assignment_rules-service.ts` - Règles attribution

**Pages**:
- `src/pages/admin/demandes.tsx` - Interface admin
- `src/pages/pro/demandes.tsx` - Interface gestionnaire
- `src/pages/satisfaction.tsx` - Page relance

**Composants**:
- `src/modules/demands/client/*` - Composants UI
- `src/modules/email/react-email/templates/demands/*` - Templates emails

**Migration**:
- `src/modules/demands/commands/migrate-from-airtable.ts` - Script CLI
- `src/modules/demands/commands.ts` - Registry

### Guides Connexes

- `status.md` - Documentation de l'architecture actuelle
- `migration-table.md` - Mapping Airtable → PostgreSQL (référence)

---

**Fin du document - Migration complétée avec succès** ✅
