import express, { type NextFunction, type Request, type Response } from "express";
import { env } from "./config/env.js";
import cors from "cors";
import helmet from "helmet";
// @ts-expect-error morgan does not provide TypeScript declarations.
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes.js";
import { interviewRouter } from "./routes/interview.routes.js";
import { editorRouter } from "./routes/editor.routes.js";
import { notesRouter } from "./routes/notes.routes.js";
import { feedbackRouter } from "./routes/feedback.routes.js";
import { notificationsRouter } from "./routes/notification.routes.js";
import { uploadRouter } from "./upload/upload.routes.js";
import { executionRouter } from "./routes/execution.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { sanitizeInput } from "./middleware/sanitize.js";
import { authRateLimit, strictRateLimit, generalRateLimit } from "./middleware/rate-limit.js";
import { errorResponse } from "./utils/errors.js";

const app = express();
app.use(helmet());
app.use(morgan("dev"));

/**
 * Accept every local dev spelling of the frontend origin. Browsers treat
 * `localhost` and `127.0.0.1` as distinct origins, so a single-string list
 * silently blocks one of them and the request fails in the console while
 * looking healthy from curl. Production stays locked to FRONTEND_URL.
 */
const devOrigins = [3000, 3111]
    .flatMap((port) => [
        `http://localhost:${port}`,
        `http://127.0.0.1:${port}`,
    ]);

const allowedOrigins =
    env.nodeEnv === "production"
        ? [env.frontendUrl]
        : [env.frontendUrl, ...devOrigins];

app.use(
    cors({
        origin(origin, callback) {
            // Same-origin/non-browser callers send no Origin header.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`Origin ${origin} is not allowed by CORS`));
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeInput);

app.get("/health", (_req, res) => res.json({ status: "ok", message: "Server is running" }));

app.use("/api/auth", authRateLimit, authRouter);
app.use("/api/interviews", generalRateLimit, interviewRouter);
app.use("/api/editor", generalRateLimit, editorRouter);
app.use("/api/interviews/:interviewId/notes", generalRateLimit, notesRouter);
app.use("/api/interviews/:interviewId/feedback", generalRateLimit, feedbackRouter);
app.use("/api/notifications", generalRateLimit, notificationsRouter);
app.use("/api/uploads", generalRateLimit, uploadRouter);
app.use("/api/execute", strictRateLimit, executionRouter);
app.use("/api/analytics", generalRateLimit, analyticsRouter);
app.use("/api/admin", generalRateLimit, adminRouter);
app.use("/api/search", generalRateLimit, searchRouter);
app.use("/api/audit", generalRateLimit, auditRouter);

app.use("/uploads", express.static("uploads"));

app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const { statusCode, body } = errorResponse(err);
    res.status(statusCode).json(body);
});

export default app;
