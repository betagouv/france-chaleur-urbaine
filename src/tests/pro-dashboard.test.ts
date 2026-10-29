import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import type { Session } from 'next-auth';
import { createMocks } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';

vi.unmock('@/server/authentication');

const { mockNextAuthGetServerSession } = vi.hoisted(() => ({ mockNextAuthGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockNextAuthGetServerSession }));
vi.mock('@/pages/api/auth/[...nextauth]', () => ({ nextAuthOptions: {} }));
vi.mock('@/components/dashboard/DashboardAdmin', () => ({ default: () => null }));
vi.mock('@/components/dashboard/DashboardGestionnaire', () => ({ default: () => null }));
vi.mock('@/components/dashboard/DashboardProfessionnel', () => ({ default: () => null }));
vi.mock('@/components/shared/page/SimplePage', () => ({ default: () => null }));
vi.mock('@/components/ui/Box', () => ({ default: () => null }));
vi.mock('@/components/ui/Heading', () => ({ default: () => null }));
vi.mock('@/modules/auth/client/hooks', () => ({ useAuthentication: vi.fn() }));

const { getServerSideProps } = await import('@/pages/pro/tableau-de-bord');
const { req, res } = createMocks<NextApiRequest, NextApiResponse>();
const context = { query: {}, req, res, resolvedUrl: '/pro/tableau-de-bord' } satisfies GetServerSidePropsContext;

describe('Professional landing page', () => {
  it.each([
    ['ccrt', '/pro/demandes-chaleur-renouvelable'],
    ['gestionnaire', '/pro/demandes'],
    ['collectivite', '/pro/demandes'],
    ['alec', '/pro/demandes'],
    ['admin', null],
    ['particulier', null],
    ['professionnel', null],
  ] as const)('selects the default destination for %s after login', async (role, destination) => {
    const session: Session = {
      expires: '2099-01-01T00:00:00.000Z',
      user: { active: true, email: 'user@example.com', id: 'user-1', role },
    };
    mockNextAuthGetServerSession.mockResolvedValue(session);

    expect(await getServerSideProps(context)).toStrictEqual(
      destination ? { redirect: { destination, permanent: false } } : { props: { session } }
    );
  });

  it('redirects an admin impersonating a CCRT to renewable heat demands', async () => {
    mockNextAuthGetServerSession.mockResolvedValue({
      expires: '2099-01-01T00:00:00.000Z',
      impersonating: true,
      user: { active: true, email: 'admin@example.com', id: 'admin-1', role: 'ccrt' },
    } satisfies Session);

    expect(await getServerSideProps(context)).toStrictEqual({
      redirect: { destination: '/pro/demandes-chaleur-renouvelable', permanent: false },
    });
  });
});
