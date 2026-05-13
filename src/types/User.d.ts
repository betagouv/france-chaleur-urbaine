import type { UserRole } from './enum/UserRole';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  receive_new_demands: boolean;
  receive_old_demands: boolean;
  active: boolean;
  created_at: Date;
}
