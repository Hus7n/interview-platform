"use client";
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { connectSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import type { Interview, Participant, User } from "@/lib/types";
import Link from "next/link";

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
type Message = { userId: string; text: string; createdAt?: string };
type TestCase = { input: string; expected: string };

type Point = { x: number; y: number };
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
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ffffff");
  const [width, setWidth] = useState(3);
  const size = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };
  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const draw = (a: Point, b: Point, t = tool, c = color, w = width) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = t === "eraser" ? "#0f172a" : c;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  useEffect(() => {
    const s = socket;
    if (!s) return;
    const move = (p: { point: Point; userId?: string }) => {
      if (!p.userId) return;
      const prev = remotePoints.current[p.userId];
      const style = remoteStyles.current[p.userId];
      if (prev && style)
        draw(prev, p.point, style.tool, style.color, style.strokeWidth);
      remotePoints.current[p.userId] = p.point;
    };
    const end = (p: { userId?: string }) => {
      if (p.userId) {
        delete remotePoints.current[p.userId];
        delete remoteStyles.current[p.userId];
      }
    };
    const start = (p: {
      userId?: string;
      point: Point;
      tool: string;
      color: string;
      strokeWidth: number;
    }) => {
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
    const clear = () => {
      const c = canvasRef.current?.getContext("2d");
      const sz = size();
      if (c && sz) {
        c.clearRect(0, 0, sz.w, sz.h);
      }
    };
    s.on("draw-start", start);
    s.on("draw-move", move);
    s.on("draw-end", end);
    s.on("clear-canvas", clear);
    return () => {
      s.off("draw-start", start);
      s.off("draw-move", move);
      s.off("draw-end", end);
      s.off("clear-canvas", clear);
    };
  }, [socket]);
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const p = point(e);
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
    const p = point(e);
    if (localPoint.current) draw(localPoint.current, p, tool, color, width);
    localPoint.current = p;
    socket?.emit("draw-move", { interviewId, point: p });
  };
  const up = () => {
    drawing.current = false;
    localPoint.current = null;
    socket?.emit("draw-end", { interviewId });
  };
  const clear = () => {
    const c = canvasRef.current?.getContext("2d");
    const sz = size();
    if (c && sz) c.clearRect(0, 0, sz.w, sz.h);
    socket?.emit("clear-canvas", { interviewId });
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 p-2">
        <select
          value={tool}
          onChange={(e) => setTool(e.target.value)}
          className="rounded bg-white/10 px-2 py-1 text-xs"
        >
          <option value="pen">Pen</option>
          <option value="eraser">Eraser</option>
        </select>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-7 w-7 rounded"
        />
        <input
          type="range"
          min="1"
          max="12"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <button onClick={clear} className="ml-auto text-xs text-slate-300">
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={1200}
        height={700}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="min-h-0 w-full flex-1 touch-none bg-slate-950"
      />
    </div>
  );
}

export default function InterviewRoom({
  interview,
  user,
}: {
  interview: Interview;
  user: User;
}) {
  const [socket, setSocket] = useState<ReturnType<typeof connectSocket> | null>(
    null,
  );
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState(interview.language);
  const [tab, setTab] = useState<"chat" | "notes" | "whiteboard">("chat");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  const [notes, setNotes] = useState<
    { id: string; content: string; is_private: boolean }[]
  >([]);
  const [online, setOnline] = useState(0);
  const [run, setRun] = useState("");
  const [stdin, setStdin] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([
    { input: "", expected: "" },
  ]);
  const [videoOn, setVideoOn] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [loadingCode, setLoadingCode] = useState(true);
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([
      api<{ data: { participants: Participant[] } }>(
        `/api/interviews/${interview.id}/participants`,
      ),
      api<{
        data: { notes: { id: string; content: string; is_private: boolean }[] };
      }>(`/api/interviews/${interview.id}/notes?limit=50`),
      api<{ data: { code: { code: string; language: string } | null } }>(
        `/api/editor/${interview.id}/code`,
      ),
    ])
      .then(([p, n, c]) => {
        if (!alive) return;
        setParticipants(p.data.participants);
        setNotes(n.data.notes);
        if (c.data.code) {
          setCode(c.data.code.code);
          setLanguage(c.data.code.language);
        } else setCode(interview.starterCode || "");
      })
      .catch(() => setCode(interview.starterCode || ""))
      .finally(() => alive && setLoadingCode(false));
    return () => {
      alive = false;
    };
  }, [interview.id, interview.starterCode]);
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
        x.participants.map((p) => ({
          user_id: p.userId,
          role: p.role,
          display_name: p.displayName,
          email: p.email,
        })),
      );
      setOnline(x.onlineCount);
    };
    const onUsers = (x: { onlineCount: number }) => setOnline(x.onlineCount);
    const onCode = (x: { code: string; language: string; userId: string }) => {
      if (x.userId !== user.id) {
        setCode(x.code);
        setLanguage(x.language);
      }
    };
    const onChat = (x: {
      userId: string;
      message: string;
      createdAt: string;
    }) =>
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
      s.disconnect();
      s.off("room-joined", onJoin);
      s.off("user-joined", onUsers);
      s.off("user-left", onUsers);
      s.off("code-update", onCode);
      s.off("chat-message", onChat);
      s.off("typing-update", onTyping);
    };
  }, [interview.id, user.id]);
  useEffect(() => {
    if (localRef.current && streamRef.current)
      localRef.current.srcObject = streamRef.current;
  }, [videoOn]);
  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remote;
  }, [remote]);
  const startMedia = async () => {
    if (streamRef.current) return streamRef.current;
    const s = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = s;
    if (localRef.current) localRef.current.srcObject = s;
    return s;
  };
  const makePeer = (target: string) => {
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
  };
  useEffect(() => {
    const s = socket;
    if (!s) return;
    const offer = async (x: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => {
      if (x.from === user.id) return;
      const media = await startMedia();
      const pc = makePeer(x.from)!;
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      await pc.setRemoteDescription(x.signal);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      s.emit("webrtc-answer", {
        interviewId: interview.id,
        to: x.from,
        signal: answer,
      });
    };
    const answer = async (x: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => {
      if (x.from !== user.id && pcRef.current)
        await pcRef.current.setRemoteDescription(x.signal);
    };
    const ice = async (x: { from: string; candidate: RTCIceCandidateInit }) => {
      if (x.from !== user.id && pcRef.current)
        try {
          await pcRef.current.addIceCandidate(x.candidate);
        } catch {}
    };
    s.on("webrtc-offer", offer);
    s.on("webrtc-answer", answer);
    s.on("webrtc-ice-candidate", ice);
    return () => {
      s.off("webrtc-offer", offer);
      s.off("webrtc-answer", answer);
      s.off("webrtc-ice-candidate", ice);
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [socket, interview.id, user.id]);
  const call = async () => {
    const target = participants.find((p) => p.user_id !== user.id)?.user_id;
    if (!target || !socket) return;
    const media = await startMedia();
    const pc = makePeer(target)!;
    media.getTracks().forEach((t) => pc.addTrack(t, media));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("webrtc-offer", {
      interviewId: interview.id,
      to: target,
      signal: offer,
    });
  };
  const toggle = async (type: "video" | "audio") => {
    const s = await startMedia();
    const tracks = type === "video" ? s.getVideoTracks() : s.getAudioTracks();
    tracks.forEach((t) => (t.enabled = !t.enabled));
    if (type === "video") setVideoOn((v) => !v);
    else setAudioOn((v) => !v);
    socket?.emit("media-toggle", {
      interviewId: interview.id,
      mediaType: type === "video" ? "camera" : "microphone",
      enabled: tracks[0]?.enabled ?? false,
    });
  };
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
  const saveCode = async () => {
    try {
      await api(`/api/editor/${interview.id}/code`, {
        method: "PUT",
        body: JSON.stringify({ code, language }),
      });
      setRun("Code saved.");
      socket?.emit("save-code", { interviewId: interview.id, code, language });
    } catch (e) {
      setRun(e instanceof Error ? e.message : "Save failed");
    }
  };
  const restore = async () => {
    if (
      !confirm(
        "Restore the starter code? Your current saved code will be replaced.",
      )
    )
      return;
    try {
      const r = await api<{
        data: { code: { code: string; language: string } };
      }>(`/api/editor/${interview.id}/code/restore`, { method: "POST" });
      setCode(r.data.code.code);
      setLanguage(r.data.code.language);
      setRun("Starter code restored.");
      socket?.emit("save-code", {
        interviewId: interview.id,
        code: r.data.code.code,
        language: r.data.code.language,
      });
    } catch (e) {
      setRun(e instanceof Error ? e.message : "Restore failed");
    }
  };
  const execute = async (test = false) => {
    setRun("Running…");
    try {
      const body = test
        ? { language, code, testCases }
        : { language, code, stdin };
      const r = await api<{ data: unknown }>(
        test ? "/api/execute/test" : "/api/execute/run",
        { method: "POST", body: JSON.stringify(body) },
      );
      setRun(JSON.stringify(r.data, null, 2));
    } catch (e) {
      setRun(e instanceof Error ? e.message : "Execution failed");
    }
  };
  const updateTest = (i: number, key: keyof TestCase, value: string) =>
    setTestCases((x) =>
      x.map((t, n) => (n === i ? { ...t, [key]: value } : t)),
    );
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950 text-white">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{interview.title}</p>
          <p className="text-xs text-slate-400">
            {online} online · {language}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={restore} className="btn bg-white/10 text-white">
            Restore
          </button>
          <button onClick={saveCode} className="btn bg-white/10 text-white">
            Save
          </button>
          {(user.role === "admin" || user.role === "interviewer") && (
            <button
              onClick={async () => {
                const next =
                  interview.status === "scheduled"
                    ? "in_progress"
                    : interview.status === "in_progress"
                      ? "completed"
                      : null;
                if (next) {
                  await api(`/api/interviews/${interview.id}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: next }),
                  });
                  window.location.reload();
                }
              }}
              className="btn bg-amber-500 text-white"
            >
              {interview.status === "scheduled"
                ? "Start"
                : interview.status === "in_progress"
                  ? "Complete"
                  : "Completed"}
            </button>
          )}
          {(user.role === "admin" || user.role === "interviewer") && (
            <Link
              href={`/feedback/${interview.id}`}
              className="btn bg-indigo-500 text-white"
            >
              Feedback
            </Link>
          )}
          <Link href="/dashboard" className="btn bg-white/10 text-white">
            Exit
          </Link>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="hidden overflow-y-auto border-r border-white/10 bg-slate-900 lg:block">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Participants</h3>
              <span className="text-xs text-slate-400">{online} online</span>
            </div>
            <div className="mt-3 space-y-2">
              {participants.map((p) => (
                <div key={p.user_id} className="rounded-lg bg-white/5 p-3">
                  <p className="text-sm font-medium">
                    {p.display_name || p.email || p.user_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-400">{p.role}</p>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <button
                onClick={call}
                className="btn w-full bg-emerald-600 text-white"
              >
                Start video call
              </button>
            </div>
          </div>
          <div className="border-t border-white/10 p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="overflow-hidden rounded-lg bg-black">
                <video
                  ref={localRef}
                  muted
                  autoPlay
                  playsInline
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-lg bg-black">
                <video
                  ref={remoteRef}
                  autoPlay
                  playsInline
                  className="aspect-video w-full object-cover"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggle("video")}
                className="btn flex-1 bg-white/10 text-white"
              >
                {videoOn ? "Camera" : "Camera off"}
              </button>
              <button
                onClick={() => toggle("audio")}
                className="btn flex-1 bg-white/10 text-white"
              >
                {audioOn ? "Mic" : "Mic off"}
              </button>
            </div>
          </div>
        </aside>
        <section className="min-w-0 overflow-hidden">
          <div className="flex h-11 items-center justify-between border-b border-white/10 bg-slate-900 px-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded bg-white/10 px-2 py-1 text-xs text-white"
            >
              {langs.map((l) => (
                <option className="text-black" key={l}>
                  {l}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => execute(false)}
                className="btn bg-white/10 text-white"
              >
                Run
              </button>
              <button
                onClick={() => execute(true)}
                className="btn bg-indigo-600 text-white"
              >
                Test
              </button>
            </div>
          </div>
          <div className="h-[calc(100%-44px)]">
            {loadingCode ? (
              <div className="grid h-full place-items-center text-sm text-slate-400">
                Loading saved editor state…
              </div>
            ) : (
              <Editor
                height="100%"
                theme="vs-dark"
                language={language}
                value={code}
                onChange={(v) => {
                  const next = v || "";
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
                }}
              />
            )}
          </div>
        </section>
        <aside className="flex min-h-0 flex-col border-l border-white/10 bg-slate-900">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setTab("chat")}
              className={`flex-1 py-3 text-sm ${tab === "chat" ? "border-b-2 border-indigo-400" : ""}`}
            >
              Chat
            </button>
            <button
              onClick={() => setTab("notes")}
              className={`flex-1 py-3 text-sm ${tab === "notes" ? "border-b-2 border-indigo-400" : ""}`}
            >
              Notes
            </button>
            <button
              onClick={() => setTab("whiteboard")}
              className={`flex-1 py-3 text-sm ${tab === "whiteboard" ? "border-b-2 border-indigo-400" : ""}`}
            >
              Board
            </button>
          </div>
          {tab === "chat" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((m, i) => (
                  <div
                    key={`${m.createdAt}-${i}`}
                    className={`rounded-lg p-2 text-sm ${m.userId === user.id ? "ml-8 bg-indigo-600" : "mr-8 bg-white/10"}`}
                  >
                    {m.text}
                  </div>
                ))}
                {typing.filter((id) => id !== user.id).length > 0 && (
                  <p className="px-1 text-xs italic text-slate-400">
                    Someone is typing…
                  </p>
                )}
              </div>
              <div className="border-t border-white/10 p-3">
                <div className="flex gap-2">
                  <input
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm outline-none"
                    placeholder="Message…"
                  />
                  <button
                    onClick={send}
                    className="btn bg-indigo-600 text-white"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          ) : tab === "notes" ? (
            <Notes
              interviewId={interview.id}
              initial={notes}
              onChanged={() =>
                api<{
                  data: {
                    notes: {
                      id: string;
                      content: string;
                      is_private: boolean;
                    }[];
                  };
                }>(`/api/interviews/${interview.id}/notes?limit=50`).then((x) =>
                  setNotes(x.data.notes),
                )
              }
            />
          ) : (
            <Whiteboard socket={socket} interviewId={interview.id} />
          )}
        </aside>
      </div>
      {run && (
        <pre className="max-h-48 shrink-0 overflow-auto border-t border-white/10 bg-black p-3 text-xs text-slate-300">
          {run}
        </pre>
      )}
      <div className="border-t border-white/10 bg-slate-900 p-2">
        <details>
          <summary className="cursor-pointer text-xs text-slate-400">
            Test cases / stdin
          </summary>
          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Run stdin"
              className="min-h-16 rounded bg-white/5 p-2 text-xs"
            />
            <div className="space-y-2">
              {testCases.map((t, i) => (
                <div className="grid grid-cols-2 gap-2" key={i}>
                  <textarea
                    value={t.input}
                    onChange={(e) => updateTest(i, "input", e.target.value)}
                    placeholder={`Input ${i + 1}`}
                    className="min-h-16 rounded bg-white/5 p-2 text-xs"
                  />
                  <textarea
                    value={t.expected}
                    onChange={(e) => updateTest(i, "expected", e.target.value)}
                    placeholder="Expected output"
                    className="min-h-16 rounded bg-white/5 p-2 text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() =>
                  setTestCases((x) => [...x, { input: "", expected: "" }])
                }
                className="btn bg-white/10 text-white"
              >
                + Case
              </button>
              <button
                onClick={() =>
                  setTestCases((x) => (x.length > 1 ? x.slice(0, -1) : x))
                }
                className="btn bg-white/10 text-white"
              >
                − Case
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
function Notes({
  interviewId,
  initial,
  onChanged,
}: {
  interviewId: string;
  initial: { id: string; content: string; is_private: boolean }[];
  onChanged: () => void;
}) {
  const [content, setContent] = useState(initial[0]?.content || "");
  const [id, setId] = useState(initial[0]?.id);
  const save = async () => {
    try {
      if (id)
        await api(`/api/interviews/${interviewId}/notes/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ content, is_private: true }),
        });
      else {
        const r = await api<{ data: { note: { id: string } } }>(
          `/api/interviews/${interviewId}/notes`,
          {
            method: "POST",
            body: JSON.stringify({ content, is_private: true }),
          },
        );
        setId(r.data.note.id);
      }
      onChanged();
    } catch {}
  };
  const del = async () => {
    if (!id || !confirm("Delete this note?")) return;
    await api(`/api/interviews/${interviewId}/notes/${id}`, {
      method: "DELETE",
    });
    setId(undefined);
    setContent("");
    onChanged();
  };
  return (
    <div className="flex min-h-0 flex-1 flex-col p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-slate-400">Private notes</span>
        <div className="flex gap-3">
          <button
            onClick={del}
            disabled={!id}
            className="text-xs text-red-300 disabled:opacity-30"
          >
            Delete
          </button>
          <button
            onClick={save}
            className="text-xs font-semibold text-indigo-300"
          >
            Save
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-0 flex-1 resize-none rounded-lg bg-white/5 p-3 text-sm outline-none"
        placeholder="Capture interview notes…"
      />
    </div>
  );
}
