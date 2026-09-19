import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationDir = join(__dirname, "..", "migration");

async function runMigrations() {
    const client = await pool.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        const { rows: applied } = await client.query(
            `SELECT filename FROM _migrations ORDER BY id`
        );
        const appliedSet = new Set(applied.map((r: { filename: string }) => r.filename));

        const files = readdirSync(migrationDir)
            .filter((f) => f.endsWith(".sql"))
            .sort();

        for (const file of files) {
            if (appliedSet.has(file)) {
                console.log(`Skipping already applied migration: ${file}`);
                continue;
            }

            const sql = readFileSync(join(migrationDir, file), "utf-8");

            console.log(`Applying migration: ${file}`);
            await client.query("BEGIN");
            try {
                await client.query(sql);
                await client.query(`INSERT INTO _migrations (filename) VALUES ($1)`, [file]);
                await client.query("COMMIT");
                console.log(`Applied: ${file}`);
            } catch (error) {
                await client.query("ROLLBACK");
                console.error(`Failed to apply ${file}:`, error);
                throw error;
            }
        }

        console.log("All migrations applied successfully");
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
