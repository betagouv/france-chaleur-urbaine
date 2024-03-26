import 'next-auth';
import { USER_ROLE } from './enum/UserRole';

declare module 'next-auth' {
  interface Session {
    user: User;
  }

  interface User {
    role: USER_ROLE;
    gestionnaires: string[];
    email: string;
    signature: string;
  }
}

declare module 'next' {
  interface NextApiRequest {
    user: User;
  }
}
