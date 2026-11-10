import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ALL_FCU_RUBRIQUES, buildRubriques } from '@/modules/ademe-connect/constants';
import { createContact, updateContact } from '@/modules/ademe-connect/server/client';
import { sendEmailTemplate } from '@/modules/email';
import type { Context } from '@/server/api/crud';
import type { ListConfig } from '@/server/db/kysely/base-model';
import { uuid } from '@/tests/helpers';
import type { TestCase } from '@/tests/trpc-helpers';
import { type UserRole, userRoles } from '@/types/enum/UserRole';

import { create, update } from './service';

const mocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  findExistingUser: vi.fn(),
  findUser: vi.fn(),
  updateRecord: vi.fn(),
}));

vi.mock('@/server/db/kysely', () => ({
  kdb: {
    selectFrom: () => ({
      select: () => ({ where: () => ({ executeTakeFirst: mocks.findExistingUser, executeTakeFirstOrThrow: mocks.findUser }) }),
    }),
  },
}));
vi.mock('@/server/db/kysely/base-model', () => ({
  createBaseModel: () => ({ create: mocks.createRecord, update: mocks.updateRecord }),
}));
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
  const cases: TestCase<{ active: boolean | undefined; role: UserRole }, string | null>[] = userRoles.flatMap((role) =>
    [true, false, undefined].map((active) => ({
      expectedOutput: active ? openingEmails[role] : null,
      input: { active, role },
      label: `${role}, active=${active}`,
    }))
  );

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findExistingUser.mockResolvedValue(undefined);
    mocks.createRecord.mockResolvedValue(record);
  });

  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    await expect(
      create(
        {
          active: input.active,
          email,
          newsletter_optin_at: null,
          notifications: { new_demands: 'none', pending_demands_reminder: false },
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
        {
          active: true,
          email,
          newsletter_optin_at: null,
          notifications: { new_demands: 'none', pending_demands_reminder: false },
          role: 'ccrt',
        },
        context
      )
    ).rejects.toMatchObject({ code: 'CONFLICT' });

    expect(mocks.createRecord).not.toHaveBeenCalled();
    expect(sendEmailTemplate).not.toHaveBeenCalled();
  });
});

describe('newsletter consent sent to ADEME Connect', () => {
  const today = '2026-11-10';
  const context = { user: { id: uuid(2) } } as Context;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${today}T10:00:00`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('on creation', () => {
    const record = { id: uuid(1) };
    const email = 'new-user@example.com';
    const cases: TestCase<boolean | null, { abonnementNewsletter: boolean; dateNewsletter: string | undefined }>[] = [
      { expectedOutput: { abonnementNewsletter: true, dateNewsletter: today }, input: true, label: 'opted in → subscribed, starts today' },
      {
        expectedOutput: { abonnementNewsletter: false, dateNewsletter: undefined },
        input: false,
        label: 'opted out → not subscribed, no date',
      },
      { expectedOutput: { abonnementNewsletter: false, dateNewsletter: undefined }, input: null, label: 'unset → not subscribed, no date' },
    ];

    beforeEach(() => {
      mocks.findExistingUser.mockResolvedValue(undefined);
      mocks.createRecord.mockResolvedValue(record);
    });

    it.each(cases)('$label', async ({ input, expectedOutput }) => {
      await create(
        {
          active: true,
          email,
          newsletter_optin_at: input,
          notifications: { new_demands: 'none', pending_demands_reminder: false },
          role: 'particulier',
        },
        context
      );

      expect(vi.mocked(createContact).mock.calls).toStrictEqual([
        [
          {
            ...expectedOutput,
            acceptationRGPD: false,
            email,
            nom: undefined,
            prenom: undefined,
            rubriques: buildRubriques('particulier', undefined),
            siret: undefined,
            telephone: undefined,
            typeOrganisme: 'Particulier',
          },
        ],
      ]);
    });
  });

  describe('on admin update', () => {
    const id = uuid(1);
    const email = 'user@example.com';
    const subscribedAt = new Date('2026-01-15T00:00:00');
    const config = {} as ListConfig<'users'>;
    const cases: TestCase<{ previous: Date | null; newsletter_optin_at?: boolean }, Record<string, unknown>>[] = [
      {
        expectedOutput: { abonnementNewsletter: true, dateNewsletter: today },
        input: { newsletter_optin_at: true, previous: null },
        label: 'subscribes → flag and start date',
      },
      {
        expectedOutput: { abonnementNewsletter: false, dateFinNewsletter: today },
        input: { newsletter_optin_at: false, previous: subscribedAt },
        label: 'unsubscribes → flag and end date',
      },
      { expectedOutput: {}, input: { newsletter_optin_at: true, previous: subscribedAt }, label: 'still subscribed → no newsletter field' },
      { expectedOutput: {}, input: { newsletter_optin_at: false, previous: null }, label: 'still unsubscribed → no newsletter field' },
      { expectedOutput: {}, input: { previous: subscribedAt }, label: 'consent absent from the payload → no newsletter field' },
    ];

    it.each(cases)('$label', async ({ input, expectedOutput }) => {
      // Mirrors what `update` stores: untouched when absent, kept or set when true, cleared when false.
      const storedOptinAt =
        input.newsletter_optin_at === undefined ? input.previous : input.newsletter_optin_at ? (input.previous ?? new Date()) : null;
      mocks.findUser.mockResolvedValueOnce({ email, newsletter_optin_at: input.previous }).mockResolvedValueOnce({
        entreprise: null,
        first_name: 'Jean',
        last_name: 'Dupont',
        newsletter_optin_at: storedOptinAt,
        phone: null,
        role: 'particulier',
        structure_type: null,
      });
      mocks.updateRecord.mockResolvedValue({ email, id });

      await update(
        id,
        { active: true, ...(input.newsletter_optin_at === undefined ? {} : { newsletter_optin_at: input.newsletter_optin_at }) },
        config,
        context
      );

      await vi.waitFor(() => expect(updateContact).toHaveBeenCalled());
      expect(vi.mocked(updateContact).mock.calls).toStrictEqual([
        [
          email,
          {
            nom: 'Dupont',
            prenom: 'Jean',
            rubriques: buildRubriques('particulier', null),
            rubriquesASupprimer: ALL_FCU_RUBRIQUES,
            siret: undefined,
            telephone: undefined,
            typeOrganisme: 'Particulier',
            ...expectedOutput,
          },
        ],
      ]);
    });
  });
});
