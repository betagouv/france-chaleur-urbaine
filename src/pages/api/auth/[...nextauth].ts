import bcrypt from 'bcryptjs';
import nextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import db from 'src/db';

const login = async (email: string, password: string) => {
  const user = await db('users').select().where({ email }).first();

  if (!user) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return null;
  }

  await db('users')
    .where({ id: user.id })
    .update({ last_connection: new Date() });

  return {
    id: user.id,
    gestionnaire: user.gestionnaire,
    email: user.email,
  };
};

export default nextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/connexion',
    error: '/connexion',
  },
  callbacks: {
    redirect: ({ url, baseUrl }) => url || baseUrl,
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
});
