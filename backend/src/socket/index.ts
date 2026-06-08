import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/token';
import { interviewRepository } from '../repositories/interview.repository';
import { env } from '../config/env';

interface SocketUser {
  userId: string;
  displayName: string;
  role: string;
}

interface RoomState {
  code: string;
  language: string;
}

const roomStates = new Map<string, RoomState>();
const roomUsers = new Map<string, Map<string, SocketUser>>();

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = verifyToken(token);
      (socket as Socket & { user: SocketUser }).user = {
        userId: payload.userId,
        displayName: payload.email.split('@')[0],
        role: payload.role,
      };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as Socket & { user: SocketUser }).user;
    const { userId } = user;

    socket.on('room:join', async ({ roomId }: { roomId: string }) => {
      const allowed = await interviewRepository.isParticipantByRoom(roomId, userId);
      if (!allowed) {
        socket.emit('error', { message: 'Not a participant' });
        return;
      }

      socket.join(roomId);

      if (!roomUsers.has(roomId)) roomUsers.set(roomId, new Map());
      roomUsers.get(roomId)!.set(userId, user);

      const interview = await interviewRepository.findByRoomId(roomId);
      if (interview && !roomStates.has(roomId)) {
        roomStates.set(roomId, {
          code: interview.starter_code || '// Write your solution here\n',
          language: interview.language,
        });
      }

      const state = roomStates.get(roomId);
      socket.emit('room:joined', {
        participants: Array.from(roomUsers.get(roomId)!.values()),
        code: state?.code,
        language: state?.language,
      });

      socket.to(roomId).emit('room:user-joined', user);

      if (interview?.status === 'scheduled') {
        await interviewRepository.update(interview.id, { status: 'in_progress' });
      }
    });

    socket.on('room:leave', ({ roomId }: { roomId: string }) => {
      socket.leave(roomId);
      roomUsers.get(roomId)?.delete(userId);
      socket.to(roomId).emit('room:user-left', { userId });
    });

    // WebRTC signaling
    socket.on('signal:offer', ({ roomId, targetUserId, sdp }) => {
      socket.to(roomId).emit('signal:offer', { fromUserId: userId, targetUserId, sdp });
    });

    socket.on('signal:answer', ({ roomId, targetUserId, sdp }) => {
      socket.to(roomId).emit('signal:answer', { fromUserId: userId, targetUserId, sdp });
    });

    socket.on('signal:ice-candidate', ({ roomId, targetUserId, candidate }) => {
      socket.to(roomId).emit('signal:ice-candidate', { fromUserId: userId, targetUserId, candidate });
    });

    // Collaborative editor
    socket.on('editor:change', ({ roomId, code, language }: { roomId: string; code: string; language?: string }) => {
      const state = roomStates.get(roomId) || { code: '', language: 'javascript' };
      state.code = code;
      if (language) state.language = language;
      roomStates.set(roomId, state);
      socket.to(roomId).emit('editor:change', { code, language: state.language, userId });
    });

    socket.on('editor:cursor', ({ roomId, position, selection }) => {
      socket.to(roomId).emit('editor:cursor', { userId, position, selection });
    });

    // Chat
    socket.on('chat:message', ({ roomId, message }: { roomId: string; message: string }) => {
      io.to(roomId).emit('chat:message', {
        userId,
        displayName: user.displayName,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', () => {
      for (const [roomId, users] of roomUsers.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          socket.to(roomId).emit('room:user-left', { userId });
        }
      }
    });
  });

  return io;
}
