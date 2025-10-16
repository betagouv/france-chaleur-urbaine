# Database

<!-- Source: /README.md -->

## Installation de l'environnement de développement

### Site local

- Préparer la structure de la BDD
```sh
pnpm db:migrate
```

- Peupler la base de données locale à partir de la base de production, notamment les tables de référence et calculées.
```sh
pnpm db:bootstrap
```

- Si jamais l'étape de bootstrap est trop lente, essayer de récupérer un dump depuis le dashboard Scalingo et l'importer en local (~ 20-30 minutes)
```sh
tar -xzvf 20240XXXXXXXXXX_france_chal_3098.tar.gz
pg_restore --clean --if-exists --no-owner --no-privileges --verbose --no-comments --dbname postgres://postgres:postgres_fcu@localhost:5432/postgres 20240XXXXXXXXXX_france_chal_3098.pgsql
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface mailpit pour les emails : http://localhost:8025/
  - La base de données PostgreSQL : localhost:5432

### Kysely

Certaines requêtes à la base de données sont générées par [Kysely](https://github.com/koskimas/kysely) à partir du [fichier `src/server/db/kysely/database.ts`](src/server/db/kysely/database.ts).
Celui-ci doit être généré à partir de la base de données à chaque fois que celle-ci est modifiée.

- `pnpm db:verify` pour voir si des modifications ont été faites à la base de données sans avoir été incluses dans le fichier `src/db/kysely/database.ts`
- `pnpm db:sync` pour générer le fichier `src/db/kysely/database.ts` à partir de la base de données

<!-- Source: /CLAUDE.md -->

## Essential Commands

```bash
# Database
pnpm db:migrate            # Run migrations
pnpm db:sync               # Regenerate Kysely types (after schema changes)
```

