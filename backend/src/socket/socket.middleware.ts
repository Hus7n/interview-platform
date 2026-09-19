import type { NextFunction, Request, Response } from "express";
import type { Server, Socket } from "socket.io";
import { authRepository } from "../repositories/auth.repository.js";
import type { UserRecord, UserRole } from "../types/user.js";
import { unauthorized, accountDisabled } from "../utils/error.js";
import { verifyAccessToken } from "../utils/token.js";
import { isAccountDisabled } from "../utils/user.js";

export type AuthenticatedSocket = Socket & {
    data: {
        userId: string;
        role: UserRole;
        authenticated: boolean;
    };
};

export function socketAuthMiddleware(io: Server) {
    return async (socket: Socket, next: (err?: Error) => void) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error(unauthorized("Access token is required").message));
            }

            const payload = verifyAccessToken(token);
            const user = (await authRepository.findById(payload.userId)) as UserRecord | null;

            if (!user) {
                return next(new Error(unauthorized("Invalid access token").message));
            }

            if (isAccountDisabled(user)) {
                return next(new Error(accountDisabled().message));
            }

            socket.data.userId = user.id;
            socket.data.role = user.role;
            socket.data.authenticated = true;

            next();
        } catch (error) {
            next(error as Error);
        }
    };
}
