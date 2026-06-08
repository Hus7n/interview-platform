'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export function useWebRTC(socket: Socket | null, roomId: string, userId: string) {
  const localVideoRef = useRef<HTMLVideoElement>(null!);
  const remoteVideoRef = useRef<HTMLVideoElement>(null!);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('signal:ice-candidate', {
          roomId,
          targetUserId: 'all',
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setRemoteConnected(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, roomId]);

  const startLocalMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, []);

  const startCall = useCallback(async () => {
    if (!socket) return;
    const stream = localStreamRef.current || (await startLocalMedia());
    const pc = pcRef.current || createPeerConnection();

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('signal:offer', { roomId, targetUserId: 'all', sdp: offer });
  }, [socket, roomId, createPeerConnection, startLocalMedia]);

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (fromUserId === userId) return;
      const stream = localStreamRef.current || (await startLocalMedia());
      const pc = pcRef.current || createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('signal:answer', { roomId, targetUserId: fromUserId, sdp: answer });
    };

    const handleAnswer = async ({ fromUserId, sdp }: { fromUserId: string; sdp: RTCSessionDescriptionInit }) => {
      if (fromUserId === userId || !pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
    };

    const handleIce = async ({ fromUserId, candidate }: { fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (fromUserId === userId || !pcRef.current) return;
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on('signal:offer', handleOffer);
    socket.on('signal:answer', handleAnswer);
    socket.on('signal:ice-candidate', handleIce);

    startLocalMedia().then(() => startCall());

    return () => {
      socket.off('signal:offer', handleOffer);
      socket.off('signal:answer', handleAnswer);
      socket.off('signal:ice-candidate', handleIce);
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [socket, roomId, userId, createPeerConnection, startLocalMedia, startCall]);

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setIsVideoOn(t.enabled);
    });
  };

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
      setIsAudioOn(t.enabled);
    });
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;
    if (isScreenSharing) {
      const stream = await startLocalMedia();
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      const videoTrack = stream.getVideoTracks()[0];
      if (sender && videoTrack) await sender.replaceTrack(videoTrack);
      setIsScreenSharing(false);
    } else {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(screenTrack);
      screenTrack.onended = () => toggleScreenShare();
      setIsScreenSharing(true);
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    isVideoOn,
    isAudioOn,
    isScreenSharing,
    remoteConnected,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
  };
}
