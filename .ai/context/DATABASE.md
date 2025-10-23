# Database Guidelines

> Database design and optimization for france-chaleur-urbaine

## 🎯 Instructions for Auto-Fill

This template should be filled by analyzing:
- Database schema files (prisma/schema.prisma, migrations/, models/)
- ORM configurations (TypeORM, Sequelize, Django ORM, SQLAlchemy, GORM)
- Migration files
- Database connection configuration
- Query patterns in repository/model files
- Database indexes

## 📊 Database Technology

<!-- Source: CLAUDE.md, README.md -->

### Primary Database

**Type**: PostgreSQL + PostGIS
**Version**: [From docker-compose.yml]
**ORM/Query Builder**: Kysely for type-safe SQL queries

### Kysely Type Generation

<!-- Source: README.md -->

Certaines requêtes à la base de données sont générées par [Kysely](https://github.com/koskimas/kysely) à partir du [fichier `src/server/db/kysely/database.ts`](src/server/db/kysely/database.ts).
Celui-ci doit être généré à partir de la base de données à chaque fois que celle-ci est modifiée.

```bash
# Verify if database schema is in sync with types
pnpm db:verify

# Regenerate Kysely types from database
pnpm db:sync
```

### Additional Data Stores

<!-- Detect from docker-compose.yml and dependencies:
- Redis for caching
- Elasticsearch for search
- S3 for files
-->

- **[Store 1]**: [Purpose from usage in code]
- **[Store 2]**: [Purpose from usage in code]

## 🗂️ Schema Overview

### Tables/Collections

<!-- Extract from:
- Prisma schema models
- Migration files
- ORM model definitions
- List all tables/collections with their primary purpose
-->

| Table/Collection | Purpose | Key Relationships |
|------------------|---------|-------------------|
| [table1] | [Inferred from model name and fields] | [Foreign keys detected] |
| [table2] | [Inferred from model name and fields] | [Foreign keys detected] |

### Entity Relationship Diagram

<!-- Generate simplified ERD from schema:
- Show main entities
- Show relationships (1:1, 1:many, many:many)
- From ORM relations or foreign keys
-->

```
[Entity1] ──< [Entity2]  # one-to-many
    │
    ├──< [Entity3]       # one-to-many
    │
    └──── [Entity4]      # one-to-one
```

## 📐 Schema Design Patterns

### Naming Conventions

<!-- Analyze schema for patterns:
- Table names: plural vs singular
- Column names: snake_case vs camelCase
- Foreign key naming
- Boolean field prefixes
- Timestamp field suffixes
-->

**Tables**: [plural/singular] [snake_case/camelCase]
**Columns**: [snake_case/camelCase]
**Foreign Keys**: [pattern detected from schema]
**Booleans**: [is_/has_/can_ prefix patterns]
**Timestamps**: [created_at/createdAt pattern]

### Common Fields

<!-- Extract fields that appear across multiple models:
- id fields
- timestamps (created_at, updated_at)
- soft delete (deleted_at)
- user tracking (created_by, updated_by)
-->

**Standard Fields** (present in most tables):
- [field1]: [type] - [purpose]
- [field2]: [type] - [purpose]

## 🔗 Relationships

### One-to-Many

<!-- Extract from ORM relations or foreign keys -->

- `[parent]` → `[children]`: [Description]
- `[parent]` → `[children]`: [Description]

### Many-to-Many

<!-- Detect from:
- Junction tables
- Many-to-many relations in ORM
-->

- `[entity1]` ↔ `[entity2]`: via `[junction_table]`
- `[entity1]` ↔ `[entity2]`: via `[junction_table]`

### One-to-One

<!-- Extract from unique foreign keys or 1:1 relations -->

- `[entity1]` ─ `[entity2]`: [Purpose]

## 🔍 Indexes

### Existing Indexes

<!-- Extract from:
- CREATE INDEX statements in migrations
- @index, @@index in Prisma
- Index definitions in ORM models
-->

| Table | Index | Columns | Type | Purpose |
|-------|-------|---------|------|---------|
| [table] | [name] | [cols] | [BTREE/GIN/etc] | [Inferred from columns] |

### Index Strategy

<!-- Analyze index patterns:
- Primary keys
- Foreign keys
- Unique constraints
- Composite indexes
- Partial indexes
-->

**Primary Keys**: [UUID/BIGSERIAL/AUTO_INCREMENT detected]
**Foreign Keys**: [Indexed: Yes/No - from index analysis]
**Unique Constraints**: [From unique indexes/constraints]

## 🔄 Migrations

<!-- Source: CLAUDE.md, README.md -->

### Migration Tool

**Tool**: Custom migration system
**Location**: `migrations/`

### Database Changes Workflow

<!-- Source: CLAUDE.md -->

**Database changes:**
1. Create migration in `migrations/`
2. Run `pnpm db:migrate`
3. Run `pnpm db:sync` to update types
4. Update relevant services

### Migration Commands

```bash
# Run migrations
pnpm db:migrate

# Regenerate Kysely types (after schema changes)
pnpm db:sync

# Verify database schema is in sync
pnpm db:verify
```

### Database Bootstrap

<!-- Source: README.md -->

Peupler la base de données locale à partir de la base de production:

```bash
pnpm db:bootstrap
```

Si l'étape de bootstrap est trop lente, essayer de récupérer un dump depuis le dashboard Scalingo:

```bash
tar -xzvf 20240XXXXXXXXXX_france_chal_3098.tar.gz
pg_restore --clean --if-exists --no-owner --no-privileges --verbose --no-comments --dbname postgres://postgres:postgres_fcu@localhost:5432/postgres 20240XXXXXXXXXX_france_chal_3098.pgsql
```

## 🗑️ Soft Deletes

<!-- Detect from:
- deleted_at fields in models
- Soft delete middleware
- Global scopes that filter deleted records
-->

**Implementation**: [Yes/No]

**Fields Used**:
- [deleted_at/deletedAt in models]

**Models with Soft Delete**:
- [Model 1]
- [Model 2]

## ⏱️ Timestamps

### Timestamp Fields

<!-- Extract common timestamp fields:
- created_at, updated_at
- published_at, archived_at
- etc.
-->

**Standard Timestamps**:
- `[created_at]`: [Format/type detected]
- `[updated_at]`: [Format/type detected]

### Automatic Updates

<!-- Detect from:
- ORM hooks (beforeUpdate, etc.)
- Database triggers
- Middleware
-->

**Auto-Updated**: [Fields that auto-update]
**Mechanism**: [Trigger / ORM hook / Middleware]

## ⚡ Query Patterns

### Common Queries

<!-- Analyze repository/model code for frequent query patterns:
- Find by ID
- List with pagination
- Search patterns
- Join patterns
-->

**Frequent Operations**:
```typescript
// Auto-detected common query patterns
[Example 1 from repository code]

[Example 2 from repository code]
```

### N+1 Prevention

<!-- Detect from:
- Eager loading in queries
- DataLoader usage
- Include/preload patterns in ORM
-->

**Strategy**: [Eager loading / DataLoader / Include patterns]

**Example**:
```typescript
// Pattern detected in code
[Example of N+1 prevention]
```

## 🚀 Performance Optimizations

### Caching

<!-- Detect from:
- Query caching middleware
- Redis caching patterns
- Cache-aside patterns
-->

**Cache Layer**: [Redis / In-memory / None detected]

**Cached Queries**:
- [Query pattern 1 from cache keys]
- [Query pattern 2 from cache keys]

### Connection Pooling

<!-- Extract from database configuration:
- Pool size
- Connection limits
- Timeout settings
-->

**Pool Configuration**:
- **Max Connections**: [From config]
- **Min Connections**: [From config]
- **Idle Timeout**: [From config]

### Query Optimization

<!-- Analyze for:
- Select specific fields (not SELECT *)
- Use of indexes in WHERE clauses
- EXPLAIN usage in comments
-->

**Optimization Patterns**:
- [Pattern 1 from code analysis]
- [Pattern 2 from code analysis]

## 🔒 Security

### SQL Injection Prevention

<!-- Detect from:
- Parameterized queries
- ORM usage (ORMs prevent SQL injection by default)
- Input validation
-->

**Primary Defense**: [ORM / Parameterized Queries / Prepared Statements]

**Additional Measures**:
- [Validation library detected]
- [Sanitization patterns found]

### Access Control

<!-- Detect from:
- Row-level security policies
- Database roles and permissions
- ORM-level access control
-->

**Database Roles**: [From migration files or docs]

**Row-Level Security**: [Yes/No from policies in migrations]

### Encryption

<!-- Detect from:
- Encrypted fields in schema
- Encryption libraries
- SSL/TLS connection settings
-->

**At Rest**: [Encrypted fields detected]
**In Transit**: [SSL/TLS from connection config]

## 📊 Monitoring

### Slow Query Logging

<!-- Extract from database configuration:
- Slow query threshold
- Logging configuration
-->

**Enabled**: [Yes/No from config]
**Threshold**: [Time from config]

### Database Monitoring Tools

<!-- Detect from:
- Monitoring service integrations
- APM tools
- Database dashboard tools
-->

- [Tool 1 from dependencies or config]
- [Tool 2 from dependencies or config]

## 🧪 Testing

### Test Database

<!-- Detect from:
- Test configuration files
- Separate test database in docker-compose
- In-memory database for tests
-->

**Strategy**: [Separate DB / In-memory / Same DB different schema]

**Setup**: [From test configuration]

### Fixtures and Seeding

<!-- Detect from:
- Seed files
- Factory libraries
- Test data generators
-->

**Seeding Tool**: [Prisma seed / Factories / Custom scripts]
**Location**: [Path to seed/fixture files]

### Migration Testing

<!-- Detect from:
- CI/CD pipeline
- Test scripts for migrations
-->

**Tested in CI**: [Yes/No from CI config]

## 🔄 Backup and Recovery

<!-- Extract from:
- Backup scripts
- CI/CD backup jobs
- Documentation about backups
-->

**Backup Strategy**: [From scripts or docs]
**Frequency**: [From cron jobs or CI schedules]
**Retention**: [From backup policies]

---

**Last updated**: [Current date]
**Schema Version**: [Latest migration version or Prisma schema version]
**Related**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system context
