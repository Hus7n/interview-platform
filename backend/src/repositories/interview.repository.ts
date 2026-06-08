import { query } from '../db';

export const interviewRepository = {
  async create(data: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes: number;
    roomId: string;
    language: string;
    starterCode?: string;
    createdBy: string;
    interviewerId: string;
    candidateId: string;
  }) {
    const client = await (await import('../db')).pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `INSERT INTO interviews (title, description, scheduled_at, duration_minutes, room_id, language, starter_code, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          data.title,
          data.description || null,
          data.scheduledAt,
          data.durationMinutes,
          data.roomId,
          data.language,
          data.starterCode || '// Write your solution here\n',
          data.createdBy,
        ]
      );
      const interview = rows[0];
      await client.query(
        `INSERT INTO interview_participants (interview_id, user_id, role) VALUES ($1, $2, 'interviewer'), ($1, $3, 'candidate')`,
        [interview.id, data.interviewerId, data.candidateId]
      );
      await client.query('COMMIT');
      return interview;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async findById(id: string) {
    const { rows } = await query(`SELECT * FROM interviews WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async findByRoomId(roomId: string) {
    const { rows } = await query(`SELECT * FROM interviews WHERE room_id = $1`, [roomId]);
    return rows[0] || null;
  },

  async findForUser(userId: string) {
    const { rows } = await query(
      `SELECT i.*, ip.role as participant_role
       FROM interviews i
       JOIN interview_participants ip ON ip.interview_id = i.id
       WHERE ip.user_id = $1
       ORDER BY i.scheduled_at DESC`,
      [userId]
    );
    return rows;
  },

  async findAll() {
    const { rows } = await query(`SELECT * FROM interviews ORDER BY scheduled_at DESC`);
    return rows;
  },

  async update(id: string, data: Partial<{
    title: string;
    scheduled_at: string;
    status: string;
    description: string;
    duration_minutes: number;
    language: string;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(val);
      }
    }
    if (!fields.length) return null;
    values.push(id);
    const { rows } = await query(
      `UPDATE interviews SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0];
  },

  async getParticipants(interviewId: string) {
    const { rows } = await query(
      `SELECT ip.*, p.display_name, u.email
       FROM interview_participants ip
       JOIN users u ON u.id = ip.user_id
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE ip.interview_id = $1`,
      [interviewId]
    );
    return rows;
  },

  async isParticipant(interviewId: string, userId: string) {
    const { rows } = await query(
      `SELECT 1 FROM interview_participants WHERE interview_id = $1 AND user_id = $2`,
      [interviewId, userId]
    );
    return rows.length > 0;
  },

  async isParticipantByRoom(roomId: string, userId: string) {
    const { rows } = await query(
      `SELECT 1 FROM interviews i
       JOIN interview_participants ip ON ip.interview_id = i.id
       WHERE i.room_id = $1 AND ip.user_id = $2`,
      [roomId, userId]
    );
    return rows.length > 0;
  },
};
