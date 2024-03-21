import 'next-auth';
import { USER_ROLE } from './enum/UserRole';

declare module 'next-auth' {
  interface Session {
    user: User;
    impersonating?: true;
  }

  interface User {
    role: USER_ROLE;
    gestionnaires: string[];
    email: string;
  }
}

declare module 'next' {
  interface NextApiRequest {
    user: User;
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
