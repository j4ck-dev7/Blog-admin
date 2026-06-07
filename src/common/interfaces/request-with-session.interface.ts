import { Request } from 'express';

export interface SessionUser {
  userId: string;
  role: string;
  email: string;
  name: string;
}

export interface CustomSession {
  userId?: string;
  role?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

export type RequestWithSession = Request & {
  session?: CustomSession;
};
