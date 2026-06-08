'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
  userId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

interface Props {
  socket: Socket | null;
  roomId: string;
  userId: string;
}

export default function ChatPanel({ socket, roomId, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: Message) => setMessages((prev) => [...prev, msg]);
    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [socket]);

  const send = () => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', { roomId, message: input.trim() });
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.userId === userId ? 'text-right' : ''}`}>
            <span className="text-xs text-gray-500">{m.displayName}</span>
            <p className="rounded bg-gray-800 px-2 py-1 inline-block">{m.message}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t border-gray-700 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 rounded bg-gray-800 px-3 py-2 text-sm"
        />
        <button onClick={send} className="rounded bg-primary px-3 py-2 text-sm">Send</button>
      </div>
    </div>
  );
}
