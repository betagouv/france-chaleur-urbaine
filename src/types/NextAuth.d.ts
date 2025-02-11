import 'next-auth';
import { type UserRole } from './enum/UserRole';

declare module 'next-auth' {
  interface Session {
    user: User;
    impersonating?: true;
  }

  interface User {
    id: string;
    role: UserRole;
    roles: UserRole[];
    email: string;
    active: boolean;
    gestionnaires: string[] | null;
    signature: string | null;
  }
}

declare module 'next' {
  interface NextApiRequest {
    user: User; // authenticated user on if any
    session: Session; // session containing the authenticated user. Only used directly with impersonation
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    impersonatedProfile?: {
      roles: ['gestionnaire'];
      gestionnaires: string[];
    };
  }
}
