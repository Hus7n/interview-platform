import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * The limiters are per-IP across the whole router, so a single browser and any
 * curl/automation sharing that IP draw from one budget. Production keeps the
 * strict values; development is loosened because sign-up/verify/reset flows
 * legitimately retry and a 15-minute lockout mid-testing is pure friction.
 */
const isProd = env.nodeEnv === "production";

export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 20 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "RATE_LIMITED", message: "Too many requests, please try again later" },
});

export const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 5 : 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "RATE_LIMITED", message: "Too many requests, please try again later" },
});

export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProd ? 100 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "RATE_LIMITED", message: "Too many requests, please try again later" },
});
