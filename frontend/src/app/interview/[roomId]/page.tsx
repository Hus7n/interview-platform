'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoPanel from '@/components/VideoPanel';
import CodeEditor from '@/components/CodeEditor';
import ChatPanel from '@/components/ChatPanel';
import NotesPanel from '@/components/NotesPanel';
import ParticipantList from '@/components/ParticipantList';

interface Interview {
  id: string;
  title: string;
  room_id: string;
  language: string;
  starter_code: string;
  participants: Array<{ user_id: string; display_name: string; role: string }>;
}

export default function InterviewRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading } = useAuth(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [participants, setParticipants] = useState<Array<{ userId: string; displayName: string; role: string }>>([]);
  const [code, setCode] = useState('// Write your solution here\n');
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');

  const webrtc = useWebRTC(socket, roomId, user?.id || '');

  useEffect(() => {
    if (!user || !roomId) return;

    api<Interview>(`/api/interviews/room/${roomId}`)
      .then((data) => {
        setInterview(data);
        setCode(data.starter_code || '// Write your solution here\n');
        setLanguage(data.language || 'javascript');
      })
      .catch(() => {});

    const s = connectSocket();
    setSocket(s);

    s.emit('room:join', { roomId });

    s.on('room:joined', (data: { participants: typeof participants; code?: string; language?: string }) => {
      setParticipants(data.participants);
      if (data.code) setCode(data.code);
      if (data.language) setLanguage(data.language);
    });

    s.on('room:user-joined', (p: { userId: string; displayName: string; role: string }) => {
      setParticipants((prev) => [...prev.filter((x) => x.userId !== p.userId), p]);
    });

    s.on('room:user-left', ({ userId }: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    });

    s.on('editor:change', ({ code: c, language: l }: { code: string; language: string }) => {
      setCode(c);
      if (l) setLanguage(l);
    });

    return () => {
      s.emit('room:leave', { roomId });
      disconnectSocket();
    };
  }, [user, roomId]);

  if (loading || !user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <h1 className="font-semibold">{interview?.title || 'Interview Room'}</h1>
        <span className="text-sm text-gray-400">Room: {roomId}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Video */}
        <div className="w-80 border-r border-gray-800">
          <VideoPanel
            localVideoRef={webrtc.localVideoRef}
            remoteVideoRef={webrtc.remoteVideoRef}
            isVideoOn={webrtc.isVideoOn}
            isAudioOn={webrtc.isAudioOn}
            isScreenSharing={webrtc.isScreenSharing}
            remoteConnected={webrtc.remoteConnected}
            onToggleVideo={webrtc.toggleVideo}
            onToggleAudio={webrtc.toggleAudio}
            onToggleScreen={webrtc.toggleScreenShare}
          />
          <ParticipantList participants={participants} />
        </div>

        {/* Center: Code Editor */}
        <div className="flex-1">
          <CodeEditor
            socket={socket}
            roomId={roomId}
            userId={user.id}
            initialCode={code}
            language={language}
            onLanguageChange={setLanguage}
          />
        </div>

        {/* Right: Notes / Chat */}
        <div className="flex w-72 flex-col border-l border-gray-800">
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 text-sm ${activeTab === 'notes' ? 'border-b-2 border-primary' : ''}`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm ${activeTab === 'chat' ? 'border-b-2 border-primary' : ''}`}
            >
              Chat
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'notes' && interview && <NotesPanel interviewId={interview.id} />}
            {activeTab === 'chat' && <ChatPanel socket={socket} roomId={roomId} userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
