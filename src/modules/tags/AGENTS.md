# Tags Module

Gestion des tags gestionnaires pour associer les demandes avec les opérateurs.

## Structure

```
tags/
├── AGENTS.md                       # Ce fichier
├── constants.ts                    # Styles et utilitaires partagés
├── server/
│   ├── service.ts                  # Opérations base de données
│   └── api-admin.ts                # Points d'API admin
├── client/
│   ├── useFCUTags.tsx              # Hook de récupération des tags
│   ├── FCUTagAutocomplete.tsx      # Composant de sélection de tags
│   └── admin/
│       └── TagsPage.tsx            # Interface admin de gestion
└── .env.example                    # Variables d'environnement
```

## Objectif

Les tags permettent de connecter les demandes d'éligibilité avec les gestionnaires (opérateurs) :

- **Assignation automatique** : Basée sur ville, métropole et réseaux proches
- **Gestion manuelle** : Interface admin pour création de tags et assignation utilisateurs
- **Organisation visuelle** : Code couleur par type de tag

## Types de Tags

| Type | Description | Couleur | Auto-assignation |
|------|-------------|---------|------------------|
| `ville` | Tag de ville | Vert | ✅ Ville de la demande |
| `metropole` | Métropole/CA/CU | Bleu | ✅ Si existe (format: NomVille + M) |
| `gestionnaire` | Opérateur réseau | Violet | ❌ Manuel uniquement |
| `reseau` | Réseau spécifique | Rouge | ✅ Depuis le réseau le plus proche |

## API Client

### Hooks

#### `useFCUTags()`

Hook principal pour récupérer tous les tags avec les utilisateurs associés.

```typescript
import { useFCUTags } from '@/modules/tags/client/useFCUTags';

function TagSelector() {
  const { tags, tagsOptions } = useFCUTags();
  
  // tagsOptions prêt pour le composant ChipAutoComplete
  return <FCUTagAutocomplete options={tagsOptions} />;
}
```

**Retourne :**
- `tags: TagWithUsers[]` - Tags avec utilisateurs associés
- `tagsOptions: ChipOption[]` - Options formatées pour les composants de sélection

**Caractéristiques :**
- Cache de 60 secondes via `staleTime`
- Utilise `fcuTagsToChipOptions` pour transformer les données
- Inclut le nombre d'utilisateurs dans le label
- Endpoint : `/api/admin/tags`

### Composants

#### `FCUTagAutocomplete`

Composant principal de sélection de tags avec autocomplétion et styles visuels.

```typescript
import FCUTagAutocomplete from '@/modules/tags/client/FCUTagAutocomplete';

function MyForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  return (
    <FCUTagAutocomplete
      multiple
      value={selectedTags}
      onChange={setSelectedTags}
      undismissibles={['VILLE_PARIS']} // Tags non supprimables
    />
  );
}
```

**Propriétés spécifiques :**
- `undismissibles?: string[]` - Tags non supprimables (affichent badge API)
- Hérite de toutes les props `ChipAutoCompleteProps` sauf `options` et `defaultOption`
- Support mode simple et multiple automatiquement détecté

**Fonctionnalités :**
- Autocomplétion intelligente avec hook `useFCUTags` intégré
- Badges pour tags non supprimables (badge API)
- Styles différenciés par type via `tagsGestionnairesStyleByType`
- Tooltip avec emails des gestionnaires
- Options dismissible/non-dismissible selon `undismissibles`

### Constants et Utilitaires

#### `tagsGestionnairesStyleByType`

Styles colorés par type de tag définis dans `constants.ts`.

```typescript
export const tagsGestionnairesStyleByType = {
  ville: { 
    title: 'Ville', 
    className: 'not-[&:hover]:bg-[#42a835]! hover:bg-[#348029]! text-white!' 
  },
  metropole: { 
    title: 'Métropole', 
    className: 'not-[&:hover]:bg-[#3562bb]! hover:bg-[#294c94]! text-white!' 
  },
  gestionnaire: { 
    title: 'Gestionnaire tête de réseau', 
    className: 'not-[&:hover]:bg-[#7a40b4]! hover:bg-[#613390]! text-white!' 
  },
  reseau: { 
    title: 'Réseau spécifique', 
    className: 'not-[&:hover]:bg-[#ba474c]! hover:bg-[#94383c]! text-white!' 
  },
  '': { 
    title: 'Inconnu', 
    className: 'not-[&:hover]:bg-[#787878]! hover:bg-[#606060]! text-white!' 
  },
};
```

#### `fcuTagsToChipOptions(tags)`

Transforme les tags serveur en options pour les composants de sélection.

```typescript
export const fcuTagsToChipOptions = (tags: TagWithUsers[]): ChipOption[] =>
  tags.map((tag) => ({
    key: tag.name,
    label: `${tag.name} (${tag.users?.length ?? 0})`,
    className: tagsGestionnairesStyleByType[tag.type]?.className,
    title: tag.users?.map((user) => user.email).join(', '),
  }));
```

#### `defaultTagChipOption`

Option par défaut pour les composants de sélection de tags.

```typescript
export const defaultTagChipOption: ChipOption = { 
  ...tagsGestionnairesStyleByType[''], 
  title: '', 
  key: '', 
  label: '' 
};
```

## API Serveur

### Opérations Base de Données (`server/service.ts`)

#### `list()`

Récupère tous les tags (informations basiques uniquement).

```typescript
import { list } from '@/modules/tags/server/service';

const result = await list();
// { items: Tag[], count: number }
```

**Implémentation :**
- Tri par nom alphabétique (`orderBy('t.name')`)
- Retourne structure paginée standard
- Pas de jointure avec users pour optimiser les performances

#### `listWithUsers()`

Récupère tous les tags avec les utilisateurs actifs associés.

```typescript
import { listWithUsers } from '@/modules/tags/server/service';

const result = await listWithUsers();
// { items: TagWithUsers[], count: number }
```

**Implémentation SQL complexe :**
```sql
SELECT 
  t.id, t.name, t.type, t.created_at, t.updated_at,
  COALESCE(
    JSON_AGG(
      json_build_object(
        'id', u.id,
        'email', u.email, 
        'tags', u.gestionnaires
      )
    ) FILTER (WHERE u.email IS NOT NULL AND active IS TRUE),
    '[]'::json
  ) as users
FROM tags as t
LEFT JOIN users as u ON t.name = ANY(u.gestionnaires)
GROUP BY t.id, t.name, t.type, t.created_at, t.updated_at
ORDER BY t.name
```

#### CRUD Operations

```typescript
import { create, update, remove } from '@/modules/tags/server/service';

// Créer un tag
await create({ name: 'VILLE_PARIS', type: 'ville' });

// Mettre à jour un tag  
await update(tagId, { name: 'VILLE_PARIS_UPDATED', type: 'metropole' });

// Supprimer un tag
await remove(tagId);
```

**Validation Zod :**
```typescript
export const validation = {
  create: z.object({
    name: z.string(),
    type: z.string().optional(),
  }),
  update: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
  }),
};
```

### API Admin (`server/api-admin.ts`)

**Endpoint** : `/api/admin/tags/[[...slug]]`

Configuration CRUD utilisant le helper standard :

```typescript
const { GET, POST, PUT, DELETE, _types } = crud({
  ...tagsService,
  list: tagsService.listWithUsers, // Override pour inclure users
});

export type TagsResponse = typeof _types;
```

**Routes disponibles :**
- `GET /api/admin/tags` - Liste avec utilisateurs (utilise `listWithUsers`)
- `POST /api/admin/tags` - Création avec validation
- `PUT /api/admin/tags/[id]` - Modification avec validation
- `DELETE /api/admin/tags/[id]` - Suppression

**Authentification :** Requiert rôle `admin` via `requireAuthentication`

## Interface Admin

### TagsPage (`client/admin/TagsPage.tsx`)

Interface complète de gestion des tags utilisant `useCrud` pour les opérations.

**Hook de données :**
```typescript
const {
  items: tags,
  isLoading,
  create,
  update: updateCrud,
  delete: deleteCrud,
} = useCrud<TagsResponse, TagWithUsers[]>('/api/admin/tags');
```

**Colonnes du tableau (`TableSimple`) :**

1. **Nom** - Tag coloré avec `tagsGestionnairesStyleByType`, tri alphabétique français
2. **Type** - Libellé lisible via mapping, filtre par facettes
3. **Gestionnaires associés** - Liste des emails en `Tag` components
4. **Date de création** - `cellType: 'Date'` pour formatage automatique
5. **Actions** - Boutons éditer/supprimer avec icônes DSFR

**Fonctionnalités avancées :**
- `enableGlobalFilter` pour recherche dans tous les champs
- `initialSortingState` par nom
- Pagination et tri automatiques via `TableSimple`
- Loading states et gestion d'erreurs

**Modales de gestion :**

```typescript
// États des modales avec Dialog component
const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);  
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

// Données en cours d'édition
const [editingTag, setEditingTag] = useState<TagWithUsers | null>(null);
const [deletingTag, setDeletingTag] = useState<TagWithUsers | null>(null);
```

**Validation et gestion d'erreurs :**

Utilise `toastErrors` pour la gestion centralisée des erreurs :

```typescript
const handleCreate = toastErrors(
  async () => {
    if (!newTagName.trim()) return;
    await create({ name: newTagName.trim(), type: newTagType });
    resetCreateDialog();
  },
  (err: any) => (err.code === 'unique_constraint_violation' 
    ? 'Ce tag existe déjà' 
    : err.message)
);
```

**Formulaires modales :**
- Input DSFR pour nom avec validation required
- Select DSFR pour type avec options prédéfinies
- Boutons primaires/secondaires avec états loading

## Schéma Base de Données

```sql
-- Table des tags
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,  -- Contrainte unique pour éviter doublons
  type VARCHAR CHECK (type IN ('ville', 'metropole', 'gestionnaire', 'reseau')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_tags_type ON tags(type);
CREATE INDEX idx_tags_name ON tags(name);

-- Relation avec les utilisateurs via array PostgreSQL
ALTER TABLE users ADD COLUMN gestionnaires TEXT[];
CREATE INDEX idx_users_gestionnaires ON users USING GIN(gestionnaires);
```

## Exemples d'Utilisation

### Intégration dans Formulaire avec React Hook Form

```typescript
import FCUTagAutocomplete from '@/modules/tags/client/FCUTagAutocomplete';
import { useForm } from '@/components/form/react-form/useForm';

function DemandForm() {
  const form = useForm({
    defaultValues: { gestionnaires: [] }
  });
  
  return (
    <Form form={form}>
      <Field.Custom name="gestionnaires">
        {({ field }) => (
          <FCUTagAutocomplete
            multiple
            value={field.value}
            onChange={field.onChange}
            placeholder="Sélectionner des gestionnaires"
            undismissibles={field.suggestedValue || []}
          />
        )}
      </Field.Custom>
    </Form>
  );
}
```

### Assignation Automatique de Tags

```typescript
import { listWithUsers } from '@/modules/tags/server/service';

async function assignTagsToUser(userId: number, cityName: string) {
  const { items: tags } = await listWithUsers();
  
  // Tags automatiques basés sur localisation
  const cityTag = tags.find(t => t.name === `VILLE_${cityName.toUpperCase()}`);
  const metropoleTag = tags.find(t => t.name === `${cityName.toUpperCase()}_M`);
  
  const assignedTags = [cityTag?.name, metropoleTag?.name].filter(Boolean);
  
  // Mise à jour via Kysely
  await kdb
    .updateTable('users')
    .set({ gestionnaires: assignedTags })
    .where('id', '=', userId)
    .execute();
}
```

### Recherche et Filtrage Avancé

```typescript
// Recherche par type avec Kysely
const villesTags = await kdb
  .selectFrom('tags')
  .selectAll()
  .where('type', '=', 'ville')
  .orderBy('name')
  .execute();

// Utilisateurs ayant un tag spécifique (PostgreSQL ANY)
const usersWithTag = await kdb
  .selectFrom('users')
  .selectAll()
  .where(sql`${'VILLE_PARIS'} = ANY(gestionnaires)`)
  .where('active', '=', true)
  .execute();

// Statistiques par type de tag
const tagStats = await kdb
  .selectFrom('tags')
  .leftJoin('users', (join) => 
    join.on(sql`tags.name = ANY(users.gestionnaires)`)
  )
  .select([
    'tags.type',
    sql`COUNT(DISTINCT tags.id)`.as('total_tags'),
    sql`COUNT(DISTINCT users.id)`.as('total_users')
  ])
  .groupBy('tags.type')
  .execute();
```

## Compatibilité et Re-exports

Pour maintenir la compatibilité avec l'architecture existante :

### Pages API
```typescript
// /pages/api/admin/tags/[[...slug]].ts
export { default } from '@/modules/tags/server/api-admin';
export type { TagsResponse } from '@/modules/tags/server/api-admin';
```

### Pages Admin
```typescript  
// /pages/admin/tags.tsx
import TagsPage from '@/modules/tags/client/admin/TagsPage';
export default TagsPage;
export { getServerSideProps } from '@/modules/tags/client/admin/TagsPage';
```

### Composants
```typescript
// /components/form/FCUTagAutocomplete.tsx
export { default } from '@/modules/tags/client/FCUTagAutocomplete';
export type { FCUTagAutocompleteProps } from '@/modules/tags/client/FCUTagAutocomplete';
```

## Architecture et Séparation des Responsabilités

### Imports Internes
- Utilisation de chemins relatifs `./` et `../` au lieu de `@/modules/`
- Séparation stricte client/server - pas d'imports server dans client
- Types partagés via `server/service.ts` et `server/api-admin.ts`

### Organisation des Fichiers
- `constants.ts` : Styles et utilitaires partagés client/server
- `client/useFCUTags.tsx` : Hook réutilisable isolé
- `client/FCUTagAutocomplete.tsx` : Composant autonome avec hook intégré
- `server/service.ts` : Logique métier et accès données
- `server/api-admin.ts` : Couche API avec types exportés

## Variables d'Environnement

```bash
# Tags module
# Aucune variable d'environnement spécifique requise pour ce module
# Les tags utilisent la base de données principale configurée globalement
```

Le module tags ne nécessite aucune configuration environnementale spécifique car il s'appuie entièrement sur la base de données PostgreSQL principale du projet et les APIs standard du framework.