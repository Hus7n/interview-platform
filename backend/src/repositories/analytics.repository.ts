import { query } from "../db.js";

export const analyticsRepository = {
    async getDashboardStats() {
        const { rows } = await query(`
            SELECT
                (SELECT COUNT(*)::int FROM interviews) AS total_interviews,
                (SELECT COUNT(*)::int FROM interviews WHERE status = 'completed') AS completed_interviews,
                (SELECT COUNT(*)::int FROM interviews WHERE status = 'scheduled') AS scheduled_interviews,
                (SELECT COUNT(*)::int FROM interviews WHERE status = 'in_progress') AS active_interviews,
                (SELECT COUNT(*)::int FROM users WHERE is_active = true) AS active_users,
                (SELECT COUNT(*)::int FROM users) AS total_users,
                (SELECT COUNT(*)::int FROM interview_participants WHERE role = 'candidate') AS total_candidates
        `);
        return rows[0];
    },

    async getAverageRatings() {
        const { rows } = await query(`
            SELECT
                ROUND(AVG(technical_rating)::numeric, 2) AS avg_technical,
                ROUND(AVG(communication_rating)::numeric, 2) AS avg_communication,
                ROUND(AVG(problem_solving_rating)::numeric, 2) AS avg_problem_solving,
                ROUND(AVG((technical_rating + communication_rating + problem_solving_rating)::numeric / 3), 2) AS avg_overall,
                COUNT(*)::int AS total_feedback
            FROM feedback
        `);
        return rows[0];
    },

    async getInterviewsByLanguage() {
        const { rows } = await query(`
            SELECT language, COUNT(*)::int AS count
            FROM interviews
            GROUP BY language
            ORDER BY count DESC
        `);
        return rows;
    },

    async getInterviewsByMonth(months = 6) {
        const { rows } = await query(`
            SELECT
                TO_CHAR(created_at, 'YYYY-MM') AS month,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
            FROM interviews
            WHERE created_at >= NOW() - ($1 || ' months')::interval
            GROUP BY month
            ORDER BY month ASC
        `, [months]);
        return rows;
    },

    async getTopInterviewers(limit = 10) {
        const { rows } = await query(`
            SELECT
                u.id,
                p.display_name,
                COUNT(DISTINCT i.id)::int AS interviews_conducted,
                ROUND(AVG(f.technical_rating + f.communication_rating + f.problem_solving_rating)::numeric / 3, 2) AS avg_rating
            FROM users u
            JOIN profiles p ON p.user_id = u.id
            JOIN interview_participants ip ON ip.user_id = u.id AND ip.role = 'interviewer'
            JOIN interviews i ON i.id = ip.interview_id AND i.status = 'completed'
            LEFT JOIN feedback f ON f.interview_id = i.id AND f.reviewer_id = u.id
            GROUP BY u.id, p.display_name
            ORDER BY interviews_conducted DESC
            LIMIT $1
        `, [limit]);
        return rows;
    },

    async getHireRate() {
        const { rows } = await query(`
            SELECT
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE recommendation = 'hire')::int AS hired,
                COUNT(*) FILTER (WHERE recommendation = 'no_hire')::int AS not_hired,
                CASE WHEN COUNT(*) > 0
                    THEN ROUND(COUNT(*) FILTER (WHERE recommendation = 'hire')::numeric / COUNT(*) * 100, 1)
                    ELSE 0
                END AS hire_rate
            FROM feedback
        `);
        return rows[0];
    },
};
