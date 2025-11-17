import nextAuth, { type AuthOptions, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { login } from '@/modules/auth/server/service';
import { getUserSession } from '@/modules/auth/server/session';
import { stripDomainFromURL } from '@/utils/url';

export const nextAuthOptions: AuthOptions = {
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          email: user.email,
          gestionnaires: user.gestionnaires,
          role: user.role,
          signature: user.signature,
        };
      }
      return token;
    },
    redirect: ({ url, baseUrl }) => stripDomainFromURL(url) ?? baseUrl,
    async session({ session, token }) {
      const user = token?.sub ? await getUserSession(token.sub) : null;

      if (token) {
        return {
          ...session,
          user: {
            ...user,

            // if an impersonated profile exists, override the current profile data (role, gestionnaire)
            ...token.impersonatedProfile,
          },
          ...(token.impersonatedProfile ? { impersonating: true } : {}),
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
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

export default nextAuth(nextAuthOptions);
