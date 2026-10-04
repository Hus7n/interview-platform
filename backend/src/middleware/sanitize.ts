import type { NextFunction, Request, Response } from "express";
import xss from "xss";

/**
 * Passwords are secrets, not markup. Running them through `xss` rewrites
 * characters like `&`, `<`, `"` into entities, so the value that gets hashed is
 * not the value the user typed - and because escaping is not idempotent the
 * same input can hash differently on a later request. Never rewrite these.
 */
const PASSTHROUGH_KEYS = new Set(["password", "newPassword", "currentPassword", "refreshToken"]);

function sanitizeValue(value: unknown): unknown {
    if (typeof value === "string") {
        return xss(value, { stripIgnoreTag: true, stripIgnoreTagBody: ["script"] });
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === "object") {
        const cleaned: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            cleaned[key] = PASSTHROUGH_KEYS.has(key) ? val : sanitizeValue(val);
        }
        return cleaned;
    }
    return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === "object") {
        for (const key of Object.keys(req.query)) {
            (req.query as Record<string, unknown>)[key] = sanitizeValue(req.query[key]);
        }
    }
    if (req.params && typeof req.params === "object") {
        for (const key of Object.keys(req.params)) {
            (req.params as Record<string, unknown>)[key] = sanitizeValue(req.params[key]);
        }
    }
    next();
}
