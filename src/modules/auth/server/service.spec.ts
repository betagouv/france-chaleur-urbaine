import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildRubriques } from '@/modules/ademe-connect/constants';
import { createContact } from '@/modules/ademe-connect/server/client';
import { uuid } from '@/tests/helpers';
import type { TestCase } from '@/tests/trpc-helpers';

import { register } from './service';

const mocks = vi.hoisted(() => ({
  findExistingUser: vi.fn(),
  insertUser: vi.fn(),
}));

vi.mock('@/server/db/kysely', () => ({
  kdb: {
    insertInto: () => ({ values: () => ({ returning: () => ({ executeTakeFirstOrThrow: mocks.insertUser }) }) }),
    selectFrom: () => ({ select: () => ({ where: () => ({ executeTakeFirst: mocks.findExistingUser }) }) }),
  },
  sql: vi.fn(),
}));
vi.mock('@/modules/ademe-connect/server/client', () => ({
  createContact: vi.fn().mockResolvedValue(null),
  updateContact: vi.fn(),
}));
vi.mock('@/modules/demands/server/account-linking', () => ({ linkDemandsByEmail: vi.fn() }));
vi.mock('@/modules/email', () => ({ sendEmailTemplate: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/modules/events/server/service', () => ({ createUserEvent: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/modules/security/server/pwned-passwords', () => ({ ensurePasswordNotPwned: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/modules/users/server/service', () => ({ findEtablissementBySiret: vi.fn() }));

describe('register: newsletter subscription sent to ADEME Connect', () => {
  const today = '2026-11-12';
  const email = 'new-user@example.com';
  const cases: TestCase<boolean | undefined, { abonnementNewsletter: true | undefined; dateNewsletter: string | undefined }>[] = [
    { expectedOutput: { abonnementNewsletter: true, dateNewsletter: today }, input: true, label: 'box ticked → subscribed, starts today' },
    {
      expectedOutput: { abonnementNewsletter: undefined, dateNewsletter: undefined },
      input: false,
      label: 'box unticked → no newsletter field',
    },
    {
      expectedOutput: { abonnementNewsletter: undefined, dateNewsletter: undefined },
      input: undefined,
      label: 'box absent → no newsletter field',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${today}T10:00:00`));
    mocks.findExistingUser.mockResolvedValue(undefined);
    mocks.insertUser.mockResolvedValue({ email, id: uuid(1) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(cases)('$label', async ({ input, expectedOutput }) => {
    await register({
      accept_cgu: true,
      email,
      first_name: 'Jean',
      last_name: 'Dupont',
      optin_newsletter: input,
      password: 'a-long-enough-password',
      role: 'professionnel',
      structure_type: 'bureau_etudes',
    });

    expect(vi.mocked(createContact).mock.calls).toStrictEqual([
      [
        {
          ...expectedOutput,
          acceptationRGPD: true,
          email,
          nom: 'Dupont',
          prenom: 'Jean',
          rubriques: buildRubriques('professionnel', 'bureau_etudes'),
          siret: undefined,
          telephone: undefined,
          typeOrganisme: 'Entreprise',
        },
      ],
    ]);
  });
});
