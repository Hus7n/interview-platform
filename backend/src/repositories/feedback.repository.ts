import { query } from "../db.js";

type FeedbackRecord = {
    id: string;
    interview_id: string;
    reviewer_id: string;
    technical_rating: number;
    communication_rating: number;
    problem_solving_rating: number;
    recommendation: string;
    written_feedback: string | null;
    created_at: Date | string;
    updated_at: Date | string;
};

export const feedbackRepository = {
    async create(data: {
        interviewId: string;
        reviewerId: string;
        technicalRating: number;
        communicationRating: number;
        problemSolvingRating: number;
        recommendation: string;
        writtenFeedback?: string | null;
    }) {
        const { rows } = await query(
            `INSERT INTO feedback
            (interview_id, reviewer_id, technical_rating, communication_rating,
             problem_solving_rating, recommendation, written_feedback)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [
                data.interviewId,
                data.reviewerId,
                data.technicalRating,
                data.communicationRating,
                data.problemSolvingRating,
                data.recommendation,
                data.writtenFeedback ?? null,
            ]
        );
        return rows[0] as FeedbackRecord;
    },

    async findById(feedbackId: string) {
        const { rows } = await query(
            `SELECT * FROM feedback WHERE id = $1 LIMIT 1`,
            [feedbackId]
        );
        return (rows[0] as FeedbackRecord | undefined) ?? null;
    },

    async findByInterviewAndReviewer(interviewId: string, reviewerId: string) {
        const { rows } = await query(
            `SELECT * FROM feedback
            WHERE interview_id = $1 AND reviewer_id = $2
            LIMIT 1`,
            [interviewId, reviewerId]
        );
        return (rows[0] as FeedbackRecord | undefined) ?? null;
    },

    async findByInterviewId(interviewId: string, page: number, limit: number) {
        const offset = (page - 1) * limit;
        const { rows } = await query(
            `SELECT f.*, u.email AS reviewer_email, p.display_name AS reviewer_name
            FROM feedback f
            JOIN users u ON u.id = f.reviewer_id
            LEFT JOIN profiles p ON p.user_id = u.id
            WHERE f.interview_id = $1
            ORDER BY f.created_at DESC
            LIMIT $2 OFFSET $3`,
            [interviewId, limit, offset]
        );
        return rows as (FeedbackRecord & { reviewer_email: string; reviewer_name: string | null })[];
    },

    async countByInterviewId(interviewId: string) {
        const { rows } = await query(
            `SELECT COUNT(*)::int AS total FROM feedback WHERE interview_id = $1`,
            [interviewId]
        );
        return (rows[0] as { total: number } | undefined)?.total ?? 0;
    },

    async update(feedbackId: string, data: {
        technical_rating?: number | undefined;
        communication_rating?: number | undefined;
        problem_solving_rating?: number | undefined;
        recommendation?: string | undefined;
        written_feedback?: string | null | undefined;
    }) {
        const values: unknown[] = [];
        const updates: string[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                values.push(value);
                updates.push(`${key} = $${values.length}`);
            }
        }

        if (updates.length === 0) return null;

        values.push(feedbackId);
        const { rows } = await query(
            `UPDATE feedback SET ${updates.join(", ")},
            updated_at = NOW()
            WHERE id = $${values.length}
            RETURNING *`,
            values
        );
        return (rows[0] as FeedbackRecord | undefined) ?? null;
    },

    async delete(feedbackId: string) {
        const { rows } = await query(
            `DELETE FROM feedback WHERE id = $1 RETURNING *`,
            [feedbackId]
        );
        return (rows[0] as FeedbackRecord | undefined) ?? null;
    },

    async deleteByInterviewId(interviewId: string) {
        await query(
            `DELETE FROM feedback WHERE interview_id = $1`,
            [interviewId]
        );
    },
};
