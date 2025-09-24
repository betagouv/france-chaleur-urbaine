import nextAuth, { type AuthOptions, type Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { login } from '@/modules/auth/server/service';
import { kdb } from '@/server/db/kysely';

export const nextAuthOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/connexion',
    error: '/connexion',
  },
  callbacks: {
    redirect: ({ url, baseUrl }) => url || baseUrl,
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          role: user.role,
          email: user.email,
          gestionnaires: user.gestionnaires,
          signature: user.signature,
        };
      }
      return token;
    },
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
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      authorize: async (credentials) => {
        return credentials ? await login(credentials.email, credentials.password) : null;
      },
    }),
  ],
};

export default nextAuth(nextAuthOptions);
