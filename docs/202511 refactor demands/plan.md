# Plan de Migration: Demandes - Airtable → PostgreSQL avec tRPC

**Date**: 3 novembre 2025
**Objectif**: Migration complète des demandes d'Airtable vers PostgreSQL avec nouvelles pages v2
**Approche**: EPCT (Explore-Plan-Code-Test) avec création de nouvelles pages, suppression totale d'Airtable

---

## 📋 Vue d'Ensemble

### Objectifs Principaux

1. ✅ Migrer toutes les données d'Airtable vers PostgreSQL
2. ✅ Créer `/admin/demandes-v2` avec tRPC
3. ✅ Créer `/pro/demandes-v2` avec tRPC
4. ❌ Assignment rules (hors scope - phase ultérieure)
5. ✅ Supprimer complètement la dépendance à Airtable

### Contraintes

- **Ne PAS modifier** les pages existantes (`/admin/demandes`, `/pro/demandes`)
- **Créer de nouvelles pages** (`-v2`) en parallèle
- **Utiliser tRPC** pour toutes les nouvelles routes
- **Schéma existant**: Utiliser la migration `20251029000000_create_demands_table.ts` déjà créée
- **Module existant**: Compléter le module `src/modules/demands` déjà initialisé

---

## 🏗️ Architecture Actuelle (Analyse)

### Schéma PostgreSQL Existant

Le schéma est déjà créé dans `src/server/db/migrations/20251029000000_create_demands_table.ts`:

```sql
demands (
  id uuid PRIMARY KEY,
  legacy_values jsonb NOT NULL,  -- Toutes les données Airtable d'origine

  -- Dates
  created_at timestamptz NOT NULL,        -- Date de la demande
  validated_at timestamptz,               -- Date de validation gestionnaires
  contacted_at timestamptz,               -- Date de recontact
  updated_at timestamptz,

  -- Commentaires
  comment_gestionnaire text,              -- Commentaire || ""
  comment_fcu text,                       -- Concat de Commentaires_internes_FCU + Commentaires FCU

  -- Historique
  history jsonb DEFAULT '[]'::jsonb,      -- Array d'événements

  -- Utilisateur
  user jsonb,                             -- {first_name, last_name, email, phone, structure_type, structure_name}
  user_id uuid REFERENCES users(id),      -- Lien si user existe

  -- Métadonnées demande
  status text,                            -- Status
  assigned_to text,                       -- Affecté à
  assigned_to_pending text,               -- Gestionnaire Affecté à
  referrer text,                          -- Sondage
  referrer_other text,                    -- Sondage autre

  -- Bâtiment
  batiment jsonb,                         -- Toutes les infos bâtiment

  -- Campagnes
  campaign_keywords text,
  campaign_source text,
  campaign_matomo text
)
```

**Indexes existants:**
- `idx_demands_airtable_id` (unique sur `legacy_values->>'id'`)
- `idx_demands_legacy_values` (GIN sur JSONB)
- `idx_demands_history` (GIN)
- `idx_demands_user` (GIN)
- `idx_demands_batiment` (GIN)
- `idx_demands_created_at`, `idx_demands_validated_at`, `idx_demands_contacted_at`
- `idx_demands_user_id`, `idx_demands_status`

### Mapping migration-table.md → Schema PostgreSQL

D'après `docs/202511 refactor demands/migration-table.md`:

**Champs principaux:**
- `created_at` ← "Date de la demande"
- `validated_at` ← "Gestionnaires validés" (date si TRUE)
- `contacted_at` ← "Recontacté par le gestionnaire" (date si Oui)
- `comment_gestionnaire` ← Commentaire || ""
- `comment_fcu` ← Concat de "Commentaires_internes_FCU" + "Commentaires FCU"
- `user` (JSON):
  - `first_name` ← Nom
  - `last_name` ← Prénom
  - `email` ← Email
  - `phone` ← Téléphone
  - `structure_type` ← Structure (inverse function)
  - `structure_name` ← Nom de la structure accompagnante
- `user_id` ← Populate si user avec email existe
- `status` ← Status
- `assigned_to` ← Affecté à
- `assigned_to_pending` ← Gestionnaire Affecté à
- `referrer` / `referrer_other` ← Sondage

**Bâtiment (JSON):**
- `source_address` ← Adresse
- `ban_valid`, `ban_address`, `ban_score`, `geom` ← À calculer
- `eligibility_history` ← Array avec résultat de `getAddressEligibilityHistoryEntry`
- `mode_chauffage` ← Mode de chauffage (électricité, gaz, fioul, autre)
- `type_chauffage` ← Type de chauffage (individuel, collectif, autre)
- `type` ← Type de bâtiment
- `surface_m2` ← Surface en m2
- `conso_gaz` ← Conso
- `nb_logements` ← Nombre de logements (demandArea)
- `company_type` ← Type de structure (demandCompanyType)
- `company_name` ← Établissement || Nom de la structure accompagnante

**History (JSON Array):**
```json
[
  {"type": "creation", "created_at": "...", "id": "..."},
  {"type": "validation", "created_at": "...", "id": "..."},
  {"type": "contact", "created_at": "...", "id": "..."},
  {"type": "relance", "created_at": "...", "metadata": {"comment": "..."}, "id": "..."},
  {"type": "relance", "created_at": "...", "id": "..."},  // Seconde relance
  {"type": "gestionnaires_modifies", "created_at": "...", "id": "..."},
  {"type": "affectation_modifiee", "created_at": "...", "id": "..."},
  {"type": "affectation_acceptee", "created_at": "...", "id": "..."}
]
```

**Campagnes:**
- `campaign_keywords` ← Campagne keywords
- `campaign_source` ← Campagne source
- `campaign_matomo` ← Campagne matomo

### Module Existant

Structure actuelle dans `src/modules/demands`:
```
src/modules/demands/
├── commands.ts
├── constants.ts
├── types.ts
├── commands/
│   └── migrate-from-airtable.ts
└── server/
    ├── service.ts
    └── trpc-routes.ts
```

**tRPC route existante:**
```typescript
// src/modules/demands/server/trpc-routes.ts
export const demandsRouter = router({
  listAdmin: route.meta({ auth: { roles: ['admin'] } }).query(async () => {
    return await listAdmin();
  }),
});
```

---

## 📦 Plan d'Implémentation EPCT

### Phase 1: EXPLORE ✅ (Terminé)

Analyse complète effectuée:
- ✅ Schéma PostgreSQL existant identifié
- ✅ Structure du module demands analysée
- ✅ Pages existantes comme exemples repérées
- ✅ Mapping Airtable → PostgreSQL documenté

---

### Phase 2: PLAN (Ce document)

---

## 🔧 Étapes d'Implémentation

### Étape 1: Migration des Données (CLI)

**Objectif**: Migrer toutes les données d'Airtable vers PostgreSQL

#### 1.1 Compléter la commande de migration

**Fichier**: `src/modules/demands/commands/migrate-from-airtable.ts`

**Tâches**:
1. Implémenter la transformation Airtable → PostgreSQL selon `migration-table.md`
2. Générer le champ `history` basé sur les événements Airtable:
   - `creation` (Date de la demande)
   - `validation` (Gestionnaires validés si date présente)
   - `contact` (Recontacté par le gestionnaire si Oui)
   - `relance` (Relance envoyée + Commentaire relance)
   - `relance` (Seconde relance envoyée)
3. Peupler `user_id` en cherchant dans la table `users` par email
4. Calculer les champs BAN (`ban_valid`, `ban_address`, `ban_score`, `geom`)
5. Appeler `getAddressEligibilityHistoryEntry()` pour `batiment.eligibility_history`
6. Stocker **toutes** les données Airtable dans `legacy_values` (backup)

**Gestion des erreurs**:
- Transactions par batch (100 records)
- Logs détaillés des erreurs
- Dry-run mode pour validation
- Rapport de migration (created, updated, skipped, errors)

**Command CLI**:
```bash
pnpm cli demands migrate-from-airtable [--dry-run] [--batch-size=100]
```

#### 1.2 Enrichir la commande de migration

**Services requis**:
- `getAddressEligibilityHistoryEntry(lat, lon)` - Calcul historique d'éligibilité
- Géocodage BAN - Validation/normalisation adresse
- Lookup `users` par email

---

### Étape 2: Service Layer (PostgreSQL)

**Objectif**: CRUD complet sur la table `demands`

#### 2.1 Compléter le service

**Fichier**: `src/modules/demands/server/service.ts`

**Fonctions à implémenter**:

```typescript
// READ
export const listAdmin = async (): Promise<Demand[]>
export const listGestionnaire = async (
  user: User,
  filters?: DemandFilters
): Promise<Demand[]>
export const get = async (id: string): Promise<Demand>

// CREATE (utilisé par formulaire public)
export const create = async (
  input: DemandCreate,
  context?: ApiContext
): Promise<Demand>

// UPDATE
export const update = async (
  id: string,
  input: DemandUpdate,
  context?: ApiContext
): Promise<Demand>

// DELETE (admin uniquement)
export const remove = async (id: string): Promise<void>

// UTILS
export const getByAirtableId = async (
  airtableId: string
): Promise<Demand | undefined>

// STATS
export const getStatsByStatus = async (): Promise<Record<string, number>>
export const getStatsByGestionnaire = async (): Promise<Record<string, number>>
```

**Filtres à supporter** (listGestionnaire):
- Par status
- Par gestionnaires (depuis `legacy_values->>'Gestionnaires'`)
- Par région/département (depuis `batiment`)
- Par éligibilité (depuis `batiment.eligibility_history`)
- Par date de création
- Par validation (validated_at IS NOT NULL)

**Permissions**:
- **Admin**: Accès à toutes les demandes
- **Gestionnaire**: Uniquement demandes avec leur tag dans `legacy_values->>'Gestionnaires'`
- **Demo**: Paris uniquement (filtre spécial)

---

### Étape 3: tRPC Routes

**Objectif**: API type-safe pour les pages v2

#### 3.1 Compléter les routes tRPC

**Fichier**: `src/modules/demands/server/trpc-routes.ts`

**Routes à créer**:

```typescript
export const demandsRouter = router({
  // ADMIN
  listAdmin: route
    .meta({ auth: { roles: ['admin'] } })
    .query(async () => {
      return await listAdmin();
    }),

  get: route
    .meta({ auth: { roles: ['admin', 'gestionnaire'] } })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return await get(input.id);
    }),

  create: route
    .meta({ auth: { roles: ['admin'] } })
    .input(zDemandCreate)
    .mutation(async ({ input, ctx }) => {
      return await create(input, ctx);
    }),

  update: route
    .meta({ auth: { roles: ['admin', 'gestionnaire'] } })
    .input(z.object({
      id: z.string().uuid(),
      data: zDemandUpdate,
    }))
    .mutation(async ({ input, ctx }) => {
      return await update(input.id, input.data, ctx);
    }),

  delete: route
    .meta({ auth: { roles: ['admin'] } })
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await remove(input.id);
      return { success: true };
    }),

  // GESTIONNAIRE
  listGestionnaire: route
    .meta({ auth: { roles: ['admin', 'gestionnaire', 'demo'] } })
    .input(zDemandFilters)
    .query(async ({ input, ctx }) => {
      return await listGestionnaire(ctx.user!, input);
    }),

  // STATS
  statsByStatus: route
    .meta({ auth: { roles: ['admin'] } })
    .query(async () => {
      return await getStatsByStatus();
    }),

  statsByGestionnaire: route
    .meta({ auth: { roles: ['admin'] } })
    .query(async () => {
      return await getStatsByGestionnaire();
    }),
});
```

#### 3.2 Enregistrer dans le router principal

**Fichier**: `src/modules/trpc/trpc.config.ts`

```typescript
import { demandsRouter } from '@/modules/demands/server/trpc-routes';

export const appRouter = router({
  demands: demandsRouter,
  // ... existing routes
});
```

---

### Étape 4: Types et Constantes

**Objectif**: Schémas Zod et types TypeScript

#### 4.1 Définir les constantes

**Fichier**: `src/modules/demands/constants.ts`

**Enums et constantes**:
```typescript
// Status
export const demandStatuses = [
  'En attente de prise en charge',
  'Non réalisable',
  "En attente d'éléments du prospect",
  'Étude en cours',
  'Voté en AG',
  'Travaux en cours',
  'Réalisé',
  'Projet abandonné par le prospect',
] as const;

// Modes de chauffage
export const heatingModes = [
  'Électricité',
  'Gaz',
  'Fioul',
  'Autre / Je ne sais pas',
] as const;

// Types de chauffage
export const heatingTypes = [
  'Individuel',
  'Collectif',
  'Autre / Je ne sais pas',
] as const;

// Structures
export const structureTypes = [
  'Copropriété',
  'Tertiaire',
  'Logement individuel',
  'Bailleur social',
] as const;
```

#### 4.2 Schémas Zod

**Fichier**: `src/modules/demands/constants.ts`

```typescript
import { z } from 'zod';

// Schéma User (JSON)
export const zDemandUser = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  structure_type: z.string().optional(),
  structure_name: z.string().optional(),
});

// Schéma Batiment (JSON)
export const zDemandBatiment = z.object({
  source_address: z.string(),
  ban_valid: z.boolean().optional(),
  ban_address: z.string().optional(),
  ban_score: z.number().optional(),
  geom: z.any().optional(), // PostGIS geometry
  eligibility_history: z.array(z.any()).optional(),
  mode_chauffage: z.enum(heatingModes).optional(),
  type_chauffage: z.enum(heatingTypes).optional(),
  type: z.string().optional(),
  surface_m2: z.number().optional(),
  conso_gaz: z.number().optional(),
  nb_logements: z.number().optional(),
  company_type: z.string().optional(),
  company_name: z.string().optional(),
});

// Schéma History event
export const zDemandHistoryEvent = z.object({
  type: z.enum([
    'creation',
    'validation',
    'contact',
    'relance',
    'gestionnaires_modifies',
    'affectation_modifiee',
    'affectation_acceptee',
  ]),
  created_at: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
  id: z.string().uuid(),
});

// Schéma complet Demand
export const zDemand = z.object({
  id: z.string().uuid(),
  legacy_values: z.record(z.any()),
  created_at: z.string().datetime(),
  validated_at: z.string().datetime().nullable(),
  contacted_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime(),
  comment_gestionnaire: z.string().nullable(),
  comment_fcu: z.string().nullable(),
  history: z.array(zDemandHistoryEvent),
  user: zDemandUser.nullable(),
  user_id: z.string().uuid().nullable(),
  status: z.enum(demandStatuses).nullable(),
  assigned_to: z.string().nullable(),
  assigned_to_pending: z.string().nullable(),
  referrer: z.string().nullable(),
  referrer_other: z.string().nullable(),
  batiment: zDemandBatiment.nullable(),
  campaign_keywords: z.string().nullable(),
  campaign_source: z.string().nullable(),
  campaign_matomo: z.string().nullable(),
});

// Schéma Create
export const zDemandCreate = zDemand
  .omit({ id: true, created_at: true, updated_at: true, history: true })
  .partial();

// Schéma Update
export const zDemandUpdate = zDemandCreate.partial();

// Schéma Filters
export const zDemandFilters = z.object({
  status: z.enum(demandStatuses).optional(),
  gestionnaires: z.array(z.string()).optional(),
  region: z.string().optional(),
  department: z.string().optional(),
  eligibility: z.boolean().optional(),
  validated: z.boolean().optional(),
  contacted: z.boolean().optional(),
});

// Types
export type Demand = z.infer<typeof zDemand>;
export type DemandCreate = z.infer<typeof zDemandCreate>;
export type DemandUpdate = z.infer<typeof zDemandUpdate>;
export type DemandFilters = z.infer<typeof zDemandFilters>;
```

---

### Étape 5: Page Admin v2

**Objectif**: `/admin/demandes-v2` avec tRPC et table interactive

#### 5.1 Créer la page admin

**Fichier**: `src/pages/admin/demandes-v2.tsx`

**Basé sur**: `src/pages/admin/demandes.tsx` (exemple existant)

**Fonctionnalités**:
1. **Liste des demandes non validées** (validated_at IS NULL)
2. **Table interactive** avec colonnes:
   - Utilisateur (nom, prénom, email)
   - Adresse (depuis `batiment.source_address`)
   - Structure (depuis `user.structure_type`)
   - Distance réseau (depuis `batiment.eligibility_history`)
   - Gestionnaires recommandés (hors scope assignment rules)
   - Gestionnaires assignés (éditable inline)
   - Réseau (éditable inline)
   - Actions (Valider, Supprimer)
3. **Édition inline**:
   - `FCUTagAutocomplete` pour gestionnaires
   - Champs réseau (nom, distance, id)
4. **Map intégrée** (panneau droit):
   - Affichage des demandes sur carte
   - Filtre par sélection
5. **Bouton "Valider"**:
   - Met à jour `validated_at = NOW()`
   - Ajoute événement dans `history`

**Pattern tRPC**:
```typescript
const { data: demands, refetch } = trpc.demands.listAdmin.useQuery();

const updateMutation = trpc.demands.update.useMutation({
  onSuccess: () => {
    refetch();
  },
});

const handleValidate = async (demandId: string) => {
  await updateMutation.mutateAsync({
    id: demandId,
    data: {
      validated_at: new Date().toISOString(),
      // Ajouter événement dans history
    },
  });
};
```

**Authentication**:
```typescript
export const getServerSideProps = withAuthentication(['admin']);
```

#### 5.2 Composants réutilisables

**Utiliser les composants existants**:
- `TableSimple` - Table avec filtres, tri, virtualisation
- `FCUTagAutocomplete` - Sélection gestionnaires
- `ModalSimple` - Modales de confirmation
- `AsyncButton` - Boutons avec loading

---

### Étape 6: Page Gestionnaire v2

**Objectif**: `/pro/demandes-v2` avec tRPC et gestion des demandes

#### 6.1 Créer la page gestionnaire

**Fichier**: `src/pages/pro/demandes-v2.tsx`

**Basé sur**: `src/pages/pro/demandes.tsx` (exemple existant)

**Fonctionnalités**:
1. **Liste des demandes validées** filtrées par gestionnaire
2. **Filtres**:
   - Status
   - Structure
   - Mode de chauffage
   - Distance réseau
   - Date de création
3. **Filtres rapides**:
   - Toutes les demandes
   - Haut potentiel (collectif <100m, >100 logements, tertiaire)
   - À traiter (status='En attente de prise en charge' AND NOT contacted)
   - En PDP
4. **Table interactive** avec colonnes:
   - Utilisateur
   - Adresse
   - Structure
   - Distance
   - Status (éditable dropdown)
   - Contact fait (éditable checkbox)
   - Commentaire (éditable inline)
   - Actions (Email, Historique)
5. **Modal Email**:
   - Formulaire d'envoi email avec templates
   - Historique emails envoyés (depuis table `utilisateurs_emails` - **hors scope PostgreSQL**)
6. **Map intégrée** (panneau droit)
7. **Export XLSX**

**Pattern tRPC**:
```typescript
const [filters, setFilters] = useState<DemandFilters>({});

const { data: demands, refetch } = trpc.demands.listGestionnaire.useQuery(filters);

const updateMutation = trpc.demands.update.useMutation({
  onSuccess: () => {
    refetch();
  },
});

const handleStatusChange = async (demandId: string, newStatus: string) => {
  await updateMutation.mutateAsync({
    id: demandId,
    data: { status: newStatus },
  });
};
```

**Calcul haut_potentiel**:
```typescript
const isHautPotentiel = (demand: Demand) => {
  const gestionnaires = demand.legacy_values.Gestionnaires || [];
  const isParis = gestionnaires.includes('Paris');
  const distanceThreshold = isParis ? 60 : 100;

  const heatingType = demand.batiment?.type_chauffage;
  const distance = demand.batiment?.eligibility_history?.[0]?.distance;
  const nbLogements = demand.batiment?.nb_logements;
  const structure = demand.user?.structure_type;

  return (
    heatingType === 'Collectif' &&
    (distance < distanceThreshold || nbLogements >= 100 || structure === 'Tertiaire')
  );
};
```

**Authentication**:
```typescript
export const getServerSideProps = withAuthentication(['gestionnaire', 'demo', 'admin']);
```

---

### Étape 7: Nettoyage Airtable

**Objectif**: Supprimer toutes les références à Airtable (hors emails/relances)

#### 7.1 Fichiers à NE PAS modifier (emails/relances)

**Conserver l'usage d'Airtable pour**:
- `src/pages/api/managerEmail.ts` - Emails gestionnaires → Table `UTILISATEURS_EMAILS`
- `src/pages/satisfaction.tsx` - Page de relance → Table `RELANCE`
- `src/server/services/manager.ts` - Fonctions de relance:
  - `dailyNewManagerMail()`
  - `weeklyOldManagerMail()`
  - `dailyRelanceMail()`
  - `updateRelanceAnswer()`

**Raison**: Ces tables Airtable (`UTILISATEURS_EMAILS`, `RELANCE`) sont des features séparées qui peuvent être migrées plus tard.

#### 7.2 Références Airtable à SUPPRIMER (après migration)

**À désactiver/supprimer APRÈS validation de la migration**:
- `src/server/services/manager.ts` - Fonctions CRUD demandes (remplacées par `demands/server/service.ts`)
- `src/pages/api/admin/demands.ts` - Route REST admin (remplacée par tRPC)
- `src/pages/api/demands/[demandId].ts` - Route REST update (remplacée par tRPC)
- `src/pages/api/airtable/records/index.ts` - Création demandes via Airtable (remplacée par tRPC)
- `src/hooks/useContactFormFCU.ts` - Hook formulaire (à adapter pour PostgreSQL)

**Process de suppression**:
1. Valider que les pages v2 fonctionnent
2. Rediriger `/admin/demandes` → `/admin/demandes-v2`
3. Rediriger `/pro/demandes` → `/pro/demandes-v2`
4. Supprimer les anciennes pages
5. Supprimer les routes REST obsolètes
6. Supprimer les services Airtable obsolètes

---

## 🧪 Phase 4: TEST

### Tests à Effectuer

#### 1. Migration CLI
- [ ] Dry-run réussit sans erreurs
- [ ] Migration complète transfère toutes les demandes
- [ ] Champs correctement mappés
- [ ] `history` correctement généré
- [ ] `user_id` correctement populé
- [ ] `batiment.eligibility_history` correctement calculé
- [ ] `legacy_values` contient toutes les données d'origine

#### 2. Service Layer
- [ ] `listAdmin()` retourne toutes les demandes
- [ ] `listGestionnaire()` filtre par tags gestionnaires
- [ ] Filtres fonctionnent (status, région, date, etc.)
- [ ] `create()` crée une demande avec historique
- [ ] `update()` met à jour et ajoute événement dans history
- [ ] `remove()` supprime correctement
- [ ] Permissions respectées (admin vs gestionnaire)

#### 3. tRPC Routes
- [ ] Authentication fonctionne (rôles admin, gestionnaire, demo)
- [ ] Toutes les queries retournent les bonnes données
- [ ] Mutations mettent à jour la base
- [ ] Erreurs gérées proprement (404, 403, etc.)

#### 4. Page Admin v2
- [ ] Liste affiche les demandes non validées
- [ ] Édition inline fonctionne (gestionnaires, réseau)
- [ ] Map affiche les demandes correctement
- [ ] Bouton "Valider" met à jour `validated_at`
- [ ] Suppression fonctionne
- [ ] Filtres/tri fonctionnent

#### 5. Page Gestionnaire v2
- [ ] Liste filtrée par gestionnaire tags
- [ ] Filtres rapides fonctionnent (haut potentiel, à traiter, PDP)
- [ ] Édition status/contact/commentaire fonctionne
- [ ] Map intégrée fonctionne
- [ ] Export XLSX fonctionne
- [ ] Modal email s'ouvre (même si emails en Airtable)

#### 6. TypeScript & Lint
- [ ] `pnpm typecheck` passe sans erreurs
- [ ] `pnpm lint` passe sans erreurs
- [ ] Types Kysely générés correctement

---

## 📋 Checklist d'Implémentation

### Phase 1: Migration des Données
- [ ] **Étape 1.1**: Implémenter transformation Airtable → PostgreSQL
- [ ] **Étape 1.2**: Ajouter génération `history`
- [ ] **Étape 1.3**: Lookup `user_id` par email
- [ ] **Étape 1.4**: Calculer champs BAN
- [ ] **Étape 1.5**: Appeler `getAddressEligibilityHistoryEntry()`
- [ ] **Test**: Dry-run migration
- [ ] **Test**: Migration complète en dev

### Phase 2: Service Layer
- [ ] **Étape 2.1**: Implémenter `listAdmin()`
- [ ] **Étape 2.2**: Implémenter `listGestionnaire()` avec filtres
- [ ] **Étape 2.3**: Implémenter `get()`, `create()`, `update()`, `remove()`
- [ ] **Étape 2.4**: Implémenter stats functions
- [ ] **Test**: Tests unitaires service
- [ ] **Test**: Permissions admin vs gestionnaire

### Phase 3: tRPC Routes
- [ ] **Étape 3.1**: Créer toutes les routes tRPC
- [ ] **Étape 3.2**: Enregistrer dans `appRouter`
- [ ] **Test**: Tester routes avec Postman/curl
- [ ] **Test**: Authentication roles

### Phase 4: Types & Constantes
- [ ] **Étape 4.1**: Définir enums et constantes
- [ ] **Étape 4.2**: Créer schémas Zod
- [ ] **Test**: Validation Zod fonctionne

### Phase 5: Page Admin v2
- [ ] **Étape 5.1**: Créer structure page
- [ ] **Étape 5.2**: Intégrer tRPC queries/mutations
- [ ] **Étape 5.3**: Implémenter table interactive
- [ ] **Étape 5.4**: Intégrer map
- [ ] **Étape 5.5**: Implémenter édition inline
- [ ] **Étape 5.6**: Bouton validation
- [ ] **Test**: Page fonctionne de bout en bout

### Phase 6: Page Gestionnaire v2
- [ ] **Étape 6.1**: Créer structure page
- [ ] **Étape 6.2**: Intégrer tRPC queries/mutations
- [ ] **Étape 6.3**: Implémenter table interactive
- [ ] **Étape 6.4**: Implémenter filtres et filtres rapides
- [ ] **Étape 6.5**: Intégrer map
- [ ] **Étape 6.6**: Modal email (placeholder)
- [ ] **Étape 6.7**: Export XLSX
- [ ] **Test**: Page fonctionne de bout en bout

### Phase 7: Validation & Nettoyage
- [ ] **Étape 7.1**: Tests E2E complets
- [ ] **Étape 7.2**: Validation données migrées
- [ ] **Étape 7.3**: Performance tests
- [ ] **Étape 7.4**: Redirections anciennes pages
- [ ] **Étape 7.5**: Suppression code Airtable obsolète

---

## ⚠️ Points d'Attention

### Données Critiques
- ⚠️ **Backup Airtable**: Exporter toutes les données avant migration
- ⚠️ **legacy_values**: TOUJOURS rempli pour rollback possible
- ⚠️ **user_id**: Gérer le cas où l'email n'existe pas dans `users`
- ⚠️ **history**: Ne jamais écraser, toujours append
- ⚠️ **Validation**: Utiliser Zod avant toute insertion

### Performance
- 📊 **Indexes**: Vérifier que tous les indexes sont créés
- 📊 **GIN indexes**: Essentiels pour JSONB queries (déjà créés)
- 📊 **Batch processing**: Limiter à 100 records/batch en migration
- 📊 **Virtual scrolling**: Utiliser `VirtualList` pour grandes listes

### Compatibilité
- 🔄 **Emails/Relances**: Rester en Airtable pour l'instant
- 🔄 **Assignment rules**: Hors scope (Phase 2)
- 🔄 **Formulaire public**: À adapter plus tard pour PostgreSQL
- 🔄 **Anciennes pages**: Ne pas modifier, créer -v2

### Rollback
- 🔙 **Plan B**: Si problème, remettre anciennes pages
- 🔙 **Data integrity**: `legacy_values` permet de restaurer
- 🔙 **No destructive actions**: Ne pas supprimer Airtable avant validation complète

---

## ✅ Critères de Validation

### Migration
- ✅ Toutes les demandes Airtable sont dans PostgreSQL
- ✅ Aucune perte de données (vérifier count)
- ✅ `legacy_values` identique à données Airtable
- ✅ `history` correctement généré pour chaque demande
- ✅ `user_id` populé pour emails existants
- ✅ Performance acceptable (<30s pour migration complète)

### Fonctionnel
- ✅ Admin peut lister/filtrer/éditer les demandes non validées
- ✅ Admin peut valider une demande
- ✅ Admin peut supprimer une demande
- ✅ Gestionnaire peut lister ses demandes
- ✅ Gestionnaire peut éditer status/contact/commentaire
- ✅ Filtres rapides fonctionnent (haut potentiel, à traiter, PDP)
- ✅ Map affiche les demandes correctement
- ✅ Export XLSX fonctionne

### Technique
- ✅ Types Kysely générés automatiquement
- ✅ Pas d'erreurs TypeScript
- ✅ Pas d'erreurs de lint
- ✅ tRPC routes documentées
- ✅ Migration réversible (rollback possible)

---

## 🚀 Ordre d'Exécution

1. **Semaine 1**: Migration CLI + Service Layer + tRPC Routes
2. **Semaine 2**: Page Admin v2
3. **Semaine 3**: Page Gestionnaire v2
4. **Semaine 4**: Tests, validation, nettoyage

---

**Prochaine étape**: Validation du plan avant implémentation

