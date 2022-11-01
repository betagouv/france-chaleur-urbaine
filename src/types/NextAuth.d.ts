import 'next-auth';
import { USER_ROLE } from './enums/userRole';

export interface User {
  role: USER_ROLE;
  gestionnaire: string;
  email: string;
}

declare module 'next-auth' {
  interface Session {
    user: User;
  }

  interface User {
    role: USER_ROLE;
    gestionnaire: string;
    email: string;
  }
}

declare module 'next' {
  interface NextApiRequest {
    user: User;
  }
}
