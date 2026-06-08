import { query } from '../db';

export const notificationRepository = {
  async create(userId: string, message: string) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *`,
      [userId, message]
    );
    return rows[0];
  },

  async findForUser(userId: string) {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return rows;
  },

  async markRead(id: string, userId: string) {
    await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
  },
};
