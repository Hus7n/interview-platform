import { pool } from "./db.js";
import { env } from "./config/env.js";
import { authRepository } from "./repositories/auth.repository.js";
import { hashPassword } from "./utils/password.js";

/**
 * Creates the first admin account. The public register endpoint deliberately
 * refuses the admin role, so without this the admin console is unreachable.
 * Safe to run repeatedly: an existing ADMIN_EMAIL is left untouched.
 */
async function seedAdmin() {
    const email = env.admin.email;
    const password = env.admin.password;
    const displayName = env.admin.name ?? "Administrator";

    if (!email || !password) {
        console.error(
            [
                "",
                "  Cannot seed admin: missing credentials.",
                "",
                "  Add these to backend/.env, then run `npm run seed`:",
                "    ADMIN_EMAIL=you@company.com",
                "    ADMIN_PASSWORD=<at least 8 characters>",
                "    ADMIN_NAME=Administrator   # optional",
                "",
            ].join("\n"),
        );
        process.exit(1);
    }

    const existing = await authRepository.findByEmail(email);

    if (existing) {
        if (existing.role !== "admin") {
            await pool.query(`UPDATE users SET role = 'admin', updated_at = NOW() WHERE id = $1`, [
                existing.id,
            ]);
            console.log(`Promoted existing user ${email} to admin`);
        } else {
            console.log(`Admin ${email} already exists, nothing to do`);
        }
        return;
    }

    const passwordHash = await hashPassword(password);
    const user = await authRepository.create({
        email,
        passwordHash,
        displayName,
        role: "admin",
    });

    // Admins are seeded trusted, so mark them verified and able to sign in.
    await pool.query(
        `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1`,
        [user.id],
    );

    console.log(`Created admin ${email} (id ${user.id})`);
    console.log("Sign in with this account to reach /admin");
}

seedAdmin()
    .catch((error) => {
        console.error("Seed failed:", error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());