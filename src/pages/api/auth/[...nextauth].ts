import { parseCookie } from 'cookie';
import type { NextApiRequest } from 'next';
import nextAuth, { type AuthOptions, type Session } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

import { withLoginRateLimit } from '@/modules/auth/server/login-rate-limit';
import { isMfaVerificationFresh, requiresMfa, verifyMfaCode } from '@/modules/auth/server/mfa';
import { login } from '@/modules/auth/server/service';
import { getUserSession } from '@/modules/auth/server/session';
import { serverConfig } from '@/server/config';
import { stripDomainFromURL } from '@/utils/url';

export const nextAuthOptions: AuthOptions = {
  callbacks: {
    async jwt({ token, user, account }) {
      // Only the user ID (sub) is stored in the JWT, plus the time of the last admin second-factor check.
      // All other fields are loaded fresh from the DB in the session callback.
      if (user) {
        token.sub = user.id;
      }
      if (user && account?.provider === 'mfa') {
        token.mfaVerifiedAt = Date.now();
      }
      return token;
    },
    redirect: ({ url, baseUrl }) => stripDomainFromURL(url) ?? baseUrl,
    async session({ session, token }) {
      // full-profile impersonation (dev only): the session is the target account's; ignored entirely once the flag is off
      const impersonatedUserId = token?.impersonatedProfile?.userId;
      if (impersonatedUserId && !serverConfig.allowFullImpersonation) {
        token.impersonatedProfile = undefined;
      }
      const sessionUserId = token?.impersonatedProfile?.userId ?? token?.sub;
      const user = sessionUserId ? await getUserSession(sessionUserId) : null;

      // the second factor gates the whole session: no user is exposed (server or client) until the code is checked
      if (user && requiresMfa(user) && !isMfaVerificationFresh(token?.mfaVerifiedAt)) {
        return { expires: session.expires, mfaPending: true } as Session;
      }

      if (token) {
        const {
          permissions: impersonatedPermissions,
          anonymize: impersonatedAnonymize,
          userId: _impersonatedUserId,
          ...impersonatedProfileRest
        } = token.impersonatedProfile ?? {};
        return {
          ...session,
          user: {
            ...user,
            // if an impersonated profile exists, override the role
            ...(token.impersonatedProfile ? impersonatedProfileRest : {}),
          },
          ...(token.impersonatedProfile ? { impersonating: true } : {}),
          ...(impersonatedPermissions ? { impersonatedPermissions } : {}),
          ...(impersonatedAnonymize ? { anonymize: true } : {}),
        } as Session;
      }
      return session;
    },
  },
  pages: {
    error: '/connexion',
    signIn: '/connexion',
  },
  providers: [
    CredentialsProvider({
      authorize: async (credentials) => {
        return credentials ? await login(credentials.email, credentials.password) : null;
      },
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      name: 'Credentials',
    }),
    // Second step for admins: the 6-digit code of their authenticator app, checked against the account of the current (pending) session.
    CredentialsProvider({
      authorize: async (credentials, req) => {
        // `getToken` only reads `cookies` and `headers`, but is typed for a full Next request
        const token = await getToken({
          req: { cookies: parseCookie(req.headers?.cookie ?? ''), headers: req.headers ?? {} } as NextApiRequest,
        });
        return credentials && token?.sub ? await verifyMfaCode(token.sub, credentials.code) : null;
      },
      credentials: {
        code: { label: 'Code', type: 'text' },
      },
      id: 'mfa',
      name: 'Code de double authentification',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

export default withLoginRateLimit(nextAuth(nextAuthOptions));
