import { query } from "../db.js";

type EditorCodeRecord = {
    id: string;
    interview_id: string;
    code: string;
    language: string;
    created_at: Date | string;
    updated_at: Date | string;
};

export const editorRepository = {
    async findByInterviewId(interviewId: string) {
        const { rows } = await query(
            `SELECT id, interview_id, code, language, created_at, updated_at
        FROM interview_codes
        WHERE interview_id = $1
        LIMIT 1`,
            [interviewId]
        );

        return (rows[0] as EditorCodeRecord | undefined) ?? null;
    },

    async existsByInterviewId(interviewId: string) {
        const { rows } = await query(
            `SELECT EXISTS (
          SELECT 1
          FROM interview_codes
          WHERE interview_id = $1
        ) AS exists`,
            [interviewId]
        );

        return rows[0]?.exists === true;
    },

    async upsert(interviewId: string, code: string, language: string) {
        const { rows } = await query(
            `INSERT INTO interview_codes (interview_id, code, language)
        VALUES ($1, $2, $3)
        ON CONFLICT (interview_id) DO UPDATE
        SET code = EXCLUDED.code,
            language = EXCLUDED.language,
            updated_at = NOW()
        RETURNING *`,
            [interviewId, code, language]
        );

        return rows[0] as EditorCodeRecord;
    },

    async deleteByInterviewId(interviewId: string) {
        const { rows } = await query(
            `DELETE FROM interview_codes
        WHERE interview_id = $1
        RETURNING *`,
            [interviewId]
        );

        return rows[0] ?? null;
    },
};
