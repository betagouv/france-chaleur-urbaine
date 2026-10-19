import type { Session } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/server/authentication');

const { mockNextAuthGetServerSession } = vi.hoisted(() => ({ mockNextAuthGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockNextAuthGetServerSession }));
vi.mock('@/pages/api/auth/[...nextauth]', () => ({ nextAuthOptions: {} }));

const { getServerSession } = await import('./authentication');

const sessionWith = (user: Partial<Session['user']>) => ({ expires: '2099-01-01T00:00:00.000Z', user }) as Session;

describe('getServerSession()', () => {
  const context = { req: {} as any, res: {} as any };

  beforeEach(() => {
    mockNextAuthGetServerSession.mockReset();
  });

  it('retourne la session d’un compte actif', async () => {
    const session = sessionWith({ active: true, id: 'user-1', role: 'gestionnaire' });
    mockNextAuthGetServerSession.mockResolvedValue(session);

    expect(await getServerSession(context)).toStrictEqual(session);
  });

  it.each([
    ['compte désactivé', sessionWith({ active: false, id: 'user-1', role: 'gestionnaire' })],
    ['compte supprimé (utilisateur introuvable)', sessionWith({})],
    ['sans session', null],
  ])('ne retourne aucune session : %s', async (_label, session) => {
    mockNextAuthGetServerSession.mockResolvedValue(session);

    expect(await getServerSession(context)).toBeNull();
  });
});
