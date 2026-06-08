import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { noteService } from '../services/note.service';

const saveSchema = z.object({
  content: z.string(),
  isPrivate: z.boolean().default(true),
});

export const noteController = {
  async save(req: Request, res: Response, next: NextFunction) {
    try {
      const data = saveSchema.parse(req.body);
      const note = await noteService.save(
        req.params.interviewId,
        req.user!.userId,
        data.content,
        data.isPrivate
      );
      res.json(note);
    } catch (e) {
      next(e);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const notes = await noteService.list(req.params.interviewId, req.user!.userId);
      res.json(notes);
    } catch (e) {
      next(e);
    }
  },
};
