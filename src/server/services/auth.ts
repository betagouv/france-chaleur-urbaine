import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';

import { kdb } from '@/server/db/kysely';

export const auth = betterAuth({
  database: kdb,
  emailAndPassword: {
    enabled: true,

    autoSignIn: false,
    // allowSignup: true,
    // allowResetPassword: true,
    // allowChangePassword: true,
  },
  advanced: {
    useSecureCookies: true,
  },
  plugins: [nextCookies()],
});
