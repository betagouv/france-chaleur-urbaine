import { describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';

import { anonymizeDatabase, assertLocalDatabase } from './anonymize';

describe('assertLocalDatabase', () => {
  it('accepts a local database', () => {
    expect(() => assertLocalDatabase('postgres://user:pass@localhost:5433/fcu_test')).not.toThrow();
  });

  it('refuses a remote database', () => {
    expect(() => assertLocalDatabase('postgres://user:pass@db.osc-fr1.scalingo-dbs.com:33001/prod')).toThrow(/base distante/);
  });
});

describe('anonymizeDatabase', () => {
  it('pseudonymizes personal data, keeps admin accounts and never rewrites passwords', async () => {
    await cleanDatabase();
    await seedTableUser([
      { email: 'jean.dupont@example.com', first_name: 'Jean', id: uuid(1), last_name: 'Dupont', phone: '0612345678', role: 'gestionnaire' },
      { email: 'marie.martin@ademe.fr', first_name: 'Marie', id: uuid(2), last_name: 'Martin', password: 'hash-inchangé', role: 'admin' },
    ]);
    await kdb
      .insertInto('demands')
      .values({
        comment_user: 'Appelez-moi le soir',
        id: uuid(3),
        legacy_values: JSON.stringify({
          Adresse: '1 rue de la Paix 75002 Paris',
          'Date de la demande': '2026-01-01',
          Logement: 12,
          Mail: 'jean.dupont@example.com',
          Nom: 'Dupont',
          Prénom: 'Jean',
          Téléphone: '0612345678',
        }),
      })
      .execute();

    const seededPassword = (await kdb.selectFrom('users').select('password').where('id', '=', uuid(1)).executeTakeFirstOrThrow()).password;

    const report = await anonymizeDatabase(process.env.DATABASE_URL ?? 'postgres://fcu_test:fcu_test_pass@localhost:5433/fcu_test');

    const users = await kdb
      .selectFrom('users')
      .select(['id', 'email', 'first_name', 'last_name', 'phone', 'password'])
      .orderBy('id')
      .execute();
    const demand = await kdb
      .selectFrom('demands')
      .select(['comment_user', 'legacy_values'])
      .where('id', '=', uuid(3))
      .executeTakeFirstOrThrow();
    expect(report.users).toStrictEqual(1);
    expect(users).toStrictEqual([
      {
        email: `gestionnaire-${uuid(1)}@fcu.local`,
        first_name: 'Prénom',
        id: uuid(1),
        last_name: `Nom ${uuid(1).slice(0, 8)}`,
        password: seededPassword,
        phone: null,
      },
      { email: 'marie.martin@ademe.fr', first_name: 'Marie', id: uuid(2), last_name: 'Martin', password: 'hash-inchangé', phone: null },
    ]);
    expect(demand).toStrictEqual({
      comment_user: null,
      legacy_values: {
        Adresse: '1 rue de la Paix 75002 Paris',
        'Date de la demande': '2026-01-01',
        Logement: 12,
        Mail: `demande-${uuid(3)}@fcu.local`,
        Nom: `Nom ${uuid(3).slice(0, 8)}`,
        Prénom: 'Prénom',
        Téléphone: '0600000000',
      },
    });
  });
});
