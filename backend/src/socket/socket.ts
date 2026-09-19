import { Server } from "socket.io";
import { socketAuthMiddleware } from "./socket.middleware.js";
import { registerSocketHandlers } from "./socket.events.js";
import type { Server as HttpServer } from "http";
import { env } from "../config/env.js";

export function setupSocket(server: HttpServer) {
    const io = new Server(server, {
        cors: {
            origin: env.frontendUrl,
            credentials: true,
        },
    });

    io.use(socketAuthMiddleware(io));

    registerSocketHandlers(io);

    return io;
}
