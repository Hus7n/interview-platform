import { createHash } from "crypto";
import {pool , query} from "../db.js";
import type {UserRole} from "../types/user.js";


interface CreateUserData  {
    email : string;
    passwordHash : string;
    displayName : string;
    role ?: UserRole;
}

export const authRepository = {
    async findByEmail(email : string){
        const {rows} = await query(
            `SELECT u.*, p.display_name,p.avatar_url FROM users u
            LEFT JOIN profiles p ON p.user_id = u.id
            WHERE u.email = $1 LIMIT 1`,[email]
        );
        return rows[0] ?? null;
    },

    async findById(id:string){
        const {rows} = await query(
            `SELECT u.*,p.display_name,p.avatar_url
            FROM users u LEFT JOIN profiles p ON p.user_id = u.id
            WHERE u.id = $1 LIMIT 1`,[id]
        );
        return rows[0] ?? null;
    },

    async create({
        email , passwordHash , displayName ,
        role = 'candidate'
    } : CreateUserData){
        const client = await pool.connect();
        
        try{
            await client.query("BEGIN");
            const {rows} = await client.query(
                `INSERT INTO users (email, password_hash, role)
                VALUES ($1, $2, $3) RETURNING *`,[email , passwordHash , role]
            );
            const user = rows[0];

            const profileResult = await client.query(
                `INSERT INTO profiles (user_id, display_name)
                VALUES ($1, $2) RETURNING display_name, avatar_url`,
                [user.id , displayName]
            );

            await client.query("COMMIT");
            return{
                ...user,
                display_name : profileResult.rows[0].display_name,
                avatar_url : profileResult.rows[0].avatar_url
            };
        }catch(error){
            try{
                await client.query("ROLLBACK")
            }catch{}
            throw error;
        }finally{
            client.release();
        }

    },

    async updateLastLogin(userId : string){
        await query (
            `UPDATE users SET last_login_at = NOW(),
            updated_at = NOW() WHERE id = $1`,[userId]
        );
    },

    async createSession(userId : string , refreshTokenHash : string , expiresAt : Date){

        const {rows} = await query(
        `INSERT INTO sessions (user_id, refresh_token, expires_at)
        VALUES ($1, $2, $3) RETURNING *`,[userId , refreshTokenHash , expiresAt]
        );
        return rows[0];
    },
    
    async findSession(refreshTokenHash : string){
        const {rows} = await query(
        `SELECT * FROM sessions WHERE refresh_token = $1
         AND expires_at > NOW() LIMIT 1`,[refreshTokenHash]
        );
        return rows[0] ?? null;
    },

    async deleteSession(refreshTokenHash : string){
        await query (
        `DELETE FROM sessions
        WHERE refresh_token = $1`, [refreshTokenHash]
        );
    },

    async deleteAllSessions(userId : string){
        await query(
        `DELETE FROM sessions
        WHERE user_id = $1`, [userId]
        );
    },

    async deleteExpiredSessions(){
        await query(
        `DELETE FROM sessions
        WHERE expires_at <= NOW()`
        );
    },

    async setVerifyToken(userId : string ,tokenHash : string , expiresAt : Date){
        await query(
        `UPDATE users SET verify_token = $1,
        verify_token_expires = $2, updated_at = NOW()
        WHERE id = $3 AND email_verified = FALSE`, [tokenHash, expiresAt, userId]
        );
    },

    async verifyEmailByTokenHash(tokenHash : string){
        const {rows} = await query(
        `UPDATE users SET email_verified = TRUE,
        verify_token = NULL, verify_token_expires = NULL,
        updated_at = NOW() WHERE verify_token = $1
        AND verify_token_expires > NOW() AND email_verified = FALSE
        RETURNING *`,[tokenHash]
        ); 
        return rows[0] ?? null;
    },

    async setResetToken(userId : string , tokenHash: string , expiresAt : Date){
        await query(
        `UPDATE users SET reset_token = $1,
        reset_token_expires = $2, updated_at = NOW()
        WHERE id = $3`,[tokenHash, expiresAt, userId]
        );
    },

    async findByResetTokenHash(tokenHash : string){
        const { rows} = await query(
        `SELECT *FROM users WHERE reset_token = $1
        AND reset_token_expires > NOW() LIMIT 1`,[tokenHash]
        );
        return rows[0] ?? null;
    },

    async resetPassword(userId : string , passwordHash : string){
        const client = await pool.connect();
        try{
            await client.query("BEGIN");
            await client.query(
            `UPDATE users SET password_hash = $1,
            reset_token = NULL, reset_token_expires = NULL,
            updated_at = NOW() WHERE id = $2`,[passwordHash, userId]
            );
            
            await client.query(
            `DELETE FROM sessions WHERE user_id = $1`,
            [userId]
            );

            await client.query("COMMIT");
        }catch(error){
            try{
                await client.query("ROLLBACK");
            }catch{}
            throw error;
        }finally{
            client.release();
        }
    },

    async updateProfilePicture(userId : string , avatarUrl : string | null){
        const {rows} = await query(
        `UPDATE profiles SET avatar_url = $1,
        updated_at = NOW() WHERE user_id = $2
        RETURNING *`, [avatarUrl, userId]
        );

        return rows[0] ?? null;
    }
}
