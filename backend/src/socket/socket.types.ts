import type { Socket } from "socket.io";
import type { UserRole } from "../types/user";

export type SocketData = {
    userId: string;
    role: UserRole;
    authenticated: boolean;
};

export type AuthenticatedSocket = Socket & {
    data: SocketData;
};

export type RoomParticipant = {
    userId: string;
    role: "interviewer" | "candidate";
    displayName?: string | null;
    email?: string;
};

export type RoomJoinedPayload = {
    interviewId: string;
    participants: RoomParticipant[];
    onlineCount: number;
};

export type RoomLeftPayload = {
    interviewId: string;
    userId: string;
    onlineCount: number;
};

export type UserJoinedPayload = {
    interviewId: string;
    userId: string;
    onlineCount: number;
};

export type UserLeftPayload = {
    interviewId: string;
    userId: string;
    onlineCount: number;
};

export type TypingUpdatePayload = {
    interviewId: string;
    userId: string;
    isTyping: boolean;
    typingUsers: string[];
};

export type CodeUpdatePayload = {
    interviewId: string;
    code: string;
    language: string;
    userId: string;
};

export type WebRTCSignalPayload = {
    interviewId: string;
    to: string;
    from: string;
    signal: unknown;
};

export type MediaTogglePayload = {
    interviewId: string;
    userId: string;
    enabled: boolean;
};

export type DrawEvent = {
    interviewId: string;
    userId: string;
    tool: string;
    color: string;
    points: { x: number; y: number }[];
    strokeWidth: number;
};
