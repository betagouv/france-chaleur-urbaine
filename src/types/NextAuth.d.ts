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
    email: string;
    active: boolean;
    signature: string;
    gestionnaires: string[] | null;
    signature: string | null;
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
      role: 'gestionnaire';
      gestionnaires: string[];
    };
  }
}
