import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const identifier = req.body.identifier || req.body.username || req.body.email;
    const password = req.body.password;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username or email is required.',
        },
      });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password is required.',
        },
      });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const { user, sessionToken, expiresAt } = await AuthService.login({
      identifier,
      password,
      ipAddress,
      userAgent,
    });

    // Set secure HttpOnly cookie
    res.cookie('fleetwise_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24h
      path: '/',
    });

    return res.status(200).json({
      success: true,
      data: {
        user,
        token: sessionToken,
        expiresAt,
      },
      message: `Welcome back, ${user.name}!`,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: error.code || 'AUTH_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.fleetwise_session;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      await AuthService.logout(token);
    }

    res.clearCookie('fleetwise_session', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out.',
    });
  } catch (error: any) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}
