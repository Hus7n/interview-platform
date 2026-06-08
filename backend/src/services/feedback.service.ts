import { feedbackRepository } from '../repositories/feedback.repository';
import { interviewRepository } from '../repositories/interview.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { AppError } from '../utils/errors';

export const feedbackService = {
  async submit(
    interviewId: string,
    reviewerId: string,
    data: {
      technicalRating: number;
      communicationRating: number;
      problemSolvingRating: number;
      recommendation: string;
      writtenFeedback?: string;
    }
  ) {
    const isParticipant = await interviewRepository.isParticipant(interviewId, reviewerId);
    if (!isParticipant) throw new AppError(403, 'Forbidden');

    const feedback = await feedbackRepository.create({
      interviewId,
      reviewerId,
      ...data,
    });

    const interview = await interviewRepository.findById(interviewId);
    if (interview) {
      await notificationRepository.create(
        interview.created_by,
        `Feedback submitted for: ${interview.title}`
      );
    }

    return feedback;
  },

  async list(interviewId: string, userId: string, role: string) {
    if (role !== 'admin') {
      const isParticipant = await interviewRepository.isParticipant(interviewId, userId);
      if (!isParticipant) throw new AppError(403, 'Forbidden');
    }
    return feedbackRepository.findByInterview(interviewId);
  },
};
