import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('ADEME Connect contact sync', () => {
  const context = { user: { id: uuid(2) } } as Context;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates the contact without any newsletter field: only the public registration subscribes to the newsletter', async () => {
    const record = { id: uuid(1) };
    const email = 'new-user@example.com';
    mocks.findExistingUser.mockResolvedValue(undefined);
    mocks.createRecord.mockResolvedValue(record);

    await create(
      { active: true, email, notifications: { new_demands: 'none', pending_demands_reminder: false }, role: 'particulier' },
      context
    );

    expect(vi.mocked(createContact).mock.calls).toStrictEqual([
      [
        {
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

  it('resyncs the contact on admin update without any newsletter field', async () => {
    const id = uuid(1);
    const email = 'user@example.com';
    mocks.findUser.mockResolvedValueOnce({ email }).mockResolvedValueOnce({
      entreprise: null,
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: null,
      role: 'particulier',
      structure_type: null,
    });
    mocks.updateRecord.mockResolvedValue({ email, id });

    await update(id, { active: true }, {} as ListConfig<'users'>, context);

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
        },
      ],
    ]);
  });
});
