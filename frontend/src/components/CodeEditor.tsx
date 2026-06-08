'use client';

import Editor from '@monaco-editor/react';
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';

interface Props {
  socket: Socket | null;
  roomId: string;
  userId: string;
  initialCode: string;
  language: string;
  onLanguageChange: (lang: string) => void;
}

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go'];

export default function CodeEditor({
  socket,
  roomId,
  userId,
  initialCode,
  language,
  onLanguageChange,
}: Props) {
  const [code, setCode] = useState(initialCode);
  const isRemoteChange = useRef(false);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    socket?.emit('editor:change', { roomId, code: newCode, language });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-gray-700 bg-surface px-3 py-2">
        <span className="text-sm text-gray-400">Language:</span>
        <select
          value={language}
          onChange={(e) => {
            onLanguageChange(e.target.value);
            socket?.emit('editor:change', { roomId, code, language: e.target.value });
          }}
          className="rounded bg-gray-800 px-2 py-1 text-sm"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
