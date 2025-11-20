## Database

**Stack**: PostgreSQL 16/18+ with PostGIS 3.5+ for geospatial operations  
**ORM**: Kysely for type-safe queries, use raw SQL if the query is complex
**Import**: `import { kdb, sql } from '@/server/db/kysely'`  
**Types**: Auto-generated in `src/server/db/kysely/database.ts`

## Basic Queries

### Select
```typescript
// Select specific columns (preferred)
const users = await kdb
  .selectFrom('users')
  .select(['id', 'email', 'role'])
  .where('active', '=', true)
  .execute();

// With ordering and pagination
const results = await kdb
  .selectFrom('demands')
  .selectAll()
  .orderBy('created_at', 'desc')
  .limit(20)
  .offset(0)
  .execute();

// Get single result
const user = await kdb
  .selectFrom('users')
  .select(['id', 'email'])
  .where('id', '=', userId)
  .executeTakeFirstOrThrow(); // or .executeTakeFirst() for optional
```

### Insert
```typescript
const [record] = await kdb
  .insertInto('jobs')
  .values({
    type: 'build_tiles',
    status: 'pending',
    data: { name: 'tiles' },
    user_id: ctx.user.id,
  })
  .returningAll()
  .execute();
```

### Update
```typescript
const updated = await kdb
  .updateTable('demands')
  .set({ status: 'processed' })
  .where('id', '=', demandId)
  .returningAll()
  .executeTakeFirstOrThrow();

// JSONB merge (|| operator)
await kdb
  .updateTable('demands')
  .set({
    legacy_values: sql`legacy_values || ${JSON.stringify(values)}::jsonb`,
  })
  .where('id', '=', id)
  .execute();
```

### Delete
```typescript
await kdb
  .deleteFrom('jobs')
  .where('status', '=', 'completed')
  .execute();
```

## Advanced Patterns

### Conditional Queries (.$if)
```typescript
let query = kdb.selectFrom('demands').selectAll();

if (filters.status) {
  query = query.where('status', '=', filters.status);
}

// Kysely helper (preferred)
const demands = await kdb
  .selectFrom('demands')
  .selectAll()
  .$if(user.role === 'gestionnaire', (qb) =>
    qb.where(sql`legacy_values->'Gestionnaires'`, '?|', sql.val(user.gestionnaires))
  )
  .execute();
```

### Joins
```typescript
const records = await kdb
  .selectFrom('demands')
  .innerJoin('pro_eligibility_tests_addresses', 'pro_eligibility_tests_addresses.demand_id', 'demands.id')
  .selectAll('demands')
  .select(sql`to_jsonb(pro_eligibility_tests_addresses)`.as('testAddress'))
  .execute();
```

### Aggregations
```typescript
// Count
const total = await kdb
  .selectFrom('jobs')
  .select(kdb.fn.count<string>('id').as('count'))
  .executeTakeFirstOrThrow();

// Count with alias
const result = await kdb
  .selectFrom('users')
  .select((eb) => eb.fn.countAll().as('total_count'))
  .executeTakeFirstOrThrow();
```

### CTEs (WITH clauses)
```typescript
const result = await kdb
  .with('filtered_users', (db) =>
    db.selectFrom('users').select(['id', 'email']).where('active', '=', true)
  )
  .selectFrom('filtered_users')
  .selectAll()
  .execute();
```

### Transactions
```typescript
// Atomic operations
await kdb.transaction().execute(async (trx) => {
  // Select with lock
  const job = await trx
    .selectFrom('jobs')
    .selectAll()
    .where('status', '=', 'pending')
    .forUpdate()
    .skipLocked()
    .executeTakeFirst();

  if (job) {
    await trx
      .updateTable('jobs')
      .set({ status: 'processing' })
      .where('id', '=', job.id)
      .execute();
  }

  return job;
});
```

## PostGIS (Geospatial)

**Coordinate Systems**:  
- WGS84 (SRID 4326) - GPS coordinates (input/output)  
- Lambert 93 (SRID 2154) - French projection (storage)

### Geometry Creation
```typescript
// From GeoJSON
import { createGeometryExpression } from '@/modules/geo/server/helpers';

await kdb
  .insertInto('reseaux_de_chaleur')
  .values({
    geom: createGeometryExpression(geoJson, 4326),
  })
  .execute();

// From coordinates
const addressData = {
  geom: sql`ST_Transform(ST_Point(${lon}, ${lat}, 4326), 2154)`,
};
```

### Spatial Queries
```typescript
// Transform and output as GeoJSON
const addresses = await kdb
  .selectFrom('pro_eligibility_tests_addresses')
  .select([
    'id',
    sql<GeoJSON.Point>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geom'),
  ])
  .execute();

// Distance check (ST_DWithin)
const nearby = await kdb
  .selectFrom('reseaux_de_chaleur')
  .selectAll()
  .where(
    sql`ST_DWithin(
      geom,
      ST_Transform(ST_Point(${lon}, ${lat}, 4326), 2154),
      ${distanceMeters}
    )`
  )
  .execute();

// Within polygon
const query = kdb
  .selectFrom('bdnb_batiments')
  .selectAll()
  .where(
    sql<boolean>`ST_Within(
      geom,
      ST_Transform(
        ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326),
        2154
      )
    )`
  );
```

### JSONB Queries
```typescript
// Access nested JSON
const demands = await kdb
  .selectFrom('demands')
  .selectAll()
  .where(sql`legacy_values->>'Status'`, '=', 'pending')
  .where(sql`legacy_values->'Gestionnaires'`, '?|', sql.val(['Paris']))
  .execute();

// JSONB functions
.select(sql<boolean>`coalesce(receive_new_demands, false)`.as('receive_new_demands'))
```


## Best Practices

- **Select columns explicitly**: Avoid `.selectAll()` when possible
- **Use transactions** for multi-step operations
- **PostGIS**: Store in Lambert 93 (2154), transform for I/O
- **Pagination**: Always use `limit()` and `offset()` for lists
- **Locks**: Use `.forUpdate().skipLocked()` for job queues
- **Type safety**: Leverage Kysely's inferred types
- **JSONB**: Use `sql` helper for JSON operations
- **Batching**: Insert/update in batches for large datasets
