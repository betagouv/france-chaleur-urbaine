import bcrypt from 'bcryptjs';
import nextAuth, { AuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import db from 'src/db';

const login = async (email: string, password: string) => {
  const user = await db('users')
    .select()
    .where('email', email.toLowerCase().trim())
    .andWhere('active', true)
    .first();

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return null;
  }

  return {
    id: user.id,
    gestionnaires: user.gestionnaires,
    role: user.role,
    email: user.email,
    signature: user.signature,
  };
};

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
      const [user] = await db('users')
        .where({ email: session.user.email })
        .update({ last_connection: new Date() })
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
        ]);

      if (token) {
        return {
          ...session,
          user,
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
        if (credentials) {
          const user = await login(credentials.email, credentials.password);
          if (user) {
            return user;
          }
        }

        return null;
      },
    }),
  ],
};

export default nextAuth(nextAuthOptions);
