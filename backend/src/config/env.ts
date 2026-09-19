import dotenv from "dotenv";
import { envSchema } from "../validators/env.schema.js";

dotenv.config();
const parsedEnv = envSchema.parse(process.env);

export const env = {
    nodeEnv : parsedEnv.NODE_ENV,
    port : parsedEnv.PORT,
    databaseUrl : parsedEnv.DATABASE_URL,
    jwtSecret :parsedEnv.JWT_SECRET,
    frontendUrl : parsedEnv.FRONTEND_URL ?? "http://localhost:3000",
    passwordSaltRounds : parsedEnv.PASSSWORD_SALT_ROUNDS,
    smtp : {
        host: parsedEnv.SMTP_HOST,
        port: parsedEnv.SMTP_PORT,
        user: parsedEnv.SMTP_USER,
        pass: parsedEnv.SMTP_PASS,
        from: parsedEnv.SMTP_FROM ?? "noreply@interview.local",
    },
    pistonUrl: parsedEnv.PISTON_URL,
} satisfies {
    nodeEnv : "development" | "test" | "production";
    port : number;
    databaseUrl : string ;
    jwtSecret : string ;
    frontendUrl : string;
    passwordSaltRounds : number;
    smtp : {
        host: string | undefined;
        port: number | undefined;
        user: string | undefined;
        pass: string | undefined;
        from: string;
    };
    pistonUrl: string;
};

export type Env = typeof env;