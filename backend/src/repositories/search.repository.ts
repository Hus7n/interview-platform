import { query } from "../db.js";

export const searchRepository = {
    async searchAll(searchTerm: string, userId: string, limit: number) {
        const pattern = `%${searchTerm}%`;

        const [users, interviews] = await Promise.all([
            query(
                `SELECT u.id, u.email, u.role, p.display_name, p.avatar_url, 'user' AS type
                 FROM users u
                 LEFT JOIN profiles p ON p.user_id = u.id
                 WHERE (u.email ILIKE $1 OR p.display_name ILIKE $1)
                 AND u.id != $2
                 AND u.is_active = true
                 LIMIT $3`,
                [pattern, userId, limit]
            ),
            query(
                `SELECT i.id, i.title, i.description, i.status, i.language, i.scheduled_at,
                        p.display_name AS creator_name, 'interview' AS type
                 FROM interviews i
                 LEFT JOIN profiles p ON p.user_id = i.created_by
                 LEFT JOIN interview_participants ip ON ip.interview_id = i.id
                 WHERE (i.title ILIKE $1 OR i.description ILIKE $1)
                 AND (i.created_by = $2 OR ip.user_id = $2)
                 GROUP BY i.id, p.display_name
                 LIMIT $3`,
                [pattern, userId, limit]
            ),
        ]);

        return {
            users: users.rows,
            interviews: interviews.rows,
        };
    },
};
