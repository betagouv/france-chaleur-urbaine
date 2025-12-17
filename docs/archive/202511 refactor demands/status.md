# Système de Gestion des Demandes - Architecture PostgreSQL + tRPC

**Date**: Novembre 2025
**Status**: ✅ Migration Airtable → PostgreSQL complétée

---

## 📋 Résumé Exécutif

Le système de gestion des demandes a été migré d'Airtable vers PostgreSQL avec une architecture moderne basée sur tRPC. Le système gère les sollicitations des usagers pour le raccordement aux réseaux de chaleur urbains avec deux interfaces distinctes (admin et gestionnaire), des règles d'attribution automatiques, des notifications par email, et des tâches de synchronisation périodiques.

**Changements majeurs**:
- ✅ Données stockées dans PostgreSQL au lieu d'Airtable
- ✅ API REST remplacée par tRPC (type-safe)
- ✅ Historique des emails migré vers PostgreSQL
- ✅ Performances améliorées (requêtes SQL optimisées)
- ✅ Toutes les données Airtable préservées dans `legacy_values` (JSONB)

---

## 🏗️ Architecture du Système

### Stockage des Données

**Base de Données Principale**: PostgreSQL

**Tables Principales**:

1. **`demands`**
   - Stocke toutes les demandes de raccordement
   - Schéma simple avec `legacy_values` (JSONB) contenant toutes les données Airtable
   - Indexes optimisés pour les filtres fréquents
   - Référence: `src/server/db/migrations/20251106000000_create_demands_tables.ts`

2. **`demand_emails`**
   - Historique complet des emails envoyés par les gestionnaires
   - Remplace l'ancienne table Airtable `UTILISATEURS_EMAILS`
   - Lien avec `demands` via `demand_id`
   - Champs: object, body, to, cc, reply_to, signature, user_email, sent_at

3. **`pro_eligibility_tests_addresses`**
   - Adresses testées pour l'éligibilité
   - Historique d'éligibilité (JSONB array)
   - Partagée entre demandes et tests d'éligibilité
   - Lien avec `demands` via `demand_id`

**Tables PostgreSQL associées**:
- `assignment_rules`: Règles d'attribution automatique
- `users`: Comptes utilisateurs (gestionnaires, admins)
- `reseaux_de_chaleur`: Réseaux avec leurs tags

### Schéma de la Table `demands`

```sql
CREATE TABLE demands (
  id uuid PRIMARY KEY,
  airtable_id TEXT,                    -- ID Airtable d'origine (migration)
  legacy_values jsonb NOT NULL,        -- TOUTES les données Airtable
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE  -- Soft delete
);
```

**Indexes ciblés** (performance optimisée):
```sql
-- Champs de date (tri et filtres)
idx_demands_date_demande ON ((legacy_values->>'Date de la demande'))

-- Champs booléens/status (filtres)
idx_demands_gestionnaires_valides ON ((legacy_values->>'Gestionnaires validés'))
idx_demands_status ON ((legacy_values->>'Status'))

-- Notifications et relances
idx_demands_notification_envoye ON ((legacy_values->>'Notification envoyé'))
idx_demands_relance_a_activer ON ((legacy_values->>'Relance à activer'))
idx_demands_relance_id ON ((legacy_values->>'Relance ID'))

-- GIN index pour l'array Gestionnaires (opérateur ?|)
idx_demands_gestionnaires_gin ON USING gin ((legacy_values->'Gestionnaires'))
```

### Schéma de la Table `demand_emails`

```sql
CREATE TABLE demand_emails (
  id uuid PRIMARY KEY,
  airtable_id TEXT,
  demand_id uuid REFERENCES demands(id) ON DELETE CASCADE,
  email_key TEXT NOT NULL,             -- Clé du template ou UUID
  "to" TEXT NOT NULL,
  cc TEXT,
  reply_to TEXT,
  object TEXT NOT NULL,
  body TEXT NOT NULL,
  signature TEXT,
  user_email TEXT NOT NULL,            -- Email du gestionnaire
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Structure des Données JSONB `legacy_values`

Toutes les données Airtable sont stockées telles quelles dans `legacy_values`:

```json
{
  "id": "recXXXXXXXX",
  "Date de la demande": "2024-11-15T10:00:00Z",
  "Nom": "Dupont",
  "Prénom": "Jean",
  "Mail": "jean.dupont@example.com",
  "Téléphone": "0612345678",
  "Adresse": "123 Rue de Paris, 75001 Paris",
  "Latitude": 48.8566,
  "Longitude": 2.3522,
  "Structure": "Copropriété",
  "Mode de chauffage": "Gaz",
  "Type de chauffage": "Collectif",
  "Status": "En attente de prise en charge",
  "Gestionnaires": ["Paris", "Île-de-France"],
  "Gestionnaires validés": true,
  "Affecté à": "Gestionnaire Paris",
  "Prise de contact": false,
  "Commentaire": "",
  "Distance au réseau": 45,
  "en PDP": "Oui",
  "Relance à activer": true,
  "Notification envoyé": "2024-11-16",
  // ... tous les autres champs Airtable
}
```

---

## 🔌 Architecture tRPC

### Routes tRPC

**Fichier**: `src/modules/demands/server/trpc-routes.ts`

Toutes les routes sont type-safe et remplacent les anciennes routes REST:

```typescript
export const demandsRouter = router({
  admin: {
    list: route.meta({ auth: { roles: ['admin'] } }).query(() => listAdmin()),
    update: route
      .meta({ auth: { roles: ['admin'] } })
      .input(zAdminUpdateDemandInput)
      .mutation(({ input }) => update(input.demandId, input.values)),
  },
  gestionnaire: {
    list: route
      .meta({ auth: { roles: ['gestionnaire', 'demo'] } })
      .query(({ ctx }) => list(ctx.user)),
    listEmails: route
      .meta({ auth: { roles: ['gestionnaire', 'admin'] } })
      .input(zListEmailsInput)
      .query(({ input }) => listEmails(input.demand_id)),
    sendEmail: route
      .meta({ auth: { roles: ['gestionnaire', 'admin'] } })
      .input(zSendEmailInput)
      .mutation(({ input, ctx }) => sendEmail({ ...input, user: ctx.user })),
    update: route
      .meta({ auth: { roles: ['gestionnaire', 'demo'] } })
      .input(zGestionnaireUpdateDemandInput)
      .mutation(({ input }) => update(input.demandId, input.values)),
  },
  user: {
    create: route
      .input(zCreateDemandInput)
      .mutation(({ input }) => create(input)),
    update: route
      .input(zUserUpdateDemandInput)
      .mutation(({ input }) => update(input.demandId, input.values)),
    addRelanceComment: route
      .input(zAddRelanceCommentInput)
      .mutation(({ input }) => updateCommentFromRelanceId(input.relanceId, input.comment)),
  },
});
```

**Enregistrement dans le router principal**:
```typescript
// src/modules/trpc/trpc.config.ts
export const appRouter = router({
  demands: demandsRouter,
  // ... autres routes
});
```

---

## 🎯 Interfaces Utilisateur

### 1. Interface Administrateur (`/admin/demandes`)

**Fichier**: `src/pages/admin/demandes.tsx`
**Authentification**: `['admin']`
**API**: tRPC `demands.admin.list` et `demands.admin.update`

**Fonctionnalités**:
- **Liste des demandes** avec filtres et tri
- **Suggestions automatiques** via assignment rules
- **Édition inline**:
  - Gestionnaires (multi-select avec `FCUTagAutocomplete`)
  - Affecté à (dropdown)
  - Distance au réseau
  - ID et nom réseau
  - Commentaire interne FCU
- **Carte interactive** (panneau droit)
- **Filtres rapides**:
  - Demandes à affecter (non validées)
  - Demandes à traiter (status vide, non contactées, pas trop éloignées)
  - Demandes en PDP
  - Toutes les demandes
- **Validation en masse**: Bouton "Valider" pour marquer comme validées
- **Suppression**: Soft delete des demandes non validées

**Utilisation tRPC**:
```tsx
const { data: demandsData } = trpc.demands.admin.list.useQuery();
const demands = demandsData?.items ?? [];

const updateMutation = trpc.demands.admin.update.useMutation();
await updateMutation.mutateAsync({
  demandId: demand.id,
  values: { 'Gestionnaires validés': true },
});
```

### 2. Interface Gestionnaire (`/pro/demandes`)

**Fichier**: `src/pages/pro/demandes.tsx`
**Authentification**: `['gestionnaire', 'demo', 'admin']`
**API**: tRPC `demands.gestionnaire.list` et `demands.gestionnaire.update`

**Fonctionnalités**:
- **Liste filtrée** par tags gestionnaire (automatique)
- **Filtres rapides**:
  - Toutes les demandes
  - Haut potentiel (collectif <100m ou >100 logements ou tertiaire)
  - À traiter (status vide + non contacté)
  - En PDP
- **Édition inline**:
  - Status (dropdown)
  - Prise de contact (checkbox)
  - Commentaire gestionnaire
- **Modal Email**: Envoi d'emails avec templates et historique
- **Carte interactive**
- **Export XLSX**

**Logique haut potentiel**:
```typescript
const isHautPotentiel =
  legacy_values['Type de chauffage'] === 'Collectif' &&
  ((legacy_values['Distance au réseau'] || 10000000) < distanceThreshold ||
    (legacy_values.Logement || 0) >= 100 ||
    legacy_values.Structure === 'Tertiaire');
```

**Utilisation tRPC**:
```tsx
const { data: demands } = trpc.demands.gestionnaire.list.useQuery();

const updateMutation = trpc.demands.gestionnaire.update.useMutation();
await updateMutation.mutateAsync({
  demandId: demand.id,
  values: { Status: 'Étude en cours', 'Prise de contact': true },
});
```

---

## 💼 Logique Métier & Services

### Service Layer

**Fichier**: `src/modules/demands/server/demands-service.ts`

**Fonctions principales**:

```typescript
// Récupération des demandes
export const listAdmin = async () => Promise<{ count: number; items: Demand[] }>
export const list = async (user: User) => Promise<Demand[]>
export const listEmails = async (demandId: string) => Promise<DemandEmail[]>

// CRUD
export const create = async (values: CreateDemandInput) => Promise<Demand>
export const update = async (recordId: string, values: Partial<AirtableLegacyRecord>) => Promise<Demand>
export const remove = async (id: string) => Promise<void>

// Emails
export const createEmail = async (values: Insertable<DemandEmails>) => Promise<DemandEmail>
export const sendEmail = async (params: SendEmailParams) => Promise<void>

// Relances
export const getAllToRelanceDemands = async () => Promise<Demand[]>
export const dailyRelanceMail = async () => Promise<void>
export const updateFromRelanceId = async (relanceId: string, values: Partial<AirtableLegacyRecord>) => Promise<Demand>
export const updateCommentFromRelanceId = async (relanceId: string, comment: string) => Promise<Demand>
export const updateSatisfactionFromRelanceId = async (relanceId: string, satisfaction: boolean) => Promise<Demand>

// Géolocalisation
export const buildFeatures = async (properties: string[]) => Promise<GeoJSON.Feature[]>
```

### Création d'une Demande

**Processus** (via tRPC `demands.user.create`):

1. **Formatage des données**:
   ```typescript
   const legacyValues = formatDataToLegacyAirtable(values);
   ```

2. **Insertion en base**:
   ```sql
   INSERT INTO demands (legacy_values, created_at, updated_at)
   VALUES (
     '{"Nom": "Dupont", "Prénom": "Jean", ...}',
     NOW(),
     NOW()
   )
   ```

3. **Création adresse d'éligibilité**:
   ```typescript
   await createEligibilityTestAddress({
     address: legacyValues.Adresse,
     demand_id: createdDemand.id,
     latitude: legacyValues.Latitude,
     longitude: legacyValues.Longitude,
   });
   ```

4. **Envoi email de confirmation** (automatique via automation - hors scope)

### Mise à Jour d'une Demande

**Processus** (via tRPC `demands.*.update`):

1. **Récupération de l'ancienne version** (pour détecter les changements):
   ```typescript
   const currentDemand = await kdb
     .selectFrom('demands')
     .selectAll()
     .where('id', '=', recordId)
     .executeTakeFirst();
   ```

2. **Mise à jour par merge JSONB**:
   ```sql
   UPDATE demands
   SET legacy_values = legacy_values || '{"Status": "Étude en cours"}'::jsonb,
       updated_at = NOW()
   WHERE id = '...'
   ```

3. **Détection changements et automations**:
   - Si `Gestionnaire Affecté à` a changé → Email automatique à l'admin
   - Si `Recontacté par le gestionnaire` change via relance → Email à l'admin pour structures spécifiques

### Système de Relance

**Critères de relance** (identiques à Airtable):

**Première relance**:
- Demande > 1 mois
- `Relance à activer = true`
- `Recontacté par le gestionnaire` vide ou null
- `Relance envoyée` vide ou null

**Seconde relance**:
- Demande > 45 jours après première relance
- `Recontacté par le gestionnaire` toujours vide
- `Relance à activer = true`
- `Relance envoyée` non vide
- `Seconde relance envoyée` vide ou null

**Requête SQL** (extrait de `getAllToRelanceDemands`):
```sql
SELECT * FROM demands
WHERE (
  -- Première relance
  (legacy_values->>'Date de la demande')::date < NOW() - INTERVAL '1 month'
  AND legacy_values->>'Relance à activer' = 'true'
  AND (legacy_values->>'Recontacté par le gestionnaire' IS NULL OR legacy_values->>'Recontacté par le gestionnaire' = '')
  AND (legacy_values->>'Relance envoyée' IS NULL OR legacy_values->>'Relance envoyée' = '')
)
OR (
  -- Seconde relance
  (legacy_values->>'Date de la demande')::date < NOW() - INTERVAL '45 days'
  AND (legacy_values->>'Recontacté par le gestionnaire' IS NULL OR legacy_values->>'Recontacté par le gestionnaire' = '')
  AND legacy_values->>'Relance à activer' = 'true'
  AND legacy_values->>'Relance envoyée' IS NOT NULL
  AND legacy_values->>'Relance envoyée' != ''
  AND (legacy_values->>'Seconde relance envoyée' IS NULL OR legacy_values->>'Seconde relance envoyée' = '')
)
```

**Processus d'envoi**:
```typescript
for (const demand of demands) {
  const relanced = demand['Relance envoyée'];
  const uuid = uuidv4();

  await update(demand.id, {
    [relanced ? 'Seconde relance envoyée' : 'Relance envoyée']: new Date().toDateString(),
    'Relance ID': uuid,
  });

  await sendEmailTemplate('demands.user-relance', { email: demand.Mail }, { relanceId: uuid, ... });
}
```

### Système d'Emails Gestionnaire

**Stockage**: Table PostgreSQL `demand_emails`

**Processus d'envoi** (via tRPC `demands.gestionnaire.sendEmail`):

1. **Enregistrement en base**:
   ```typescript
   await createEmail({
     demand_id,
     email_key: templateKey,
     to: emailContent.to,
     cc: emailContent.cc.join(','),
     reply_to: emailContent.replyTo,
     object: emailContent.object,
     body: emailContent.body,
     signature: emailContent.signature,
     user_email: user.email,
     sent_at: new Date(),
   });
   ```

2. **Mise à jour signature utilisateur** (si modifiée)

3. **Envoi email effectif**:
   ```typescript
   await sendEmailTemplate(
     'legacy.manager',
     { email: to, id: user.id },
     { content: body, signature },
     { cc, replyTo, subject: object }
   );
   ```

**Récupération historique** (via tRPC `demands.gestionnaire.listEmails`):
```typescript
const emails = await kdb
  .selectFrom('demand_emails')
  .selectAll()
  .where('demand_id', '=', demandId)
  .execute();
```

---

## 🔧 Règles d'Attribution

### Service

**Fichier**: `src/modules/demands/server/assignment_rules-service.ts`

**Fonctions**:
```typescript
export const list = async () => Promise<AssignmentRule[]>
export const parseAssignmentRules = async (rules: AssignmentRule[]) => Promise<ParsedRule[]>
export const applyParsedRulesToEligibilityData = (
  parsedRules: ParsedRule[],
  data: { tags: string[] }
) => { tags: string[], assignment: string | null }
```

**Intégration dans listAdmin**:
```typescript
const { items: assignmentRules } = await assignmentRulesService.list();
const parsedRules = await assignmentRulesService.parseAssignmentRules(assignmentRules);

const reseauxDeChaleur = await kdb
  .selectFrom('reseaux_de_chaleur')
  .select(['tags', 'id_fcu'])
  .execute();

for (const demand of demands) {
  const tags = reseauxDeChaleur.find(
    reseau => reseau.id_fcu === demand.testAddress.eligibility?.id_fcu
  )?.tags ?? [];

  const rulesResult = assignmentRulesService.applyParsedRulesToEligibilityData(parsedRules, { tags });

  demand.recommendedAssignment = rulesResult.assignment ?? 'Non affecté';
  demand.recommendedTags = [...new Set([...tags, ...rulesResult.tags])];
}
```

---

## 🗂️ Structure des Modules

### Module Demands

```
src/modules/demands/
├── client/                          # Composants React
│   ├── AdditionalInformation.tsx   # Champs éditables (surface, conso, etc.)
│   ├── Comment.tsx                 # Zone de commentaire
│   ├── Contact.tsx                 # Affichage contact utilisateur
│   ├── Contacted.tsx               # Checkbox prise de contact
│   ├── DemandSondageForm.tsx       # Formulaire satisfaction
│   ├── DemandStatusBadge.tsx       # Badge status
│   └── Status.tsx                  # Dropdown status
├── server/
│   ├── demands-service.ts          # Service layer (CRUD, emails, relances)
│   ├── assignment_rules-service.ts # Règles d'attribution
│   └── trpc-routes.ts              # Routes tRPC
├── commands/
│   ├── migrate-from-airtable.ts    # Migration CLI
│   └── migrate-from-airtable-full.ts
├── commands.ts                      # Registry des commandes CLI
├── constants.ts                     # Schémas Zod, types, constantes
└── types.ts                         # Types TypeScript
```

### Module Email

```
src/modules/email/
├── index.tsx                        # Export principal
├── email.config.tsx                 # Configuration emails
├── react-email/
│   ├── components.tsx               # Composants réutilisables
│   └── templates/
│       ├── auth/                    # Templates authentification
│       ├── demands/                 # Templates demandes
│       │   ├── admin-assignment-change.tsx
│       │   ├── admin-gestionnaire-contact.tsx
│       │   ├── admin-new.tsx
│       │   ├── gestionnaire-new.tsx
│       │   ├── gestionnaire-old.tsx
│       │   ├── user-new.tsx
│       │   ├── user-relance.tsx
│       │   └── tests/               # Templates de test
│       └── legacy/
│           └── manager-email.tsx    # Template email gestionnaire
```

---

## 🚀 Migration Airtable → PostgreSQL

### Scripts de Migration

**Fichiers**:
- `src/modules/demands/commands/migrate-from-airtable.ts` - Migration incrémentale
- `src/modules/demands/commands/migrate-from-airtable-full.ts` - Migration complète

**Commande CLI**:
```bash
pnpm cli demands migrate-from-airtable
pnpm cli demands migrate-from-airtable-full
```

**Processus**:
1. Récupération des records Airtable
2. Pour chaque record:
   - Insertion/update dans `demands` avec `legacy_values`
   - Création adresse d'éligibilité dans `pro_eligibility_tests_addresses`
   - Stockage `airtable_id` pour référence

**Données préservées**:
- ✅ Toutes les données Airtable dans `legacy_values`
- ✅ `airtable_id` stocké pour traçabilité
- ✅ Liens vers tests d'éligibilité via `pro_eligibility_tests_addresses`

---

## 📊 Performance

### Optimisations

**Indexes ciblés** au lieu d'index GIN global:
- ✅ Plus rapide pour les filtres fréquents (status, date, validation)
- ✅ Moins de coût d'écriture
- ✅ Taille d'index réduite

**Requêtes optimisées**:
```sql
-- Admin: JOIN avec eligibility test addresses (1 requête au lieu de N+1)
SELECT demands.*, to_jsonb(pro_eligibility_tests_addresses) as testAddress
FROM demands
INNER JOIN pro_eligibility_tests_addresses ON pro_eligibility_tests_addresses.demand_id = demands.id
ORDER BY legacy_values->>'Date de la demande' DESC

-- Gestionnaire: Filtre par array Gestionnaires (opérateur ?| + GIN index)
WHERE legacy_values->>'Gestionnaires validés' = 'true'
  AND legacy_values->'Gestionnaires' ?| ARRAY['Paris', 'Île-de-France']
```

**Logs de performance**:
```typescript
logger.info('kdb.getAdminDemands', {
  duration: Date.now() - startTime,
  recordsCount: records.length,
});
```

---

## ✅ État Actuel

### Fonctionnalités Complétées

- ✅ Migration Airtable → PostgreSQL
- ✅ Tables `demands` et `demand_emails` créées
- ✅ Routes tRPC implémentées (admin, gestionnaire, user)
- ✅ Service layer complet (CRUD, emails, relances)
- ✅ Pages admin et gestionnaire migrées vers tRPC
- ✅ Composants réorganisés dans `src/modules/demands/client/`
- ✅ Module email réorganisé dans `src/modules/email/`
- ✅ Assignment rules service
- ✅ Tests d'éligibilité partagés via `pro_eligibility_tests_addresses`

### Conservé (hors scope migration)

- ⏸️ Table Airtable `RELANCE` (commentaires de relance) - peut être migrée plus tard
- ⏸️ Cron jobs (utilisent toujours les fonctions du service, mais requêtent PostgreSQL)

---

## 🔍 Fichiers Clés

### Pages
- `src/pages/admin/demandes.tsx` - Interface admin (tRPC)
- `src/pages/pro/demandes.tsx` - Interface gestionnaire (tRPC)
- `src/pages/satisfaction.tsx` - Page relance utilisateur

### tRPC & Services
- `src/modules/demands/server/trpc-routes.ts` - Routes tRPC
- `src/modules/demands/server/demands-service.ts` - Service layer
- `src/modules/demands/server/assignment_rules-service.ts` - Règles attribution
- `src/modules/demands/constants.ts` - Schémas Zod et types
- `src/modules/trpc/trpc.config.ts` - Configuration tRPC

### Base de Données
- `src/server/db/migrations/20251106000000_create_demands_tables.ts` - Migration
- `src/server/db/migrations/20251112000000_make_pro_eligibility_tests_addresses_shared.ts` - Adresses partagées

### Composants
- `src/modules/demands/client/` - Composants demandes
- `src/modules/email/react-email/templates/demands/` - Templates emails

### Migration
- `src/modules/demands/commands/migrate-from-airtable.ts` - Script migration
- `src/modules/demands/commands.ts` - Registry CLI
