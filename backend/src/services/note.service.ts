import { noteRepository } from '../repositories/note.repository';
import { interviewRepository } from '../repositories/interview.repository';
import { AppError } from '../utils/errors';

export const noteService = {
  async save(interviewId: string, authorId: string, content: string, isPrivate: boolean) {
    const isParticipant = await interviewRepository.isParticipant(interviewId, authorId);
    if (!isParticipant) throw new AppError(403, 'Forbidden');
    return noteRepository.upsert(interviewId, authorId, content, isPrivate);
  },

  async list(interviewId: string, userId: string) {
    const isParticipant = await interviewRepository.isParticipant(interviewId, userId);
    if (!isParticipant) throw new AppError(403, 'Forbidden');
    return noteRepository.findForInterview(interviewId, userId);
  },
};
