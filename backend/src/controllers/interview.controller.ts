import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { interviewService } from '../services/interview.service';

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number().min(15).max(240).default(60),
  language: z.string().default('javascript'),
  interviewerId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().min(15).max(240).optional(),
  language: z.string().optional(),
});

export const interviewController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSchema.parse(req.body);
      const interview = await interviewService.create(data, req.user!.userId);
      res.status(201).json(interview);
    } catch (e) {
      next(e);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const interviews = await interviewService.list(req.user!.userId, req.user!.role);
      res.json(interviews);
    } catch (e) {
      next(e);
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await interviewService.get(req.params.id, req.user!.userId, req.user!.role);
      res.json(interview);
    } catch (e) {
      next(e);
    }
  },

  async getByRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await interviewService.getByRoom(req.params.roomId, req.user!.userId);
      res.json(interview);
    } catch (e) {
      next(e);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateSchema.parse(req.body);
      const interview = await interviewService.update(
        req.params.id,
        data,
        req.user!.userId,
        req.user!.role
      );
      res.json(interview);
    } catch (e) {
      next(e);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await interviewService.cancel(req.params.id, req.user!.userId, req.user!.role);
      res.json(interview);
    } catch (e) {
      next(e);
    }
  },
};
