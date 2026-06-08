import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { feedbackService } from '../services/feedback.service';

const submitSchema = z.object({
  technicalRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  problemSolvingRating: z.number().min(1).max(5),
  recommendation: z.enum(['hire', 'no_hire']),
  writtenFeedback: z.string().optional(),
});

export const feedbackController = {
  async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = submitSchema.parse(req.body);
      const feedback = await feedbackService.submit(req.params.interviewId, req.user!.userId, data);
      res.status(201).json(feedback);
    } catch (e) {
      next(e);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const feedback = await feedbackService.list(
        req.params.interviewId,
        req.user!.userId,
        req.user!.role
      );
      res.json(feedback);
    } catch (e) {
      next(e);
    }
  },
};
