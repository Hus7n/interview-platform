import { existsSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import { ZodError } from "zod";
import { envSchema } from "../validators/env.schema.js";

const envFile = resolve(process.cwd(), ".env");

if (!existsSync(envFile) && !process.env.DATABASE_URL) {
    console.error(
        [
            "",
            "  Missing environment configuration.",
            "",
            `  No .env file found at: ${envFile}`,
            "",
            "  Fix:",
            "    1. cp .env.example .env",
            "    2. Set DATABASE_URL and JWT_SECRET in .env",
            "    3. Generate a secret with:",
            "       node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
            "",
        ].join("\n"),
    );
    process.exit(1);
}

dotenv.config();

let parsedEnv: ReturnType<typeof envSchema.parse>;

try {
    parsedEnv = envSchema.parse(process.env);
} catch (error) {
    if (error instanceof ZodError) {
        console.error(
            [
                "",
                "  Invalid environment configuration:",
                ...error.issues.map(
                    (issue) => `    - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
                ),
                "",
                `  Fix: edit ${envFile}`,
                "",
            ].join("\n"),
        );
        process.exit(1);
    }
    throw error;
}

export const env = {
    nodeEnv : parsedEnv.NODE_ENV,
    port : parsedEnv.PORT,
    databaseUrl : parsedEnv.DATABASE_URL,
    jwtSecret :parsedEnv.JWT_SECRET,
    frontendUrl : parsedEnv.FRONTEND_URL ?? "http://localhost:3000",
    passwordSaltRounds : parsedEnv.PASSWORD_SALT_ROUNDS,
    smtp : {
        host: parsedEnv.SMTP_HOST,
        port: parsedEnv.SMTP_PORT,
        user: parsedEnv.SMTP_USER,
        pass: parsedEnv.SMTP_PASS,
        from: parsedEnv.SMTP_FROM ?? "noreply@interview.local",
    },
    pistonUrl: parsedEnv.PISTON_URL,
    admin: {
        email: parsedEnv.ADMIN_EMAIL,
        password: parsedEnv.ADMIN_PASSWORD,
        name: parsedEnv.ADMIN_NAME,
    },
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
    admin: {
        email: string | undefined;
        password: string | undefined;
        name: string | undefined;
    };
};

export type Env = typeof env;