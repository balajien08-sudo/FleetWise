import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await AuthService.getUsers();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, username, name, password, role } = req.body;

    if (!email || !username || !name || !password || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields (email, username, name, password, role) are required.',
        },
      });
    }

    if (!['ADMIN', 'DISPATCHER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role must be either ADMIN or DISPATCHER.',
        },
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long.',
        },
      });
    }

    const actorName = req.user?.name || 'Administrator';
    const actorId = req.user?.id || 1;

    const newUser = await AuthService.createUser(
      { email, username, name, password, role },
      actorName,
      actorId
    );

    return res.status(201).json({
      success: true,
      data: newUser,
      message: `User '${newUser.username}' created successfully.`,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: {
          code: 'USER_ERROR',
          message: error.message,
        },
      });
    }
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid user ID.' },
      });
    }

    const { name, role, isActive, password } = req.body;
    if (role && !['ADMIN', 'DISPATCHER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Role must be ADMIN or DISPATCHER.' },
      });
    }

    const actorName = req.user?.name || 'Administrator';
    const actorId = req.user?.id || 1;

    const updated = await AuthService.updateUser(
      id,
      { name, role, isActive, password },
      actorName,
      actorId
    );

    return res.status(200).json({
      success: true,
      data: updated,
      message: `User '${updated.username}' updated successfully.`,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { code: 'USER_ERROR', message: error.message },
      });
    }
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid user ID.' },
      });
    }

    const actorName = req.user?.name || 'Administrator';
    const actorId = req.user?.id || 1;

    await AuthService.deleteUser(id, actorName, actorId);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        error: { code: 'USER_ERROR', message: error.message },
      });
    }
    next(error);
  }
}
