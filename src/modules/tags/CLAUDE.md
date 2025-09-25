# Tags Module

Management of gestionnaire tags for associating demands with operators.

## Structure

```
tags/
├── CLAUDE.md                    # This file
├── client.ts                    # Client hooks and utilities
├── server/
│   ├── service.ts              # Database operations
│   └── api-admin.ts            # Admin API endpoints
├── client/
│   ├── components/
│   │   └── FCUTagAutocomplete.tsx  # Tag selection component
│   └── admin/
│       └── TagsPage.tsx        # Admin tags management
├── types.ts                    # Type definitions
└── .env.example                # Environment variables
```

## Purpose

Tags are used to connect eligibility demands with gestionnaires (operators):

- **Automatic assignment**: Based on city, metropole, and nearby networks
- **Manual management**: Admin interface for tag creation and user assignment
- **Visual organization**: Color-coded by tag type (ville, metropole, gestionnaire, reseau)

## Tag Types

| Type | Description | Color | Auto-assignment |
|------|-------------|-------|-----------------|
| `ville` | City tag | Green | ✅ City of the demand |
| `metropole` | Metropole/CA/CU | Blue | ✅ If exists (format: CityName + M) |
| `gestionnaire` | Network operator | Purple | ❌ Manual only |
| `reseau` | Specific network | Red | ✅ From closest network |

## Client API

### Hooks

#### `useFCUTags()`

Fetches all tags with associated users for selection interfaces.

```typescript
import { useFCUTags } from '@/modules/tags/client';

function TagSelector() {
  const { tags, tagsOptions } = useFCUTags();
  
  // tagsOptions ready for ChipAutoComplete component
  return <FCUTagAutocomplete options={tagsOptions} />;
}
```

### Components

#### `FCUTagAutocomplete`

Tag selection component with autocomplete and visual styling.

```typescript
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';

function MyForm() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  return (
    <FCUTagAutocomplete
      multiple
      value={selectedTags}
      onChange={setSelectedTags}
      undismissibles={['VILLE_PARIS']} // Tags that cannot be removed
    />
  );
}
```

Properties:
- `multiple?: boolean` - Allow multiple selection
- `value: string | string[]` - Selected tag(s)
- `onChange: (value) => void` - Selection handler
- `undismissibles?: string[]` - Tags that cannot be removed (show API badge)

### Styling

Tags are color-coded based on type via `tagsGestionnairesStyleByType`:

```typescript
export const tagsGestionnairesStyleByType = {
  ville: { title: 'Ville', className: '[&:not(:hover)]:!bg-[#42a835]' },
  metropole: { title: 'Métropole', className: '[&:not(:hover)]:!bg-[#3562bb]' },
  gestionnaire: { title: 'Gestionnaire', className: '[&:not(:hover)]:!bg-[#7a40b4]' },
  reseau: { title: 'Réseau', className: '[&:not(:hover)]:!bg-[#ba474c]' },
};
```

## Server API

### Database Operations

#### `list()`

Fetch all tags (basic info only).

```typescript
import { list } from '@/modules/tags/server/service';

const result = await list();
// { items: Tag[], count: number }
```

#### `listWithUsers()`

Fetch all tags with associated active users.

```typescript
import { listWithUsers } from '@/modules/tags/server/service';

const result = await listWithUsers();
// { items: TagWithUsers[], count: number }
```

#### `create(data)`, `update(id, data)`, `remove(id)`

CRUD operations using base model pattern.

```typescript
import { create, update, remove } from '@/modules/tags/server/service';

// Create tag
await create({ name: 'VILLE_PARIS', type: 'ville' });

// Update tag
await update(tagId, { name: 'VILLE_PARIS_UPDATED' });

// Delete tag
await remove(tagId);
```

### Admin API

**Endpoint**: `/api/admin/tags`

CRUD operations for admin interface using the standard crud helper:

- `GET /api/admin/tags` - List all tags with users
- `POST /api/admin/tags` - Create new tag
- `PUT /api/admin/tags/[id]` - Update tag
- `DELETE /api/admin/tags/[id]` - Delete tag

## Admin Interface

The admin interface (`TagsPage`) provides:

### Features
- **Table view** with filtering and sorting
- **Color-coded tags** by type
- **User associations** display
- **Create/Edit/Delete** operations
- **Search and filter** capabilities

### Tag Management
1. **Create**: Name + type selection
2. **Edit**: Modify name and type
3. **Delete**: Remove tag (checks for dependencies)
4. **View users**: See all gestionnaires associated with each tag

### Validation
- **Unique names**: Prevents duplicate tag creation
- **Required fields**: Name is mandatory
- **Type validation**: Must be one of the defined types

## Auto-assignment Algorithm

When an eligibility demand is submitted:

1. **City tag**: Automatically assigned based on demand location
2. **Metropole tag**: Added if exists (format: `CITYNAME_M`)
3. **Network tags**: Retrieved from closest eligible network
4. **Gestionnaire tags**: Manual assignment only

## Database Schema

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  type VARCHAR, -- 'ville', 'metropole', 'gestionnaire', 'reseau'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users have gestionnaires array field linking to tag names
ALTER TABLE users ADD COLUMN gestionnaires TEXT[];
```

## Usage Examples

### Form Integration

```typescript
import { useFCUTags } from '@/modules/tags/client';

function DemandForm() {
  const { tagsOptions } = useFCUTags();
  
  return (
    <Form>
      <Field.Custom name="gestionnaires">
        {({ field }) => (
          <FCUTagAutocomplete
            multiple
            value={field.value}
            onChange={field.onChange}
            placeholder="Sélectionner des gestionnaires"
          />
        )}
      </Field.Custom>
    </Form>
  );
}
```

### Programmatic Tag Assignment

```typescript
import { listWithUsers } from '@/modules/tags/server/service';

async function assignTagsToUser(userId: number, cityName: string) {
  const tags = await listWithUsers();
  
  // Find city and metropole tags
  const cityTag = tags.items.find(t => t.name === `VILLE_${cityName.toUpperCase()}`);
  const metropoleTag = tags.items.find(t => t.name === `${cityName.toUpperCase()}_M`);
  
  const assignedTags = [cityTag?.name, metropoleTag?.name].filter(Boolean);
  
  // Update user with assigned tags
  await updateUser(userId, { gestionnaires: assignedTags });
}
```