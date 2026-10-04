import {Pool} from "pg";
import type {QueryResultRow , QueryResult} from "pg"
import { env } from "./config/env.js";

export const pool = new Pool({
    connectionString : env.databaseUrl,
    ssl : env.databaseUrl.includes('neon.tech') 
    ? {rejectUnauthorized : false} : undefined,
});

export async function query<T extends QueryResultRow>(
    text : string,
    params : unknown[] = []
) : Promise<QueryResult<T>>{
    return pool.query(text , params);
}

export async function testConnection() : Promise<void>{
    try{
        await query("SELECT 1");
        console.log("DB connected successfully");
    }catch(error){
        const code = (error as { code?: string }).code;
        const reason = code === "ECONNREFUSED"
            ? "Nothing is listening on that host/port."
            : code === "28P01"
              ? "The database rejected these credentials."
              : code === "3D000"
                ? "That database does not exist."
                : code
                  ? `Postgres error ${code}.`
                  : "Unknown connection error.";

        console.error(
            [
                "",
                "  DB connection failed",
                "",
                `  DATABASE_URL host:port is not reachable. ${reason}`,
                "",
                "  Fix one of these:",
                "    - start your Postgres instance, then `npm run migrate`",
                "    - correct DATABASE_URL in backend/.env",
                "",
            ].join("\n"),
        );
        process.exit(1);
    }
}