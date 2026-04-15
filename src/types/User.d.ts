export interface User {
  id: string;
  email: string;
  role: USER_ROLE;
  receive_new_demands: boolean;
  receive_old_demands: boolean;
  active: boolean;
  created_at: Date;
}
