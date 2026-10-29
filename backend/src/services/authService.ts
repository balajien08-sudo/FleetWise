import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthUser, UserRole } from '../types/auth';

// In-memory rate limiting map for login attempts
interface RateLimitRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const loginRateLimits = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export class AuthService {
  /**
   * Helper to hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Helper to verify password
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash raw session token using SHA-256 before saving to DB
   */
  static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Check and enforce rate limiting for login attempts
   */
  private static checkRateLimit(key: string): void {
    const record = loginRateLimits.get(key);
    const now = Date.now();

    if (record) {
      if (record.blockedUntil && record.blockedUntil > now) {
        const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
        const error = new Error(`Too many failed login attempts. Temporarily locked for security. Please try again in ${remainingMinutes} minute(s).`);
        (error as any).status = 429;
        (error as any).code = 'RATE_LIMITED';
        throw error;
      }

      // If window expired, reset
      if (now - record.firstAttempt > WINDOW_MS) {
        loginRateLimits.delete(key);
      }
    }
  }

  /**
   * Record a failed attempt
   */
  private static recordFailedAttempt(key: string): void {
    const now = Date.now();
    const record = loginRateLimits.get(key);

    if (!record || (now - record.firstAttempt > WINDOW_MS)) {
      loginRateLimits.set(key, { attempts: 1, firstAttempt: now });
    } else {
      record.attempts += 1;
      if (record.attempts >= MAX_ATTEMPTS) {
        record.blockedUntil = now + BLOCK_DURATION_MS;
      }
    }
  }

  /**
   * Reset rate limit upon successful login
   */
  private static clearRateLimit(key: string): void {
    loginRateLimits.delete(key);
  }

  /**
   * Authenticate user and create a new session
   */
  static async login(params: {
    identifier: string; // username or email
    password: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ user: AuthUser; sessionToken: string; expiresAt: Date }> {
    const { identifier, password, ipAddress, userAgent } = params;
    const rateLimitKey = `${ipAddress || 'unknown'}:${identifier.toLowerCase()}`;

    // 1. Rate limit check
    this.checkRateLimit(rateLimitKey);

    // 2. Query user by email or username
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
    });

    if (!user || !user.isActive) {
      this.recordFailedAttempt(rateLimitKey);
      // Log failed attempt audit
      await prisma.activityLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          entityId: normalizedIdentifier,
          details: JSON.stringify({
            reason: user ? 'Account deactivated' : 'User not found',
            ipAddress,
            userAgent,
          }),
          actorId: normalizedIdentifier,
        },
      });

      const error = new Error('Invalid credentials or account is deactivated.');
      (error as any).status = 401;
      (error as any).code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // 3. Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      this.recordFailedAttempt(rateLimitKey);
      await prisma.activityLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          entityId: user.username,
          details: JSON.stringify({
            reason: 'Incorrect password',
            ipAddress,
            userAgent,
          }),
          actorId: user.username,
          userId: user.id,
        },
      });

      const error = new Error('Invalid credentials.');
      (error as any).status = 401;
      (error as any).code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // 4. Successful login -> Clear rate limiter
    this.clearRateLimit(rateLimitKey);

    // 5. Generate secure random session token
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawSessionToken);
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 6. Save session in database
    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: hashedToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // 7. Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 8. Log successful login
    await prisma.activityLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        entityType: 'AUTH',
        entityId: user.username,
        details: JSON.stringify({
          role: user.role,
          ipAddress,
          userAgent,
        }),
        actorId: user.name,
        userId: user.id,
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
    };

    return {
      user: authUser,
      sessionToken: rawSessionToken,
      expiresAt,
    };
  }

  /**
   * Log out session by token
   */
  static async logout(rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (session) {
      await prisma.session.delete({
        where: { id: session.id },
      });

      await prisma.activityLog.create({
        data: {
          action: 'LOGOUT',
          entityType: 'AUTH',
          entityId: session.user.username,
          details: JSON.stringify({
            userId: session.userId,
            sessionId: session.id,
          }),
          actorId: session.user.name,
          userId: session.userId,
        },
      });
    }
  }

  /**
   * Validate session token from Cookie or Bearer header
   */
  static async validateSession(rawToken: string): Promise<AuthUser | null> {
    if (!rawToken) return null;

    const hashedToken = this.hashToken(rawToken);
    const now = new Date();

    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!session || session.expiresAt <= now || !session.user.isActive) {
      // Clean up expired session if found
      if (session && session.expiresAt <= now) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      name: session.user.name,
      role: session.user.role as UserRole,
      isActive: session.user.isActive,
    };
  }

  /**
   * Ensure initial default users (ADMIN and DISPATCHER) exist safely
   */
  static async ensureDefaultUsers(): Promise<void> {
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@12345';
    const dispatcherPassword = process.env.INITIAL_DISPATCHER_PASSWORD || 'Dispatch@12345';

    const adminHash = await this.hashPassword(adminPassword);
    const dispatcherHash = await this.hashPassword(dispatcherPassword);

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@fleetwise.in',
        name: 'Fleet Administrator',
        role: 'ADMIN',
        passwordHash: adminHash,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { username: 'dispatcher' },
      update: {},
      create: {
        username: 'dispatcher',
        email: 'dispatcher@fleetwise.in',
        name: 'Lead Dispatcher',
        role: 'DISPATCHER',
        passwordHash: dispatcherHash,
        isActive: true,
      },
    });
  }

  /**
   * List all users (ADMIN only)
   */
  static async getUsers(): Promise<Omit<AuthUser, 'passwordHash'>[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users.map((u) => ({
      ...u,
      role: u.role as UserRole,
    }));
  }

  /**
   * Create a new user (ADMIN only)
   */
  static async createUser(data: {
    email: string;
    username: string;
    name: string;
    password: string;
    role: UserRole;
  }, actorName: string, actorId: number) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { username: data.username.toLowerCase() },
        ],
      },
    });

    if (existing) {
      const error = new Error('A user with that email or username already exists.');
      (error as any).status = 409;
      throw error;
    }

    const passwordHash = await this.hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        name: data.name,
        role: data.role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: user.username,
        details: JSON.stringify({
          createdUserId: user.id,
          role: user.role,
          name: user.name,
        }),
        actorId: actorName,
        userId: actorId,
      },
    });

    return user;
  }

  /**
   * Update existing user (ADMIN only)
   */
  static async updateUser(
    id: number,
    data: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
      password?: string;
    },
    actorName: string,
    actorId: number
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('User not found.');
      (error as any).status = 404;
      throw error;
    }

    // Prevent deactivating or demoting the last active ADMIN
    if (existing.role === 'ADMIN' && (data.role === 'DISPATCHER' || data.isActive === false)) {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        const error = new Error('Cannot demote or deactivate the sole remaining Administrator.');
        (error as any).status = 400;
        throw error;
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await this.hashPassword(data.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'USER_UPDATED',
        entityType: 'USER',
        entityId: updated.username,
        details: JSON.stringify({
          updatedFields: Object.keys(updateData).filter(k => k !== 'passwordHash'),
        }),
        actorId: actorName,
        userId: actorId,
      },
    });

    return updated;
  }

  /**
   * Delete user (ADMIN only)
   */
  static async deleteUser(id: number, actorName: string, actorId: number) {
    if (id === actorId) {
      const error = new Error('You cannot delete your own active administrator account.');
      (error as any).status = 400;
      throw error;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('User not found.');
      (error as any).status = 404;
      throw error;
    }

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'USER_DELETED',
        entityType: 'USER',
        entityId: existing.username,
        details: JSON.stringify({ deletedUserId: id, role: existing.role }),
        actorId: actorName,
        userId: actorId,
      },
    });

    return { success: true };
  }
}
