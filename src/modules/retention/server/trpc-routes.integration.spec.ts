import type { User } from 'next-auth';
import { beforeEach, describe, expect, it } from 'vitest';

import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { uuid } from '@/tests/helpers';
import { createTestCaller, forbiddenError, type TestCaseBoolean, testUsers } from '@/tests/trpc-helpers';

const adminOnly: TestCaseBoolean<Partial<User> | null>[] = [
  { expectedOutput: false, input: null },
  { expectedOutput: false, input: testUsers.particulier },
  { expectedOutput: false, input: testUsers.professionnel },
  { expectedOutput: false, input: testUsers.gestionnaire },
  { expectedOutput: false, input: testUsers.collectivite },
  { expectedOutput: false, input: testUsers.alec },
  { expectedOutput: true, input: testUsers.admin },
];

const yearsAgo = (years: number) => new Date(Date.now() - years * 365 * 24 * 3600 * 1000);
const monthsAgo = (months: number) => new Date(Date.now() - months * 30 * 24 * 3600 * 1000);

const seedNetworkChangeRequest = (id: string, label: string, review: { processed_at?: Date; status?: 'processed' }) =>
  kdb
    .insertInto('network_change_requests')
    .values({
      contact_email: `${label.toLowerCase().replaceAll(' ', '-')}@test.local`,
      contact_first_name: 'Marie',
      contact_last_name: 'Dupont',
      contact_structure: 'Ville',
      contact_type: 'collectivite',
      id,
      kind: 'autre',
      network_label: label,
      payload: JSON.stringify({ dansCadreDemandeADEME: false, emailReferentCommercial: 'referent@exploitant.fr', precisions: 'x' }),
      ...review,
    })
    .execute();

const seedRequestFile = async (fileId: string, requestId: string) => {
  await kdb
    .insertInto('files')
    .values({
      content: Buffer.from('%PDF-'),
      content_type: 'application/pdf',
      filename: 'doc.pdf',
      id: fileId,
      scan_status: 'skipped',
      sha256: fileId,
      size: 5,
    })
    .execute();
  await kdb.insertInto('network_change_request_files').values({ file_id: fileId, request_id: requestId, role: 'document' }).execute();
};

const seedDemand = (id: string, values: Record<string, unknown>, extra: { deleted_at?: Date | null } = {}) =>
  kdb
    .insertInto('demands')
    .values({ id, legacy_values: JSON.stringify(values), ...extra })
    .execute();

describe('retention', () => {
  beforeEach(async () => {
    await cleanDatabase();
    // the admin must exist: retention events reference their author
    await seedTableUser([
      { ...testUsers.admin },
      { created_at: monthsAgo(4), email: 'pending-old@test.local', id: uuid(1), status: 'pending_email_confirmation' },
      { created_at: monthsAgo(1), email: 'pending-recent@test.local', id: uuid(2), status: 'pending_email_confirmation' },
      {
        email: 'inactive@test.local',
        first_name: 'Jean',
        id: uuid(3),
        last_connection: yearsAgo(3),
        phone: '0600000000',
        role: 'gestionnaire',
      },
      { email: 'active@test.local', id: uuid(4), last_connection: yearsAgo(1), role: 'gestionnaire' },
      { email: 'inactive-admin@test.local', id: uuid(5), last_connection: yearsAgo(5), role: 'admin' },
      { created_at: yearsAgo(3), email: 'never-connected@test.local', id: uuid(6), last_connection: null, role: 'professionnel' },
    ]);
    await seedDemand(uuid(10), {
      Adresse: '1 rue Close',
      'Date de la demande': yearsAgo(4).toISOString(),
      Mail: 'closed@test.local',
      Nom: 'Dupont',
      Status: 'Réalisé',
    });
    await seedDemand(uuid(11), {
      Adresse: '2 rue Récente',
      'Date de la demande': yearsAgo(1).toISOString(),
      Mail: 'recent@test.local',
      Nom: 'Martin',
      Status: 'Réalisé',
    });
    await seedDemand(uuid(12), {
      Adresse: '3 rue Ouverte',
      'Date de la demande': yearsAgo(4).toISOString(),
      Mail: 'open@test.local',
      Nom: 'Durand',
      Status: 'À traiter',
    });
    await seedDemand(
      uuid(13),
      { Adresse: '4 rue Supprimée', Mail: 'deleted@test.local', Nom: 'Petit', Status: 'À traiter' },
      { deleted_at: yearsAgo(4) }
    );
    await seedDemand(
      uuid(14),
      {
        Adresse: '5 rue Close puis supprimée',
        'Date de la demande': yearsAgo(4).toISOString(),
        Mail: 'both@test.local',
        Nom: 'Roux',
        Status: 'Non réalisable',
      },
      { deleted_at: monthsAgo(2) }
    );
    await seedNetworkChangeRequest(uuid(20), 'Réseau ancien', { processed_at: yearsAgo(4), status: 'processed' });
    await seedNetworkChangeRequest(uuid(21), 'Réseau récent', { processed_at: monthsAgo(2), status: 'processed' });
    await seedNetworkChangeRequest(uuid(22), 'Réseau en attente', {});
    await seedRequestFile(uuid(30), uuid(20));
    await seedRequestFile(uuid(31), uuid(21));
  });

  describe('permissions', () => {
    adminOnly.forEach(({ input: user, expectedOutput: allowed }) => {
      it(`preview: ${user?.role ?? 'anonymous'} → ${allowed ? 'allowed' : 'forbidden'}`, async () => {
        const call = () => createTestCaller(user).retention.preview();
        if (allowed) {
          await expect(call()).resolves.toBeInstanceOf(Array);
        } else {
          await expect(call()).rejects.toMatchObject(forbiddenError);
        }
      });
      it(`run: ${user?.role ?? 'anonymous'} → ${allowed ? 'allowed' : 'forbidden'}`, async () => {
        const call = () => createTestCaller(user).retention.run({ rule: 'pending_accounts' });
        if (allowed) {
          await expect(call()).resolves.toStrictEqual({ count: 1, rule: 'pending_accounts' });
        } else {
          await expect(call()).rejects.toMatchObject(forbiddenError);
        }
      });
    });
  });

  it('previews only the rows past their retention', async () => {
    const previews = await createTestCaller(testUsers.admin).retention.preview();

    expect(previews.map(({ rule, count, items }) => ({ count, labels: items.map((item) => item.label).sort(), rule }))).toStrictEqual([
      { count: 1, labels: ['pending-old@test.local'], rule: 'pending_accounts' },
      { count: 2, labels: ['inactive@test.local', 'never-connected@test.local'], rule: 'inactive_accounts' },
      { count: 3, labels: ['1 rue Close', '4 rue Supprimée', '5 rue Close puis supprimée'], rule: 'closed_demands' },
      { count: 1, labels: ['Réseau ancien'], rule: 'processed_network_change_requests' },
    ]);

    // a closed demand deleted recently is eligible by its request date: that is the date shown, not the deletion
    const bothItem = previews.find((preview) => preview.rule === 'closed_demands')?.items.find((item) => item.id === uuid(14));
    expect(bothItem?.date && Math.abs(new Date(bothItem.date).getTime() - yearsAgo(4).getTime()) < 1000).toStrictEqual(true);
  });

  it('deletes never-activated accounts past the delay', async () => {
    const result = await createTestCaller(testUsers.admin).retention.run({ rule: 'pending_accounts' });

    const remaining = await kdb.selectFrom('users').select('email').where('status', '=', 'pending_email_confirmation').execute();
    expect(result).toStrictEqual({ count: 1, rule: 'pending_accounts' });
    expect(remaining).toStrictEqual([{ email: 'pending-recent@test.local' }]);
  });

  it('deactivates and anonymizes inactive accounts, keeps admins and active accounts', async () => {
    const result = await createTestCaller(testUsers.admin).retention.run({ rule: 'inactive_accounts' });

    const users = await kdb
      .selectFrom('users')
      .select(['id', 'email', 'active', 'first_name', 'phone'])
      .where('id', 'in', [uuid(3), uuid(4), uuid(5), uuid(6)])
      .orderBy('id')
      .execute();
    const events = await kdb
      .selectFrom('events')
      .select(['type', 'data', 'author_id'])
      .where('type', '=', 'data_retention_applied')
      .execute();
    expect(result).toStrictEqual({ count: 2, rule: 'inactive_accounts' });
    expect(users).toStrictEqual([
      { active: false, email: `anonymise-${uuid(3)}@anonymise.invalid`, first_name: null, id: uuid(3), phone: null },
      { active: true, email: 'active@test.local', first_name: null, id: uuid(4), phone: null },
      { active: true, email: 'inactive-admin@test.local', first_name: null, id: uuid(5), phone: null },
      { active: false, email: `anonymise-${uuid(6)}@anonymise.invalid`, first_name: null, id: uuid(6), phone: null },
    ]);
    expect(events).toStrictEqual([
      { author_id: testUsers.admin.id, data: { count: 2, rule: 'inactive_accounts' }, type: 'data_retention_applied' },
    ]);
  });

  it('anonymizes closed demands past the delay and leaves open or recent ones untouched', async () => {
    const result = await createTestCaller(testUsers.admin).retention.run({ rule: 'closed_demands' });

    const rows = await kdb.selectFrom('demands').select(['id', 'legacy_values']).orderBy('id').execute();
    expect(result).toStrictEqual({ count: 3, rule: 'closed_demands' });
    expect(
      rows.map((row) => ({
        adresse: (row.legacy_values as any).Adresse,
        id: row.id,
        mail: (row.legacy_values as any).Mail,
        nom: (row.legacy_values as any).Nom,
      }))
    ).toStrictEqual([
      { adresse: '1 rue Close', id: uuid(10), mail: `anonymise-${uuid(10)}@anonymise.invalid`, nom: 'Anonymisé' },
      { adresse: '2 rue Récente', id: uuid(11), mail: 'recent@test.local', nom: 'Martin' },
      { adresse: '3 rue Ouverte', id: uuid(12), mail: 'open@test.local', nom: 'Durand' },
      { adresse: '4 rue Supprimée', id: uuid(13), mail: `anonymise-${uuid(13)}@anonymise.invalid`, nom: 'Anonymisé' },
      { adresse: '5 rue Close puis supprimée', id: uuid(14), mail: `anonymise-${uuid(14)}@anonymise.invalid`, nom: 'Anonymisé' },
    ]);

    const previewAfter = await createTestCaller(testUsers.admin).retention.preview();
    expect(previewAfter.find((preview) => preview.rule === 'closed_demands')?.count).toStrictEqual(0);
  });

  it('anonymizes processed network change requests past the delay and purges their files', async () => {
    const result = await createTestCaller(testUsers.admin).retention.run({ rule: 'processed_network_change_requests' });

    expect(result).toStrictEqual({ count: 1, rule: 'processed_network_change_requests' });
    const rows = await kdb
      .selectFrom('network_change_requests')
      .select(['id', 'contact_email', 'contact_last_name', 'contact_structure', 'network_label', 'status'])
      .orderBy('id')
      .execute();
    expect(rows).toStrictEqual([
      {
        contact_email: `anonymise-${uuid(20)}@anonymise.invalid`,
        contact_last_name: 'Anonymisé',
        contact_structure: null,
        id: uuid(20),
        network_label: 'Réseau ancien',
        status: 'processed',
      },
      {
        contact_email: 'réseau-récent@test.local',
        contact_last_name: 'Dupont',
        contact_structure: 'Ville',
        id: uuid(21),
        network_label: 'Réseau récent',
        status: 'processed',
      },
      {
        contact_email: 'réseau-en-attente@test.local',
        contact_last_name: 'Dupont',
        contact_structure: 'Ville',
        id: uuid(22),
        network_label: 'Réseau en attente',
        status: 'pending',
      },
    ]);
    expect(await kdb.selectFrom('files').select(['id', 'purged_at']).orderBy('id').execute()).toStrictEqual([
      { id: uuid(30), purged_at: expect.any(Date) },
      { id: uuid(31), purged_at: null },
    ]);
    // the commercial referent is personal data too
    expect(await kdb.selectFrom('network_change_requests').select(['id', 'payload']).orderBy('id').execute()).toStrictEqual([
      { id: uuid(20), payload: { dansCadreDemandeADEME: false, precisions: 'x' } },
      { id: uuid(21), payload: { dansCadreDemandeADEME: false, emailReferentCommercial: 'referent@exploitant.fr', precisions: 'x' } },
      { id: uuid(22), payload: { dansCadreDemandeADEME: false, emailReferentCommercial: 'referent@exploitant.fr', precisions: 'x' } },
    ]);
    const previewAfter = await createTestCaller(testUsers.admin).retention.preview();
    expect(previewAfter.find((preview) => preview.rule === 'processed_network_change_requests')?.count).toStrictEqual(0);
  });
});
