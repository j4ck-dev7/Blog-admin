export interface Admin {
  id?: string;
  password?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface AdminWithRole {
  name: string;
  role: string;
  email: string;
}
