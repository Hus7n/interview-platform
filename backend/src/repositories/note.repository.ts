import { query } from "../db.js";

type NoteRecord = {
    id: string;
    interview_id: string;
    author_id: string;
    content: string;
    is_private: boolean;
    created_at: Date | string;
    updated_at: Date | string;
};

export const notesRepository = {
    async create(interviewId: string, authorId: string, content: string, isPrivate: boolean) {
        const { rows } = await query(
            `INSERT INTO notes (interview_id, author_id, content, is_private)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [interviewId, authorId, content, isPrivate]
        );
        return rows[0] as NoteRecord;
    },

    async findById(noteId: string) {
        const { rows } = await query(
            `SELECT * FROM notes WHERE id = $1 LIMIT 1`,
            [noteId]
        );
        return (rows[0] as NoteRecord | undefined) ?? null;
    },

    async findManyByInterviewId(interviewId: string, authorId: string, page: number, limit: number) {
        const offset = (page - 1) * limit;
        const { rows } = await query(
            `SELECT * FROM notes
            WHERE interview_id = $1 AND author_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4`,
            [interviewId, authorId, limit, offset]
        );
        return rows as NoteRecord[];
    },

    async countByInterviewId(interviewId: string, authorId: string) {
        const { rows } = await query(
            `SELECT COUNT(*)::int AS total FROM notes
            WHERE interview_id = $1 AND author_id = $2`,
            [interviewId, authorId]
        );
        return (rows[0] as { total: number } | undefined)?.total ?? 0;
    },

    async update(noteId: string, data: { content?: string | undefined; is_private?: boolean | undefined }) {
        const values: unknown[] = [];
        const updates: string[] = [];

        if (data.content !== undefined) {
            values.push(data.content);
            updates.push(`content = $${values.length}`);
        }
        if (data.is_private !== undefined) {
            values.push(data.is_private);
            updates.push(`is_private = $${values.length}`);
        }

        if (updates.length === 0) return null;

        values.push(noteId);
        const { rows } = await query(
            `UPDATE notes SET ${updates.join(", ")}, updated_at = NOW()
            WHERE id = $${values.length}
            RETURNING *`,
            values
        );
        return (rows[0] as NoteRecord | undefined) ?? null;
    },

    async delete(noteId: string) {
        const { rows } = await query(
            `DELETE FROM notes WHERE id = $1 RETURNING *`,
            [noteId]
        );
        return (rows[0] as NoteRecord | undefined) ?? null;
    },

    async deleteByInterviewId(interviewId: string) {
        await query(
            `DELETE FROM notes WHERE interview_id = $1`,
            [interviewId]
        );
    },
};
