import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notification.repository';

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const notifications = await notificationRepository.findForUser(req.user!.userId);
      res.json(notifications);
    } catch (e) {
      next(e);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markRead(req.params.id, req.user!.userId);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  },
};
