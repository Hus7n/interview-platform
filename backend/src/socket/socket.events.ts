import type { Server } from "socket.io";
import type { AuthenticatedSocket } from "./socket.middleware";
import { socketService } from "./socket.service";

export function registerSocketHandlers(io: Server) {
    io.on("connection", (socket: AuthenticatedSocket) => {
        const userId = socket.data.userId;
        const userRooms = new Set<string>();
        const inRoom = (interviewId: unknown): interviewId is string =>
            typeof interviewId === "string" && userRooms.has(interviewId);

        socket.on("join-room", async (interviewId: string) => {
            try {
                if (!interviewId) {
                    socket.emit("error", { message: "Interview ID is required" });
                    return;
                }

                const result = await socketService.joinRoom(
                    interviewId,
                    { userId, role: socket.data.role },
                    io
                );

                socket.join(`interview:${interviewId}`);
                userRooms.add(interviewId);

                socket.emit("room-joined", result);
                socket.to(`interview:${interviewId}`).emit("user-joined", {
                    interviewId,
                    userId,
                    onlineCount: result.onlineCount,
                });
            } catch (error) {
                socket.emit("error", { message: (error as Error).message });
            }

            socket.on("chat-message", (payload: { interviewId: string; message: string }) => {
            if (!payload?.interviewId || !payload.message?.trim() || !inRoom(payload.interviewId)) return;
            socket.to(`interview:${payload.interviewId}`).emit("chat-message", {
                interviewId: payload.interviewId,
                userId,
                message: payload.message.trim().slice(0, 2000),
                createdAt: new Date().toISOString(),
            });
        });
        });

        socket.on("leave-room", async (interviewId: string) => {
            try {
                if (!interviewId) {
                    socket.emit("error", { message: "Interview ID is required" });
                    return;
                }

                const result = await socketService.leaveRoom(
                    interviewId,
                    { userId, role: socket.data.role },
                    io
                );

                socket.leave(`interview:${interviewId}`);
                userRooms.delete(interviewId);

                socket.emit("room-left", result);
                socket.to(`interview:${interviewId}`).emit("user-left", {
                    interviewId,
                    userId,
                    onlineCount: result.onlineCount,
                });
            } catch (error) {
                socket.emit("error", { message: (error as Error).message });
            }
        });

        socket.on("typing-start", async (interviewId: string) => {
            try {
                if (!interviewId) {
                    socket.emit("error", { message: "Interview ID is required" });
                    return;
                }
                if (!inRoom(interviewId)) return;

                    const result = await socketService.broadcastTyping(
                    interviewId,
                    userId,
                    true
                );

                socket.to(`interview:${interviewId}`).emit("typing-update", result);
            } catch (error) {
                socket.emit("error", { message: (error as Error).message });
            }
        });

        socket.on("typing-stop", async (interviewId: string) => {
            try {
                if (!interviewId) {
                    socket.emit("error", { message: "Interview ID is required" });
                    return;
                }

                if (!inRoom(interviewId)) return;

                const result = await socketService.broadcastTyping(
                    interviewId,
                    userId,
                    false
                );

                socket.to(`interview:${interviewId}`).emit("typing-update", result);
            } catch (error) {
                socket.emit("error", { message: (error as Error).message });
            }
        });

        socket.on("save-code", async (payload: { interviewId: string; code: string; language: string }) => {
            try {
                    if (!payload?.interviewId) {
                    socket.emit("error", { message: "Interview ID is required" });
                    return;
                }
                if (!inRoom(payload.interviewId)) return;

                const update = socketService.broadcastCodeUpdate(
                    payload.interviewId,
                    payload.code,
                    payload.language,
                    userId
                );

                socket.to(`interview:${payload.interviewId}`).emit("code-update", update);
            } catch (error) {
                socket.emit("error", { message: (error as Error).message });
            }
        });

        // --- WebRTC signaling ---

        socket.on("webrtc-offer", (payload: { interviewId: string; to: string; signal: unknown }) => {
            if (!payload?.interviewId || !payload.to || !inRoom(payload.interviewId)) return;
            io.to(`interview:${payload.interviewId}`).emit("webrtc-offer", {
                from: userId,
                signal: payload.signal,
            });
        });

        socket.on("webrtc-answer", (payload: { interviewId: string; to: string; signal: unknown }) => {
            if (!payload?.interviewId || !payload.to || !inRoom(payload.interviewId)) return;
            io.to(`interview:${payload.interviewId}`).emit("webrtc-answer", {
                from: userId,
                signal: payload.signal,
            });
        });

        socket.on("webrtc-ice-candidate", (payload: { interviewId: string; to: string; candidate: unknown }) => {
            if (!payload?.interviewId || !payload.to || !inRoom(payload.interviewId)) return;
            io.to(`interview:${payload.interviewId}`).emit("webrtc-ice-candidate", {
                from: userId,
                candidate: payload.candidate,
            });
        });

        socket.on("media-toggle", (payload: { interviewId: string; mediaType: "camera" | "microphone"; enabled: boolean }) => {
            if (!payload?.interviewId || !inRoom(payload.interviewId)) return;
            socket.to(`interview:${payload.interviewId}`).emit("media-toggle", {
                userId,
                mediaType: payload.mediaType,
                enabled: payload.enabled,
            });
        });

        // --- Whiteboard ---

        socket.on("draw-start", (payload: { interviewId: string; point: { x: number; y: number }; tool: string; color: string; strokeWidth: number }) => {
            if (!payload?.interviewId || !inRoom(payload.interviewId)) return;
            socket.to(`interview:${payload.interviewId}`).emit("draw-start", {
                userId,
                point: payload.point,
                tool: payload.tool,
                color: payload.color,
                strokeWidth: payload.strokeWidth,
            });
        });

        socket.on("draw-move", (payload: { interviewId: string; point: { x: number; y: number } }) => {
            if (!payload?.interviewId || !inRoom(payload.interviewId)) return;
            socket.to(`interview:${payload.interviewId}`).emit("draw-move", {
                userId,
                point: payload.point,
            });
        });

        socket.on("draw-end", (payload: { interviewId: string }) => {
            if (!payload?.interviewId || !inRoom(payload.interviewId)) return;
            socket.to(`interview:${payload.interviewId}`).emit("draw-end", { userId });
        });

        socket.on("clear-canvas", (payload: { interviewId: string }) => {
            if (!payload?.interviewId || !inRoom(payload.interviewId)) return;
            socket.to(`interview:${payload.interviewId}`).emit("clear-canvas", { userId });
        });

        socket.on("disconnect", async () => {
            for (const interviewId of userRooms) {
                const result = await socketService.leaveRoom(
                    interviewId,
                    { userId, role: socket.data.role },
                    io
                );

                socket.to(`interview:${interviewId}`).emit("user-left", {
                    interviewId,
                    userId,
                    onlineCount: result.onlineCount,
                });
            }

            socketService.clearUserTyping(userId);
        });
    });
}
