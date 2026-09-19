import type { Server } from "socket.io";
import { interviewRepository } from "../repositories/interview.repository.js";
import type { RoomParticipant, RoomJoinedPayload, RoomLeftPayload, TypingUpdatePayload, CodeUpdatePayload } from "./socket.types";

function notFound(message: string): Error {
    const error = new Error(message);
    Object.assign(error, { statusCode: 404 });
    return error;
}

function forbidden(message: string): Error {
    const error = new Error(message);
    Object.assign(error, { statusCode: 403 });
    return error;
}

type AuthUser = {
    userId: string;
    role: string;
};

const typingUsers = new Map<string, Set<string>>();

function getRoomKey(interviewId: string) {
    return `interview:${interviewId}`;
}

export const socketService = {
    async joinRoom(
        interviewId: string,
        authUser: AuthUser,
        io: Server
    ): Promise<RoomJoinedPayload> {
        const interview = await interviewRepository.findById(interviewId);
        if (!interview) {
            throw notFound("Interview not found");
        }

        const participants = await interviewRepository.findParticipants(interviewId);
        const isParticipant = participants.some(
            (participant) => participant.user_id === authUser.userId
        );

        if (!isParticipant) {
            throw forbidden("You are not a participant of this interview");
        }

        return {
            interviewId,
            participants: participants.map((participant) => ({
                userId: participant.user_id,
                role: participant.role,
            })) as RoomParticipant[],
            onlineCount: getOnlineCount(interviewId, io),
        };
    },

    async leaveRoom(
        interviewId: string,
        authUser: AuthUser,
        io: Server
    ): Promise<RoomLeftPayload> {
        return {
            interviewId,
            userId: authUser.userId,
            onlineCount: getOnlineCount(interviewId, io),
        };
    },

    async broadcastTyping(interviewId: string, userId: string, isTyping: boolean) {
        const typingKey = getRoomKey(interviewId);

        if (!typingUsers.has(typingKey)) {
            typingUsers.set(typingKey, new Set());
        }

        const typingSet = typingUsers.get(typingKey)!;
        if (isTyping) {
            typingSet.add(userId);
        } else {
            typingSet.delete(userId);
        }

        return {
            interviewId,
            userId,
            isTyping,
            typingUsers: Array.from(typingSet),
        } as TypingUpdatePayload;
    },

    clearUserTyping(userId: string) {
        for (const typingSet of typingUsers.values()) {
            typingSet.delete(userId);
        }

        for (const [roomKey, typingSet] of typingUsers.entries()) {
            if (typingSet.size === 0) {
                typingUsers.delete(roomKey);
            }
        }
    },

    broadcastCodeUpdate(interviewId: string, code: string, language: string, userId: string): CodeUpdatePayload {
        return {
            interviewId,
            code,
            language,
            userId,
        };
    },
};

function getOnlineCount(interviewId: string, io: Server): number {
    const room = io.sockets.adapter.rooms.get(getRoomKey(interviewId));
    if (!room) return 0;

    const uniqueUsers = new Set<string>();
    for (const socketId of room) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket?.data?.userId) {
            uniqueUsers.add(socket.data.userId);
        }
    }
    return uniqueUsers.size;
}
