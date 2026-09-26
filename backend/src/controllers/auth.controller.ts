import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { parseRequest } from "../utils/validate.js";
import {
    forgotPasswordSchema,
    loginSchema,
    registerSchema,
    resetPasswordSchema,
    verifyEmailSchema
} from "../validators/auth.schema.js";

function badRequest(message: string, code?: string) {
    const error = new Error(message) as Error & { statusCode?: number; code?: string };
    error.statusCode = 400;
    error.code = code;
    return error;
}

type RequestWithCookies = Request & {
    cookies?: Record<string, unknown>;
};

function getBearerToken(req: Request) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return null;
    }
    return header.slice("Bearer".length).trim();
}

function getRefreshToken(req: Request) {
    const bodyToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : null;
    const cookies = (req as RequestWithCookies).cookies;
    const cookieToken = typeof cookies?.refreshToken === "string" ? cookies.refreshToken : null;
    return bodyToken ?? cookieToken;
}

export const authController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(registerSchema, req.body);
            const result = await authService.register(input);

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(loginSchema, req.body);
            const result = await authService.login(input);

            res.status(200).json({
                success: true,
                message: "Logged in successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const refreshToken = getRefreshToken(req);
            if (!refreshToken) {
                throw badRequest("Refresh token is required", "INVALID_TOKEN");
            }
            const result = await authService.refresh(refreshToken);
            res.status(200).json({
                success: true,
                message: "Token refreshed successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            await authService.logout(getRefreshToken(req) ?? "");
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async logOutAll(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user?.userId) {
                throw badRequest("Authenticated user is required");
            }
            await authService.logoutAll(req.user.userId);
            res.status(200).json({
                success: true,
                message: "Logged out from all devices successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async me(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user?.userId) {
                throw badRequest("Authenticated user is required");
            }
            const user = await authService.getMe(req.user.userId);
            res.status(200).json({
                success: true,
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    },

    async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(verifyEmailSchema, {
                token: typeof req.query?.token === "string" ? req.query.token : req.body?.token,
            });
            const user = await authService.verifyEmail(input.token);
            res.status(200).json({
                success: true,
                message: "Email verified successfully",
                data: { user },
            });
        } catch (error) {
            next(error);
        }
    },

    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(forgotPasswordSchema, req.body);
            const result = await authService.forgotPassword(input.email);

            res.status(200).json({
                success: true,
                message: "If that email exists, a reset link has been created",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    },

    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const input = parseRequest(resetPasswordSchema, req.body);
            await authService.resetPassword(input);

            res.status(200).json({
                success: true,
                message: "Password reset successfully",
            });
        } catch (error) {
            next(error);
        }
    },

    async tokenInfo(req: Request, res: Response, next: NextFunction) {
        try {
            const token = getBearerToken(req);
            res.status(200).json({
                success: true,
                data: {
                    authenticated: Boolean(token && req.user),
                    user: req.user ?? null,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};
