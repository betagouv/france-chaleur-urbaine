import type { UserRole } from './enum/UserRole';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: Date;
}
