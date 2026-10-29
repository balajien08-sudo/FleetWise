export type UserRole = 'ADMIN' | 'DISPATCHER';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface SessionData {
  id: string;
  userId: number;
  expiresAt: Date;
  user: AuthUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionToken?: string;
    }
  }
}
