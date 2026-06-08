'use client';

import { RefObject } from 'react';

interface Props {
  localVideoRef: RefObject<HTMLVideoElement>;
  remoteVideoRef: RefObject<HTMLVideoElement>;
  isVideoOn: boolean;
  isAudioOn: boolean;
  isScreenSharing: boolean;
  remoteConnected: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreen: () => void;
}

export default function VideoPanel({
  localVideoRef,
  remoteVideoRef,
  isVideoOn,
  isAudioOn,
  isScreenSharing,
  remoteConnected,
  onToggleVideo,
  onToggleAudio,
  onToggleScreen,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <div className="relative flex-1 overflow-hidden rounded-lg bg-black">
        <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
        {!remoteConnected && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Waiting for participant...
          </div>
        )}
      </div>
      <div className="relative h-32 overflow-hidden rounded-lg bg-black">
        <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
      </div>
      <div className="flex justify-center gap-2">
        <button
          onClick={onToggleVideo}
          className={`rounded px-3 py-2 text-sm ${isVideoOn ? 'bg-gray-700' : 'bg-red-600'}`}
        >
          {isVideoOn ? 'Camera On' : 'Camera Off'}
        </button>
        <button
          onClick={onToggleAudio}
          className={`rounded px-3 py-2 text-sm ${isAudioOn ? 'bg-gray-700' : 'bg-red-600'}`}
        >
          {isAudioOn ? 'Mic On' : 'Mic Off'}
        </button>
        <button
          onClick={onToggleScreen}
          className={`rounded px-3 py-2 text-sm ${isScreenSharing ? 'bg-primary' : 'bg-gray-700'}`}
        >
          {isScreenSharing ? 'Stop Share' : 'Share Screen'}
        </button>
      </div>
    </div>
  );
}
