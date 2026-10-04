import { query } from "../db.js";
import type {
    CreateInterviewInput,
    InterviewStatus,
    ListInterviewInput,
    ParticipantRole,
    UpdateInterviewInput,
} from "../validators/interview.schema.js";

type CreateInterviewData = Omit<CreateInterviewInput, "participants"> & {
    room_id: string;
    created_by: string;
    status: InterviewStatus;
};

type InterviewFilters = ListInterviewInput & {
    offset: number;
    participant_id? : string;
};

function buildWhereClause(filters: ListInterviewInput & {participant_id ?: string}) {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (filters.status) {
        values.push(filters.status);
        conditions.push(`i.status = $${values.length}`);
    }

    if (filters.language) {
        values.push(filters.language);
        conditions.push(`i.language = $${values.length}`);
    }

    if (filters.created_by) {
        values.push(filters.created_by);
        conditions.push(`i.created_by = $${values.length}`);
    }

    if (filters.room_id) {
        values.push(filters.room_id);
        conditions.push(`i.room_id = $${values.length}`);
    }

    if(filters.participant_id){
        values.push(filters.participant_id);
        conditions.push(
            `EXISTS (SELECT 1 FROM interview_participants ip2 WHERE ip2.interview_id = i.id AND ip2.user_id = $${values.length})`
        );
    }

    if (filters.from_date) {
        values.push(filters.from_date);
        conditions.push(`i.scheduled_at >= $${values.length}`);
    }

    if (filters.to_date) {
        values.push(filters.to_date);
        conditions.push(`i.scheduled_at <= $${values.length}`);
    }

    if (filters.search) {
        values.push(`%${filters.search}%`);
        conditions.push(`(i.title ILIKE $${values.length} OR i.description ILIKE $${values.length})`);
    }

    return {
        values,
        whereSql: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    };
}

export const interviewRepository = {
    async create(data: CreateInterviewData) {
        const { rows } = await query(
            `INSERT INTO interviews
          (
            title,
            description,
            scheduled_at,
            duration_minutes,
            status,
            room_id,
            language,
            starter_code,
            created_by
          )
       VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
            [
                data.title,
                data.description ?? null,
                data.scheduled_at,
                data.duration_minutes,
                data.status,
                data.room_id,
                data.language,
                data.starter_code ?? null,
                data.created_by,
            ]
        );

        return rows[0];
    },

    async findById(id: string) {
        const { rows } = await query(
            `SELECT
          i.*,
          COUNT(ip.id)::int AS participant_count
       FROM interviews i
       LEFT JOIN interview_participants ip
         ON ip.interview_id = i.id
       WHERE i.id = $1
       GROUP BY i.id
       LIMIT 1`,
            [id]
        );

        return rows[0] ?? null;
    },

    async findMany(filters: InterviewFilters) {
        const { whereSql, values } = buildWhereClause(filters);
        values.push(filters.limit);
        values.push(filters.offset);

        const { rows } = await query(
            `SELECT
          i.*,
          COUNT(ip.id)::int AS participant_count
       FROM interviews i
       LEFT JOIN interview_participants ip
         ON ip.interview_id = i.id
       ${whereSql}
       GROUP BY i.id
       ORDER BY i.scheduled_at DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
            values
        );

        return rows;
    },

    async findByCreator(createdBy: string) {
        const { rows } = await query(
            `SELECT *
       FROM interviews
       WHERE created_by = $1
       ORDER BY scheduled_at DESC`,
            [createdBy]
        );

        return rows;
    },

    async findByRoomId(roomId: string) {
        const { rows } = await query(
            `SELECT *
       FROM interviews
       WHERE room_id = $1
       LIMIT 1`,
            [roomId]
        );

        return rows[0] ?? null;
    },

    async exists(id: string) {
        const { rows } = await query(
            `SELECT EXISTS (
         SELECT 1
         FROM interviews
         WHERE id = $1
       ) AS exists`,
            [id]
        );

        return rows[0]?.exists === true;
    },

    async existsByRoom(roomId: string) {
        const { rows } = await query(
            `SELECT EXISTS (
         SELECT 1
         FROM interviews
         WHERE room_id = $1
       ) AS exists`,
            [roomId]
        );

        return rows[0]?.exists === true;
    },

    async count(filters: ListInterviewInput & {participant_id ?: string}) {
        const { whereSql, values } = buildWhereClause(filters);

        const { rows } = await query(
            `SELECT COUNT(*)::int AS total
       FROM interviews i
       ${whereSql}`,
            values
        );

        return rows[0]?.total ?? 0;
    },

    async update(id: string, data: UpdateInterviewInput) {
        const values: unknown[] = [];
        const updates: string[] = [];

        for (const [key, value] of Object.entries(data)) {
            values.push(value);
            updates.push(`${key} = $${values.length}`);
        }

        values.push(id);

        const { rows } = await query(
            `UPDATE interviews
       SET ${updates.join(", ")},
           updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING *`,
            values
        );

        return rows[0] ?? null;
    },

    async delete(id: string) {
        const { rows } = await query(
            `DELETE FROM interviews
       WHERE id = $1
       RETURNING *`,
            [id]
        );

        return rows[0] ?? null;
    },

    async updateStatus(id: string, status: InterviewStatus) {
        const { rows } = await query(
            `UPDATE interviews
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
            [status, id]
        );

        return rows[0] ?? null;
    },

    async addParticipant(interviewId: string, userId: string, role: ParticipantRole) {
        const { rows } = await query(
            `INSERT INTO interview_participants
          (interview_id, user_id, role)
       VALUES
          ($1, $2, $3)
       RETURNING *`,
            [interviewId, userId, role]
        );

        return rows[0];
    },

    async removeParticipant(interviewId: string, userId: string) {
        const { rows } = await query(
            `DELETE FROM interview_participants
       WHERE interview_id = $1
         AND user_id = $2
       RETURNING *`,
            [interviewId, userId]
        );

        return rows[0] ?? null;
    },

        async findParticipants(interviewId: string) {
        const { rows } = await query(
            `SELECT ip.*, u.email, p.display_name
       FROM interview_participants ip
       JOIN users u ON u.id = ip.user_id
       LEFT JOIN profiles p ON p.user_id = ip.user_id
       WHERE ip.interview_id = $1
       ORDER BY ip.role ASC, ip.id ASC`,
            [interviewId]
        );

        return rows;
    },

    async countParticipants(interviewId: string) {
        const { rows } = await query(
            `SELECT COUNT(*)::int AS total
       FROM interview_participants
       WHERE interview_id = $1`,
            [interviewId]
        );

        return rows[0]?.total ?? 0;
    },
};
