import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../utils/errors';

export const userController = {
  async listCandidates(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userRepository.findByRole('candidate');
      res.json(users);
    } catch (e) {
      next(e);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userRepository.findAll();
      res.json(users);
    } catch (e) {
      next(e);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const schema = z.object({ role: z.enum(['admin', 'interviewer', 'candidate']) });
      const { role } = schema.parse(req.body);
      const user = await userRepository.updateRole(req.params.id, role);
      if (!user) throw new AppError(404, 'User not found');
      res.json(user);
    } catch (e) {
      next(e);
    }
  },
};
