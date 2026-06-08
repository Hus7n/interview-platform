import { query } from '../db';

export const userRepository = {
  async findByEmail(email: string) {
    const { rows } = await query(
      `SELECT u.*, p.display_name FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  async findById(id: string) {
    const { rows } = await query(
      `SELECT u.*, p.display_name FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(email: string, passwordHash: string, role: string, displayName: string) {
    const client = await (await import('../db')).pool.connect();
    try {
      await client.query('BEGIN');
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
        [email, passwordHash, role]
      );
      const user = userResult.rows[0];
      await client.query(
        `INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)`,
        [user.id, displayName]
      );
      await client.query('COMMIT');
      return { ...user, display_name: displayName };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async findAll() {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, p.display_name, u.created_at
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    return rows;
  },

  async findByRole(role: string) {
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, p.display_name
       FROM users u LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.role = $1 ORDER BY p.display_name`,
      [role]
    );
    return rows;
  },

  async updateRole(id: string, role: string) {
    const { rows } = await query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING *`,
      [role, id]
    );
    return rows[0];
  },
};
