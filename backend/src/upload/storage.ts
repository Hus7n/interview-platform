import { createWriteStream } from "node:fs";
import { mkdir, unlink, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = join(process.cwd(), "uploads");

async function ensureDir(dir: string) {
    await mkdir(dir, { recursive: true });
}

export const storage = {
    async save(buffer: Buffer, filename: string, subdir: string): Promise<string> {
        const dir = join(UPLOADS_DIR, subdir);
        await ensureDir(dir);

        const ext = filename.split(".").pop() ?? "bin";
        const stored = `${randomUUID()}.${ext}`;
        const filePath = join(dir, stored);

        await new Promise<void>((resolve, reject) => {
            const ws = createWriteStream(filePath);
            ws.on("finish", resolve);
            ws.on("error", reject);
            ws.end(buffer);
        });

        return `/${subdir}/${stored}`;
    },

    async delete(urlPath: string): Promise<void> {
        const filePath = join(UPLOADS_DIR, urlPath);
        try {
            await access(filePath);
            await unlink(filePath);
        } catch {
            // file doesn't exist, nothing to delete
        }
    },
};
