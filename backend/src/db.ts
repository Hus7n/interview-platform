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
        console.error("DB connection failed")
        console.error(error);
        process.exit(1);
    }
}