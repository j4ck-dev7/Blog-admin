import { Request } from 'express';

export interface SessionUser {
  userId: string;
  role: string;
  email: string;
  name: string;
}

export interface RequestWithSession extends Request {
  session?: {
    userId?: string;
    role?: string;
    email?: string;
    name?: string;
  } & Partial<SessionUser>;
}
