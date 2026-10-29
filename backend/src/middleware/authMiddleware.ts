import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserRole } from '../types/auth';

/**
 * Middleware requiring valid session cookie or Bearer token
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.fleetwise_session;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please log in to continue.',
      },
    });
  }

  try {
    const user = await AuthService.validateSession(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired or is invalid. Please log in again.',
        },
      });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred during authentication verification.',
      },
    });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' lacks sufficient privileges for this endpoint.`,
        },
      });
    }

    next();
  };
}
