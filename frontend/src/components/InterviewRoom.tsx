"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { connectSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { countdownParts, formatCountdown, formatDateTime } from "@/lib/time";
import type { Interview, Participant, User } from "@/lib/type";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronDown,
  Code2,
  Eraser,
  FileText,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  PenTool,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  Terminal,
  Trash2,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { Banner } from "./ui";

const langs = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "go",
  "rust",
  "ruby",
  "php",
  "kotlin",
  "csharp",
];

const CANVAS_BG = "#000000";
const ACCENT = "#52a8ff";

type Message = { userId: string; text: string; createdAt?: string };
type TestCase = { input: string; expected: string };
type Point = { x: number; y: number };
type Note = { id: string; content: string; is_private: boolean };

/* ── Collaborative whiteboard ──────────────────────────────────── */
function Whiteboard({
  socket,
  interviewId,
}: {
  socket: ReturnType<typeof connectSocket> | null;
  interviewId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const localPoint = useRef<Point | null>(null);
  const remotePoints = useRef<Record<string, Point>>({});
  const remoteStyles = useRef<
    Record<string, { tool: string; color: string; strokeWidth: number }>
  >({});

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(ACCENT);
  const [width, setWidth] = useState(4);

  /* Match the backing store to the CSS box (and DPR) without losing strokes. */
  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.floor(rect.width * dpr));
    const targetH = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width === targetW && canvas.height === targetH) return;

    const snapshot =
      canvas.width > 1 && canvas.height > 1 ? canvas.toDataURL() : null;

    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (snapshot) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = snapshot;
    }
  }, []);

  const clearSurface = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const draw = useCallback(
    (a: Point, b: Point, t: string = tool, c: string = color, w: number = width) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = t === "eraser" ? CANVAS_BG : c;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    },
    [tool, color, width],
  );

  useEffect(() => {
    syncCanvas();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncCanvas());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [syncCanvas]);

  useEffect(() => {
    const s = socket;
    if (!s) return;

    const onMove = (p: { point: Point; userId?: string }) => {
      if (!p.userId || !p.point) return;
      const prev = remotePoints.current[p.userId];
      const style = remoteStyles.current[p.userId];
      if (prev && style) draw(prev, p.point, style.tool, style.color, style.strokeWidth);
      remotePoints.current[p.userId] = p.point;
    };

    const onEnd = (p: { userId?: string }) => {
      if (!p.userId) return;
      delete remotePoints.current[p.userId];
      delete remoteStyles.current[p.userId];
    };

    const onStart = (p: {
      userId?: string;
      point: Point;
      tool: string;
      color: string;
      strokeWidth: number;
    }) => {
      if (!p.point) return;
      if (p.userId) {
        remotePoints.current[p.userId] = p.point;
        remoteStyles.current[p.userId] = {
          tool: p.tool,
          color: p.color,
          strokeWidth: p.strokeWidth,
        };
      }
      draw(p.point, p.point, p.tool, p.color, p.strokeWidth);
    };

    const onClear = () => clearSurface();

    s.on("draw-start", onStart);
    s.on("draw-move", onMove);
    s.on("draw-end", onEnd);
    s.on("clear-canvas", onClear);

    return () => {
      s.off("draw-start", onStart);
      s.off("draw-move", onMove);
      s.off("draw-end", onEnd);
      s.off("clear-canvas", onClear);
    };
  }, [socket, draw, clearSurface]);

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = toPoint(e);
    localPoint.current = p;
    draw(p, p, tool, color, width);
    socket?.emit("draw-start", {
      interviewId,
      point: p,
      tool,
      color,
      strokeWidth: width,
    });
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const p = toPoint(e);
    if (localPoint.current) draw(localPoint.current, p, tool, color, width);
    localPoint.current = p;
    socket?.emit("draw-move", { interviewId, point: p });
  };

  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    localPoint.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    socket?.emit("draw-end", { interviewId });
  };

  const clear = () => {
    clearSurface();
    socket?.emit("clear-canvas", { interviewId });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.145] bg-black p-2.5">
        <div className="flex border border-white/[0.145]">
          {(
            [
              ["pen", "Pen", PenTool],
              ["eraser", "Eraser", Eraser],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-colors ${
                tool === id
                  ? "bg-white text-[#121212]"
                  : "text-[#999999] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="sr-only">Stroke colour</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-7 cursor-pointer border border-white/[0.145] bg-transparent p-0"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="metric font-mono text-[11px]">{width}px</span>
            <input
              type="range"
              min="1"
              max="16"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="h-1 w-24 cursor-pointer accent-[#52a8ff]"
            />
          </label>
        </div>

        <button onClick={clear} className="btn-secondary ml-auto gap-1.5 px-3 py-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> Clear Board
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        className="min-h-0 w-full flex-1 cursor-crosshair touch-none bg-black"
      />
    </div>
  );
}

/* ── Room ─────────────────────────────────────────────────────── */
export default function InterviewRoom({
  interview,
  user,
}: {
  interview: Interview;
  user: User;
}) {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(interview.language);
  const [tab, setTab] = useState<"chat" | "notes" | "whiteboard">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [online, setOnline] = useState(0);
  const [console_, setConsole] = useState("");
  const [stdin, setStdin] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expected: "" }]);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [loadingCode, setLoadingCode] = useState(true);
  const [mediaError, setMediaError] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canManage = user.role === "admin" || user.role === "interviewer";

  /* ── Initial data ── */
  useEffect(() => {
    let alive = true;

    Promise.all([
      api<{ data: { participants: Participant[] } }>(
        `/api/interviews/${interview.id}/participants`,
      ),
      api<{ data: { notes: Note[] } }>(
        `/api/interviews/${interview.id}/notes?limit=50`,
      ),
      api<{ data: { code: { code: string; language: string } | null } }>(
        `/api/editor/${interview.id}/code`,
      ),
    ])
      .then(([p, n, c]) => {
        if (!alive) return;
        setParticipants(p?.data?.participants ?? []);
        setNotes(n?.data?.notes ?? []);
        if (c?.data?.code) {
          setCode(c.data.code.code);
          setLanguage(c.data.code.language);
        } else {
          setCode(interview.starterCode ?? "");
        }
      })
      .catch(() => {
        if (alive) setCode(interview.starterCode ?? "");
      })
      .finally(() => {
        if (alive) setLoadingCode(false);
      });

    return () => {
      alive = false;
    };
  }, [interview.id, interview.starterCode]);

  /* ── Socket wiring ── */
  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    s.emit("join-room", interview.id);

    const onJoin = (x: {
      participants: Array<{
        userId: string;
        role: "interviewer" | "candidate";
        displayName?: string;
        email?: string;
      }>;
      onlineCount: number;
    }) => {
      setParticipants(
        (x?.participants ?? []).map((p) => ({
          user_id: p.userId,
          role: p.role,
          display_name: p.displayName,
          email: p.email,
        })),
      );
      setOnline(x?.onlineCount ?? 0);
    };

    const onUsers = (x: { onlineCount: number }) => setOnline(x?.onlineCount ?? 0);

    const onCode = (x: { code: string; language: string; userId: string }) => {
      if (x.userId !== user.id) {
        setCode(x.code);
        if (x.language) setLanguage(x.language);
      }
    };

    const onChat = (x: { userId: string; message: string; createdAt: string }) =>
      setMessages((m) => [
        ...m,
        { userId: x.userId, text: x.message, createdAt: x.createdAt },
      ]);

    const onTyping = (x: { userId: string; isTyping: boolean }) =>
      setTyping((t) =>
        x.isTyping
          ? t.includes(x.userId)
            ? t
            : [...t, x.userId]
          : t.filter((id) => id !== x.userId),
      );

    s.on("room-joined", onJoin);
    s.on("user-joined", onUsers);
    s.on("user-left", onUsers);
    s.on("code-update", onCode);
    s.on("chat-message", onChat);
    s.on("typing-update", onTyping);

    return () => {
      s.emit("leave-room", interview.id);
      s.off("room-joined", onJoin);
      s.off("user-joined", onUsers);
      s.off("user-left", onUsers);
      s.off("code-update", onCode);
      s.off("chat-message", onChat);
      s.off("typing-update", onTyping);
      s.disconnect();
    };
  }, [interview.id, user.id]);

  /* ── Countdown while the session is still scheduled ── */
  useEffect(() => {
    if (interview.status !== "scheduled") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [interview.status]);

  useEffect(() => {
    if (localRef.current && streamRef.current) {
      localRef.current.srcObject = streamRef.current;
    }
  }, [videoOn]);
  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remote;
  }, [remote]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  /* ── WebRTC ── */
  const startMedia = useCallback(async () => {
    if (streamRef.current) return streamRef.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = s;
      setMediaError("");
      if (localRef.current) localRef.current.srcObject = s;
      return s;
    } catch {
      setMediaError(
        "Camera/microphone unavailable. Grant permission or continue without media.",
      );
      const empty = new MediaStream();
      streamRef.current = empty;
      return empty;
    }
  }, []);

  const makePeer = useCallback(
    (target: string) => {
      const s = socket;
      if (!s) return null;
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pc.ontrack = (e) => setRemote(e.streams[0]);
      pc.onicecandidate = (e) =>
        e.candidate &&
        s.emit("webrtc-ice-candidate", {
          interviewId: interview.id,
          to: target,
          candidate: e.candidate,
        });
      pcRef.current = pc;
      return pc;
    },
    [socket, interview.id],
  );

  useEffect(() => {
    const s = socket;
    if (!s) return;

    const onOffer = async (x: { from: string; signal: RTCSessionDescriptionInit }) => {
      if (!x?.from || x.from === user.id) return;
      try {
        const media = await startMedia();
        const pc = makePeer(x.from);
        if (!pc) return;
        media.getTracks().forEach((t) => pc.addTrack(t, media));
        await pc.setRemoteDescription(x.signal);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit("webrtc-answer", {
          interviewId: interview.id,
          to: x.from,
          signal: answer,
        });
      } catch {
        /* a failed negotiation should never kill the room */
      }
    };

    const onAnswer = async (x: { from: string; signal: RTCSessionDescriptionInit }) => {
      if (!x?.from || x.from === user.id || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(x.signal);
      } catch {}
    };

    const onIce = async (x: { from: string; candidate: RTCIceCandidateInit }) => {
      if (!x?.from || x.from === user.id || !pcRef.current || !x.candidate) return;
      try {
        await pcRef.current.addIceCandidate(x.candidate);
      } catch {}
    };

    s.on("webrtc-offer", onOffer);
    s.on("webrtc-answer", onAnswer);
    s.on("webrtc-ice-candidate", onIce);

    return () => {
      s.off("webrtc-offer", onOffer);
      s.off("webrtc-answer", onAnswer);
      s.off("webrtc-ice-candidate", onIce);
      pcRef.current?.close();
      pcRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [socket, interview.id, user.id, makePeer, startMedia]);

  const call = async () => {
    const target = participants.find((p) => p.user_id !== user.id)?.user_id;
    if (!target || !socket) {
      setConsole("No other participant is in the room yet.");
      return;
    }
    try {
      const media = await startMedia();
      const pc = makePeer(target);
      if (!pc) return;
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc-offer", {
        interviewId: interview.id,
        to: target,
        signal: offer,
      });
      setConsole(`Offer sent to ${target.slice(0, 8)}`);
    } catch (e) {
      setConsole(e instanceof Error ? e.message : "Could not start the call");
    }
  };

  const toggle = async (type: "video" | "audio") => {
    const s = await startMedia();
    const tracks = type === "video" ? s.getVideoTracks() : s.getAudioTracks();
    if (!tracks.length) {
      setMediaError("No media tracks available to toggle.");
      return;
    }
    tracks.forEach((t) => (t.enabled = !t.enabled));
    if (type === "video") setVideoOn((v) => !v);
    else setAudioOn((v) => !v);
    socket?.emit("media-toggle", {
      interviewId: interview.id,
      mediaType: type === "video" ? "camera" : "microphone",
      enabled: tracks[0]?.enabled ?? false,
    });
  };

  /* ── Chat ── */
  const send = () => {
    const text = message.trim();
    if (!text || !socket) return;
    setMessages((x) => [
      ...x,
      { userId: user.id, text, createdAt: new Date().toISOString() },
    ]);
    socket.emit("chat-message", { interviewId: interview.id, message: text });
    setMessage("");
    socket.emit("typing-stop", interview.id);
  };

  const onMessageChange = (v: string) => {
    setMessage(v);
    if (!socket) return;
    socket.emit("typing-start", interview.id);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket.emit("typing-stop", interview.id),
      700,
    );
  };

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    [],
  );

  /* ── Editor ── */
  const saveCode = async () => {
    try {
      await api(`/api/editor/${interview.id}/code`, {
        method: "PUT",
        body: JSON.stringify({ code, language }),
      });
      setConsole("Code saved to the workspace.");
      socket?.emit("save-code", { interviewId: interview.id, code, language });
    } catch (e) {
      setConsole(e instanceof Error ? e.message : "Save failed");
    }
  };

  const restore = async () => {
    if (!confirm("Restore the starter code? Your current saved code will be replaced."))
      return;
    try {
      const r = await api<{
        data: { code: { code: string; language: string } };
      }>(`/api/editor/${interview.id}/code/restore`, { method: "POST" });
      setCode(r.data.code.code);
      setLanguage(r.data.code.language);
      setConsole("Starter code restored.");
      socket?.emit("save-code", {
        interviewId: interview.id,
        code: r.data.code.code,
        language: r.data.code.language,
      });
    } catch (e) {
      setConsole(e instanceof Error ? e.message : "Restore failed");
    }
  };

  const execute = async (withTests: boolean) => {
    setConsole(withTests ? "Running test cases..." : "Running code...");
    try {
      const body = withTests ? { language, code, testCases } : { language, code, stdin };
      const r = await api<{ data: unknown }>(
        withTests ? "/api/execute/test" : "/api/execute/run",
        { method: "POST", body: JSON.stringify(body) },
      );
      setConsole(JSON.stringify(r.data, null, 2));
    } catch (e) {
      setConsole(e instanceof Error ? e.message : "Execution failed");
    }
  };

  const updateTest = (i: number, key: keyof TestCase, value: string) =>
    setTestCases((xs) => xs.map((t, n) => (n === i ? { ...t, [key]: value } : t)));

  const advanceStatus = async () => {
    const next =
      interview.status === "scheduled"
        ? "in_progress"
        : interview.status === "in_progress"
          ? "completed"
          : null;
    if (!next) return;

    /* Soft gate: an early start is allowed but must be deliberate. */
    if (next === "in_progress") {
      const { isPast } = countdownParts(interview.scheduledAt, now);
      if (!isPast) {
        const ok = confirm(
          `This session is scheduled for ${formatDateTime(interview.scheduledAt)}.\n\n` +
            `Starting it now begins the interview ${formatCountdown(interview.scheduledAt, now)} early. Continue?`,
        );
        if (!ok) return;
      }
    }

    try {
      setAdvancing(true);
      await api(`/api/interviews/${interview.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      window.location.reload();
    } catch (e) {
      setConsole(e instanceof Error ? e.message : "Could not change status");
      setAdvancing(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black font-sans text-white">
      {/* ── Room header ── */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.145] bg-black/90 px-3 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center bg-white text-[#121212]">
            <Code2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-display text-sm font-medium tracking-[-1px]">
              <span className="truncate">{interview.title}</span>
              {interview.status === "in_progress" ? (
                <span className="chip chip-success hidden font-mono sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#62c073]" />
                  {online} live
                </span>
              ) : (
                <span className="chip hidden font-mono sm:inline-flex">
                  {online} waiting
                </span>
              )}
            </p>
            <p className="metric truncate font-mono text-[10px]">
              room {String(interview.roomId ?? interview.room_id ?? "").slice(0, 8)} ·{" "}
              {language}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={restore}
            className="btn-secondary gap-1 px-2.5 py-1.5 text-xs sm:px-3"
            title="Restore starter code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restore</span>
          </button>
          <button onClick={saveCode} className="btn-secondary gap-1 px-2.5 py-1.5 text-xs sm:px-3">
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {canManage && interview.status !== "completed" && interview.status !== "cancelled" && (
            <button
              onClick={advanceStatus}
              disabled={advancing}
              className="btn-square gap-1 px-3 py-1.5 text-xs"
            >
              {advancing
                ? "Working..."
                : interview.status === "scheduled"
                  ? "Start Session"
                  : "Complete"}
            </button>
          )}

          {canManage && (
            <Link
              href={`/feedback/${interview.id}`}
              className="btn-secondary gap-1 px-2.5 py-1.5 text-xs sm:px-3"
            >
              <Award className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scorecard</span>
            </Link>
          )}

          <Link href="/dashboard" className="btn-icon" title="Exit workspace">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {mediaError && (
        <div className="shrink-0 px-3 pt-3 sm:px-4">
          <Banner tone="info">{mediaError}</Banner>
        </div>
      )}

      {/* ── Scheduled (not yet live) notice ── */}
      {interview.status === "scheduled" && (
        <div className="shrink-0 px-3 pt-3 sm:px-4">
          <Banner tone="info">
            <strong className="font-semibold text-white">Not started.</strong>{" "}
            Scheduled for {formatDateTime(interview.scheduledAt)} —{" "}
            {countdownParts(interview.scheduledAt, now).isPast
              ? "the start time has arrived."
              : `T-minus ${formatCountdown(interview.scheduledAt, now)}.`}{" "}
            {canManage
              ? 'Press "Start session" when the candidate is ready — starting early asks for confirmation.'
              : "Your interviewer will start the session. You can wait here."}
          </Banner>
        </div>
      )}

      {/* ── Workspace grid ── */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        {/* Left: participants + media */}
        <aside className="hidden flex-col justify-between border-r border-white/[0.145] bg-black lg:flex">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between border-b border-white/[0.145] pb-3">
              <h3 className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#999999]">
                <Users className="h-3.5 w-3.5 text-[#52a8ff]" /> Participants
              </h3>
              <span className="chip chip-active font-mono">
                {participants.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {participants.map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center gap-3 border border-white/[0.145] bg-[#0a0a0a] p-2.5"
                >
                  <span className="avatar-square h-8 w-8 font-mono text-[11px]">
                    {(p.display_name || p.email || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xs font-medium tracking-[-0.5px] text-white">
                      {p.display_name || p.email || p.user_id.slice(0, 8)}
                    </p>
                    <p className="metric font-mono text-[10px]">
                      {p.role} · {p.user_id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              ))}
              {!participants.length && (
                <p className="metric py-4 text-center font-mono text-[11px]">
                  Waiting for participants…
                </p>
              )}
            </div>

            <button onClick={call} className="btn-square mt-4 w-full gap-2 py-2.5 text-xs">
              <Video className="h-4 w-4" /> Connect Video
            </button>
          </div>

          <div className="space-y-3 border-t border-white/[0.145] bg-[#0a0a0a] p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-video overflow-hidden border border-white/[0.145] bg-black">
                <video
                  ref={localRef}
                  muted
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                {!videoOn && (
                  <span className="absolute inset-0 grid place-items-center font-mono text-[10px] text-[#666666]">
                    cam off
                  </span>
                )}
                <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                  you
                </span>
              </div>
              <div className="relative aspect-video overflow-hidden border border-white/[0.145] bg-black">
                <video
                  ref={remoteRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 left-1 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                  peer
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggle("video")}
                className={`btn-secondary flex-1 gap-1.5 px-2 py-2 text-[11px] ${
                  videoOn ? "" : "border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#f43f5e]"
                }`}
              >
                {videoOn ? (
                  <>
                    <Video className="h-3.5 w-3.5 text-[#62c073]" /> Cam
                  </>
                ) : (
                  <>
                    <VideoOff className="h-3.5 w-3.5" /> Cam
                  </>
                )}
              </button>
              <button
                onClick={() => toggle("audio")}
                className={`btn-secondary flex-1 gap-1.5 px-2 py-2 text-[11px] ${
                  audioOn ? "" : "border-[#f43f5e]/40 bg-[#f43f5e]/10 text-[#f43f5e]"
                }`}
              >
                {audioOn ? (
                  <>
                    <Mic className="h-3.5 w-3.5 text-[#62c073]" /> Mic
                  </>
                ) : (
                  <>
                    <MicOff className="h-3.5 w-3.5" /> Mic
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Centre: editor */}
        <section className="flex min-w-0 flex-col overflow-hidden bg-black">
          <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-white/[0.145] bg-black px-3">
            <div className="flex items-center gap-2">
              <span className="metric font-mono text-[11px] uppercase tracking-[0.12em]">
                lang
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="select w-40 py-1.5 font-mono text-xs"
              >
                {langs.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={() => execute(false)} className="btn-secondary gap-1.5 px-3 py-1.5 text-xs">
                <Play className="h-3 w-3" /> Run
              </button>
              <button onClick={() => execute(true)} className="btn-square gap-1.5 px-3 py-1.5 text-xs">
                <Terminal className="h-3 w-3" /> Test
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            {loadingCode ? (
              <div className="grid h-full place-items-center font-mono text-xs text-[#666666]">
                Loading editor state…
              </div>
            ) : (
              <Editor
                height="100%"
                theme="interview-dark"
                language={language}
                value={code}
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme("interview-dark", {
                    base: "vs-dark",
                    inherit: true,
                    rules: [
                      { token: "comment", foreground: "666666", fontStyle: "italic" },
                      { token: "keyword", foreground: "52a8ff" },
                      { token: "string", foreground: "62c073" },
                      { token: "number", foreground: "f5b544" },
                    ],
                    colors: {
                      "editor.background": "#000000",
                      "editor.foreground": "#ffffff",
                      "editorLineNumber.foreground": "#4a4a4a",
                      "editorLineNumber.activeForeground": "#52a8ff",
                      "editor.selectionBackground": "#52a8ff33",
                      "editor.lineHighlightBackground": "#0a0a0a",
                      "editorCursor.foreground": "#52a8ff",
                    },
                  });
                }}
                onChange={(v) => {
                  const next = v ?? "";
                  setCode(next);
                  socket?.emit("save-code", {
                    interviewId: interview.id,
                    code: next,
                    language,
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  fontLigatures: true,
                  fontFamily: "'Geist Mono', 'JetBrains Mono', monospace",
                }}
              />
            )}
          </div>
        </section>

        {/* Right: chat / notes / whiteboard */}
        <aside className="flex min-h-0 flex-col border-l border-white/[0.145] bg-black">
          <div className="flex shrink-0 border-b border-white/[0.145]">
            {(
              [
                ["chat", "Chat", MessageSquare],
                ["notes", "Notes", FileText],
                ["whiteboard", "Board", PenTool],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                  tab === id ? "text-white" : "text-[#666666] hover:text-[#999999]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {tab === id && (
                  <motion.span
                    layoutId="roomTab"
                    className="absolute inset-x-0 -bottom-px h-px bg-[#52a8ff]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </button>
            ))}
          </div>

          {tab === "chat" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => {
                    const isMe = m.userId === user.id;
                    return (
                      <motion.div
                        key={`${m.createdAt ?? "m"}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] border px-3 py-2 text-xs leading-relaxed ${
                            isMe
                              ? "border-[#52a8ff]/40 bg-[#52a8ff]/10 text-white"
                              : "border-white/[0.145] bg-[#0a0a0a] text-[#999999]"
                          }`}
                        >
                          {m.text}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {typing.filter((id) => id !== user.id).length > 0 && (
                  <p className="font-mono text-[11px] text-[#52a8ff]">
                    peer is typing…
                  </p>
                )}

                {!messages.length && (
                  <p className="metric py-8 text-center font-mono text-[11px]">
                    No messages yet. Say hello.
                  </p>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="shrink-0 border-t border-white/[0.145] bg-[#0a0a0a] p-3">
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="input py-2 text-xs"
                    placeholder="Message the room…"
                  />
                  <button onClick={send} className="btn-square px-3 py-2" aria-label="Send">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : tab === "notes" ? (
            <Notes
              interviewId={interview.id}
              initial={notes}
              onChanged={async () => {
                try {
                  const x = await api<{ data: { notes: Note[] } }>(
                    `/api/interviews/${interview.id}/notes?limit=50`,
                  );
                  setNotes(x.data.notes ?? []);
                } catch {}
              }}
            />
          ) : (
            <Whiteboard socket={socket} interviewId={interview.id} />
          )}
        </aside>
      </div>

      {/* ── Console ── */}
      <AnimatePresence>
        {console_ && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden border-t border-white/[0.145] bg-[#0a0a0a]"
          >
            <div className="max-h-48 overflow-auto p-4">
              <div className="mb-2 flex items-center justify-between border-b border-white/[0.145] pb-2">
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#62c073]">
                  <Terminal className="h-3.5 w-3.5" /> Console
                </span>
                <button
                  onClick={() => setConsole("")}
                  className="font-mono text-[10px] text-[#666666] hover:text-white"
                >
                  clear
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-[#999999]">
                {console_}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Test cases ── */}
      <div className="shrink-0 border-t border-white/[0.145] bg-black px-3 py-2">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#666666] hover:text-white">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            Test cases &amp; stdin
          </summary>
          <div className="mt-3 grid gap-3 pb-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Standard input…"
              className="input min-h-16 font-mono text-xs"
            />
            <div className="space-y-2">
              {testCases.map((t, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    value={t.input}
                    onChange={(e) => updateTest(i, "input", e.target.value)}
                    placeholder={`input #${i + 1}`}
                    className="input font-mono text-xs"
                  />
                  <input
                    value={t.expected}
                    onChange={(e) => updateTest(i, "expected", e.target.value)}
                    placeholder="expected"
                    className="input font-mono text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setTestCases((x) => [...x, { input: "", expected: "" }])}
                className="btn-secondary gap-1 px-3 py-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add case
              </button>
              <button
                onClick={() => setTestCases((x) => (x.length > 1 ? x.slice(0, -1) : x))}
                disabled={testCases.length <= 1}
                className="btn-secondary gap-1 px-3 py-1.5 text-xs text-[#f43f5e]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

/* ── Private evaluator notes ──────────────────────────────────── */
function Notes({
  interviewId,
  initial,
  onChanged,
}: {
  interviewId: string;
  initial: Note[];
  onChanged: () => void | Promise<void>;
}) {
  const [content, setContent] = useState(initial[0]?.content || "");
  const [id, setId] = useState<string | undefined>(initial[0]?.id);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const save = async () => {
    try {
      setBusy(true);
      setStatus("");
      if (id) {
        await api(`/api/interviews/${interviewId}/notes/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ content, is_private: true }),
        });
      } else {
        const r = await api<{ data: { note: { id: string } } }>(
          `/api/interviews/${interviewId}/notes`,
          { method: "POST", body: JSON.stringify({ content, is_private: true }) },
        );
        setId(r?.data?.note?.id);
      }
      setStatus("Saved");
      await onChanged();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!id || !confirm("Delete this note?")) return;
    try {
      await api(`/api/interviews/${interviewId}/notes/${id}`, { method: "DELETE" });
      setId(undefined);
      setContent("");
      setStatus("Deleted");
      await onChanged();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col p-4">
      <div className="mb-3 flex items-center justify-between border-b border-white/[0.145] pb-2">
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#999999]">
          <FileText className="h-3.5 w-3.5 text-[#52a8ff]" /> Private notes
        </span>
        <div className="flex items-center gap-2">
          {status && <span className="metric font-mono text-[10px]">{status}</span>}
          <button
            onClick={del}
            disabled={!id}
            className="btn-secondary px-2.5 py-1 text-[11px] text-[#f43f5e]"
          >
            Delete
          </button>
          <button onClick={save} disabled={busy} className="btn-square px-3 py-1 text-[11px]">
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input min-h-0 flex-1 resize-none font-mono text-xs leading-relaxed"
        placeholder="Capture candidate signals, algorithm notes, strengths & weaknesses…"
      />
    </div>
  );
}
