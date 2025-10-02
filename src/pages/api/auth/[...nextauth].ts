import nextAuth, { type AuthOptions, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { login } from '@/modules/auth/server/service';
import { kdb } from '@/server/db/kysely';
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
      // update the last_connection date and return the latest user data
      const user = await kdb
        .updateTable('users')
        .set({
          last_connection: new Date(),
        })
        .where('id', '=', token.sub as string)
        .returning([
          'id',
          'email',
          'role',
          'gestionnaires',
          'receive_new_demands',
          'receive_old_demands',
          'active',
          'created_at',
          'signature',
        ])
        .executeTakeFirst();

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
