import { io, Socket } from "socket.io-client";
import { getToken } from "./api";
let socket: Socket | null = null;
export function connectSocket() {
  if (!socket)
    socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:4000",
      { autoConnect: false },
    );
  socket.auth = { token: getToken() };
  if (!socket.connected) socket.connect();
  return socket;
}
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
