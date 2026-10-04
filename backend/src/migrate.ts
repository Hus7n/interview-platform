import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pool } from "./db.js";

/**
 * Resolve the migrations folder regardless of the directory the script is run
 * from. `__dirname/..` resolves to the backend root for both `src/migrate.ts`
 * (tsx) and `dist/migrate.js` (compiled).
 */
function resolveMigrationDir(): string {
    const candidates = [
        resolve(__dirname, "..", "migrations"),
        join(process.cwd(), "migrations"),
    ];

    for (const dir of candidates) {
        if (existsSync(dir)) return dir;
    }

    console.error(
        [
            "",
            "  Could not find the migrations directory.",
            `  Looked in: ${candidates.join(", ")}`,
            "",
        ].join("\n"),
    );
    process.exit(1);
}

const migrationDir = resolveMigrationDir();

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

        if (!files.length) {
            console.warn(`No .sql files found in ${migrationDir}`);
        }

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
