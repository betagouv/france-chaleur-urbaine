import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendEmailTemplate } from '@/modules/email';
import type { Context } from '@/server/api/crud';
import { uuid } from '@/tests/helpers';
import type { TestCase } from '@/tests/trpc-helpers';
import { type UserRole, userRoles } from '@/types/enum/UserRole';

import { create } from './service';

const mocks = vi.hoisted(() => ({
  ccrtEmailEnabled: false,
  createRecord: vi.fn(),
  findExistingUser: vi.fn(),
}));

vi.mock('@/modules/chaleur-renouvelable/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/chaleur-renouvelable/constants')>()),
  get IS_CCRT_EMAIL_ENABLED() {
    return mocks.ccrtEmailEnabled;
  },
}));

vi.mock('@/server/db/kysely', () => ({
  kdb: {
    selectFrom: () => ({ select: () => ({ where: () => ({ executeTakeFirst: mocks.findExistingUser }) }) }),
  },
}));
vi.mock('@/server/db/kysely/base-model', () => ({ createBaseModel: () => ({ create: mocks.createRecord }) }));
vi.mock('@/modules/ademe-connect/server/client', () => ({
  createContact: vi.fn().mockResolvedValue(undefined),
  updateContact: vi.fn(),
}));
vi.mock('@/modules/email', () => ({ sendEmailTemplate: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/modules/events/server/service', () => ({ createUserEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/modules/permissions/server/search', () => ({ getAllPermissionsWithLabels: vi.fn() }));
vi.mock('./tags-service', () => ({ getAllUserTags: vi.fn() }));

describe('create user opening email', () => {
  const record = { id: uuid(1) };
  const context = { user: { id: uuid(2) } } as Context;
  const email = 'new-user@example.com';
  const openingEmails: Record<UserRole, string | null> = {
    admin: null,
    alec: null,
    ccrt: 'auth.ccrt.ouverture-espace',
    collectivite: null,
    gestionnaire: 'auth.gestionnaire.ouverture-espace',
    particulier: null,
    professionnel: null,
  };
  const cases: TestCase<{ active: boolean | undefined; role: UserRole; ccrtEmailEnabled: boolean }, string | null>[] = [
    true,
    false,
  ].flatMap((ccrtEmailEnabled) =>
    userRoles.flatMap((role) =>
      [true, false, undefined].map((active) => ({
        expectedOutput: active && (role !== 'ccrt' || ccrtEmailEnabled) ? openingEmails[role] : null,
        input: { active, ccrtEmailEnabled, role },
        label: `${role}, active=${active}, CCRT emails=${ccrtEmailEnabled}`,
      }))
    )
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ccrtEmailEnabled = false;
    mocks.findExistingUser.mockResolvedValue(undefined);
    mocks.createRecord.mockResolvedValue(record);
  });

  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    mocks.ccrtEmailEnabled = input.ccrtEmailEnabled;
    await expect(
      create(
        {
          active: input.active,
          email,
          notifications: { new_demands: 'none', pending_demands_reminder: false },
          optin_at: null,
          role: input.role,
        },
        context
      )
    ).resolves.toStrictEqual(record);

    expect(vi.mocked(sendEmailTemplate).mock.calls).toStrictEqual(expectedOutput ? [[expectedOutput, { email, id: record.id }]] : []);
  });

  it('does not send an opening email when the account already exists', async () => {
    mocks.findExistingUser.mockResolvedValue(record);

    await expect(
      create(
        { active: true, email, notifications: { new_demands: 'none', pending_demands_reminder: false }, optin_at: null, role: 'ccrt' },
        context
      )
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(mocks.createRecord).not.toHaveBeenCalled();
    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });
});
