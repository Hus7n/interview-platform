import { query } from '../db';

export const feedbackRepository = {
  async create(data: {
    interviewId: string;
    reviewerId: string;
    technicalRating: number;
    communicationRating: number;
    problemSolvingRating: number;
    recommendation: string;
    writtenFeedback?: string;
  }) {
    const { rows } = await query(
      `INSERT INTO feedback (interview_id, reviewer_id, technical_rating, communication_rating, problem_solving_rating, recommendation, written_feedback)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (interview_id, reviewer_id) DO UPDATE SET
         technical_rating = $3, communication_rating = $4, problem_solving_rating = $5,
         recommendation = $6, written_feedback = $7
       RETURNING *`,
      [
        data.interviewId,
        data.reviewerId,
        data.technicalRating,
        data.communicationRating,
        data.problemSolvingRating,
        data.recommendation,
        data.writtenFeedback || null,
      ]
    );
    return rows[0];
  },

  async findByInterview(interviewId: string) {
    const { rows } = await query(
      `SELECT f.*, p.display_name as reviewer_name
       FROM feedback f
       LEFT JOIN profiles p ON p.user_id = f.reviewer_id
       WHERE f.interview_id = $1`,
      [interviewId]
    );
    return rows;
  },
};
