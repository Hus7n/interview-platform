import { query } from '../db';

export const noteRepository = {
  async upsert(interviewId: string, authorId: string, content: string, isPrivate: boolean) {
    const existing = await query(
      `SELECT id FROM notes WHERE interview_id = $1 AND author_id = $2 AND is_private = $3`,
      [interviewId, authorId, isPrivate]
    );
    if (existing.rows[0]) {
      const { rows } = await query(
        `UPDATE notes SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [content, existing.rows[0].id]
      );
      return rows[0];
    }
    const { rows } = await query(
      `INSERT INTO notes (interview_id, author_id, content, is_private) VALUES ($1, $2, $3, $4) RETURNING *`,
      [interviewId, authorId, content, isPrivate]
    );
    return rows[0];
  },

  async findForInterview(interviewId: string, userId: string) {
    const { rows } = await query(
      `SELECT n.*, p.display_name as author_name
       FROM notes n
       LEFT JOIN profiles p ON p.user_id = n.author_id
       WHERE n.interview_id = $1 AND (n.is_private = false OR n.author_id = $2)
       ORDER BY n.updated_at DESC`,
      [interviewId, userId]
    );
    return rows;
  },
};
