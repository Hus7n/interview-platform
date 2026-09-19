import {z} from "zod";
export const envSchema = z.object({
NODE_ENV :z.enum(["development" , "test" , "production"]).default("development"),
PORT : z.coerce.number().int().positive().default(4000),
DATABASE_URL :z.string().min(1,"DATABASE_URL is required"),
JWT_SECRET :z.string().min(32 ,"JWT_SECRET must be at least 32 characters"),
FRONTEND_URL : z.string().url().default("http://localhost:3000"),
PASSSWORD_SALT_ROUNDS : z.coerce.number().int().min(10).max(15).default(12),
SMTP_HOST : z.string().optional(),
SMTP_PORT : z.coerce.number().int().optional(),
SMTP_USER : z.string().optional(),
SMTP_PASS : z.string().optional(),
SMTP_FROM : z.string().email().optional(),
PISTON_URL : z.string().url().default("https://emkc.org"),
});
