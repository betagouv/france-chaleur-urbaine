import type { NextApiRequest, NextApiResponse } from 'next';
import { encode } from 'next-auth/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import impersonateHandler from '@/pages/api/admin/impersonate';
import { kdb } from '@/server/db/kysely';
import { cleanDatabase, seedTableUser } from '@/tests/fixtures';
import { mockGetServerSession } from '@/tests/setup-mocks';
import { testUsers } from '@/tests/trpc-helpers';

const adminId = testUsers.admin.id;

const mockRequest = (over: Partial<NextApiRequest>) =>
  ({ body: {}, cookies: {}, headers: {}, query: {}, ...over }) as unknown as NextApiRequest;

const mockResponse = () => {
  const res = { end: vi.fn(), headersSent: false, json: vi.fn(), setHeader: vi.fn(), status: vi.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res as unknown as NextApiResponse & { status: ReturnType<typeof vi.fn> };
};

const listImpersonationEvents = () =>
  kdb
    .selectFrom('events')
    .select(['author_id', 'context_id', 'context_type', 'data', 'type'])
    .where('type', 'in', ['user_impersonation_started', 'user_impersonation_stopped'])
    .orderBy('created_at')
    .execute();

describe('/api/admin/impersonate', () => {
  beforeEach(async () => {
    vi.stubEnv('NEXTAUTH_SECRET', 'test-secret');
    await cleanDatabase();
    await seedTableUser([{ id: adminId, role: 'admin' }]);
  });

  it("trace le début d'imposture avec l'admin comme auteur", async () => {
    mockGetServerSession.mockResolvedValue({ user: { active: true, id: adminId, role: 'admin' } });

    await impersonateHandler(
      mockRequest({
        body: { anonymize: true, permissions: [{ resource_id: '7501', type: 'reseau_de_chaleur' }], role: 'gestionnaire' },
        method: 'POST',
      }),
      mockResponse()
    );

    expect(await listImpersonationEvents()).toStrictEqual([
      {
        author_id: adminId,
        context_id: adminId,
        context_type: 'user',
        data: { anonymize: true, permissions_count: 1, role: 'gestionnaire' },
        type: 'user_impersonation_started',
      },
    ]);
  });

  it("trace la fin d'imposture avec le rôle quitté", async () => {
    mockGetServerSession.mockResolvedValue({ impersonating: true, user: { active: true, id: adminId, role: 'gestionnaire' } });

    const sessionToken = await encode({ secret: 'test-secret', token: { impersonatedProfile: { role: 'gestionnaire' }, sub: adminId } });

    await impersonateHandler(mockRequest({ cookies: { 'next-auth.session-token': sessionToken }, method: 'DELETE' }), mockResponse());

    expect(await listImpersonationEvents()).toStrictEqual([
      {
        author_id: adminId,
        context_id: adminId,
        context_type: 'user',
        data: { role: 'gestionnaire' },
        type: 'user_impersonation_stopped',
      },
    ]);
  });

  it("n'écrit rien si un non-admin tente une imposture", async () => {
    mockGetServerSession.mockResolvedValue({ user: { active: true, id: adminId, role: 'gestionnaire' } });
    const res = mockResponse();

    await impersonateHandler(mockRequest({ body: { role: 'particulier' }, method: 'POST' }), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(await listImpersonationEvents()).toStrictEqual([]);
  });
});
