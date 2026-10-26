import 'next-auth';

import type { UserRole } from './enum/UserRole';

declare module 'next-auth' {
  interface Session {
    user: User;
    impersonating?: true;
    impersonatedPermissions?: { type: string; resource_id: string | null }[];
    anonymize?: true;
  }

  interface User {
    id: string;
    role: UserRole;
    email: string;
    active: boolean;
  }
}

declare module 'next' {
  interface NextApiRequest {
    user: User; // authenticated user if any
    session: Session; // session containing the authenticated user. Only used directly with impersonation
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    impersonatedProfile?: {
      role: UserRole;
      permissions?: { type: string; resource_id: string | null }[];
      anonymize?: boolean;
      /** full-profile impersonation (dev only): the session is built from this account instead of the admin's */
      userId?: string;
    };
  }
}
