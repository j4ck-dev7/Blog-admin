export interface Admin {
  id: string;
  password: string;
}

export interface AdminWithRole {
  name: string;
  role: string;
  email: string;
}
