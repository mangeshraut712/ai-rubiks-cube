import { Suspense, lazy, useEffect, useRef, useState } from "react";

import LiveSession from "./components/LiveSession";
import StatusBar from "./components/StatusBar";
import TutorOverlay from "./components/TutorOverlay";
import { createSolvedCubeState } from "./utils/cubeColors";

const CubeViewer = lazy(() => import("./components/CubeViewer"));

function normalizeTranscriptText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function App() {
  const sessionRef = useRef(null);

  const [sessionActive, setSessionActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [cubeState, setCubeState] = useState(createSolvedCubeState());
  const [activeMove, setActiveMove] = useState("");
  const [micLevel, setMicLevel] = useState(0);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [latestInstruction, setLatestInstruction] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [hintText, setHintText] = useState("");
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState("");
  const [moveHistory, setMoveHistory] = useState([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [errorText, setErrorText] = useState("");
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);
  const moveQueueRef = useRef([]);
  const moveAnimTimerRef = useRef(null);

  useEffect(() => {
    if (!sessionActive || !startTimestamp) {
      return undefined;
    }

    const interval = setInterval(() => {
      const elapsedMs = Date.now() - startTimestamp;
      setTimerSeconds(Math.floor(elapsedMs / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, startTimestamp]);

  function resetSessionUiState() {
    setConnectionStatus("connecting");
    setCubeState(createSolvedCubeState());
    setActiveMove("");
    setMicLevel(0);
    setIsTutorSpeaking(false);
    setIsThinking(false);
    setLatestInstruction("Cubey is getting ready...");
    setTranscript([]);
    setHintText("");
    setChallengeMode(false);
    setChallengeMessage("");
    setMoveHistory([]);
    setTimerSeconds(0);
    setErrorText("");
    setStartTimestamp(Date.now());
    setAutoSolving(false);
    moveQueueRef.current = [];
    if (moveAnimTimerRef.current) {
      clearTimeout(moveAnimTimerRef.current);
      moveAnimTimerRef.current = null;
    }
  }

  function startSession() {
    resetSessionUiState();
    setSessionActive(true);
  }

  async function endSession() {
    await sessionRef.current?.endSession?.();
    setSessionActive(false);
    setConnectionStatus("disconnected");
    setIsTutorSpeaking(false);
  }

  function handleTranscriptEntry(entry) {
    if (!entry?.text) {
      return;
    }

    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      const isDuplicateCubeyLine =
        entry.speaker === "cubey" &&
        last?.speaker === "cubey" &&
        normalizeTranscriptText(last.text) === normalizeTranscriptText(entry.text);

      if (isDuplicateCubeyLine) {
        return prev;
      }

      return [...prev, entry];
    });

    if (entry.speaker === "cubey") {
      setLatestInstruction(entry.text);
    }
  }

  // Move queue: processes moves one-by-one with animation delay
  function enqueueMove(move) {
    if (!move) return;
    moveQueueRef.current.push(move);
    drainMoveQueue();
  }

  function drainMoveQueue() {
    if (moveAnimTimerRef.current) return; // Already processing
    if (moveQueueRef.current.length === 0) return;

    const next = moveQueueRef.current.shift();
    setActiveMove(next);

    // Wait for animation to complete before showing next move
    moveAnimTimerRef.current = setTimeout(() => {
      moveAnimTimerRef.current = null;
      if (moveQueueRef.current.length > 0) {
        drainMoveQueue();
      } else {
        setActiveMove(""); // Clear highlight when queue empty
      }
    }, 600); // Match CubeViewer animation duration (420ms + buffer)
  }

  function handleAutoSolve() {
    setAutoSolving(true);
    sessionRef.current?.autoSolve?.();
  }

  function downloadSessionRecord() {
    const payload = {
      name: "Gemini Rubik's Tutor Session",
      generatedAt: new Date().toISOString(),
      durationSeconds: timerSeconds,
      moveHistory,
      challengeMode,
      transcript
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rubiks-session-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleChallengeMode() {
    const next = !challengeMode;
    setChallengeMode(next);
    sessionRef.current?.setChallengeMode?.(next);
  }

  const moveCount = moveHistory.length;

  if (!sessionActive) {
    return (
      <main className="min-h-screen px-6 py-10 text-[#202124]">
        <div className="mx-auto flex min-h-[84vh] max-w-5xl flex-col items-center justify-center rounded-3xl border border-[#d2d8e3] bg-white/95 p-10 text-center shadow-[0_18px_40px_rgba(32,33,36,0.16)] backdrop-blur">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d2d8e3] bg-[#f8faff] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6368]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4285f4]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ea4335]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#fbbc04]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" />
            Gemini Live Agent Challenge
          </div>

          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Meet{" "}
            <span className="google-wordmark">
              <span>G</span>
              <span>e</span>
              <span>m</span>
              <span>i</span>
              <span>n</span>
              <span>i</span>
            </span>{" "}
            Rubik&apos;s Tutor
          </h1>

          <p className="mb-8 max-w-2xl text-[#5f6368]">
            Your AI tutor that sees your cube and talks you to victory. Real-time webcam + voice coaching with step-by-step move verification.
          </p>

          <div className="mb-8 grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-[#c9ddff] bg-[#edf4ff] p-4 shadow-[0_10px_20px_rgba(66,133,244,0.12)]">
              <div className="mb-2 text-2xl">🎥</div>
              <div className="font-semibold text-[#1f3a68]">Show Your Cube</div>
              <div className="text-sm text-[#4d648c]">Position your Rubik&apos;s Cube in front of the camera</div>
            </div>
            <div className="rounded-2xl border border-[#f9ceca] bg-[#fff1f0] p-4 shadow-[0_10px_20px_rgba(234,67,53,0.12)]">
              <div className="mb-2 text-2xl">🎙️</div>
              <div className="font-semibold text-[#7a2d24]">Talk to Cubey</div>
              <div className="text-sm text-[#8a4d46]">Voice coaching guides you through each move</div>
            </div>
            <div className="rounded-2xl border border-[#f8df9a] bg-[#fff9e6] p-4 shadow-[0_10px_20px_rgba(251,188,4,0.14)]">
              <div className="mb-2 text-2xl">🏆</div>
              <div className="font-semibold text-[#6a5413]">Challenge Mode</div>
              <div className="text-sm text-[#7e6a2f]">Race against Cubey to solve the scrambled cube.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={startSession}
            className="rounded-2xl border border-[#2f6ee3] bg-[#4285f4] px-8 py-3 text-lg font-bold text-white shadow-[0_10px_20px_rgba(66,133,244,0.35)] transition hover:-translate-y-0.5 hover:bg-[#3878e8]"
          >
            Start Session
          </button>

          <div className="mt-6 flex flex-col items-center gap-3">
            <a
              href="/legacy-2x2-solver/index.html"
              className="flex items-center justify-center gap-2 text-sm text-[#5f6368] decoration-[#4285f4]/60 hover:text-[#1a73e8] hover:underline"
            >
              Looking for our classic 2x2 AI Solver? 🎲
            </a>

            <div className="flex items-center gap-4 text-xs text-[#5f6368]">
              <a
                href="https://devpost.com/mbr63drexel"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#1a73e8]"
              >
                Made by Mangesh Raut
              </a>
              <span>•</span>
              <a
                href="https://geminiliveagentchallenge.devpost.com/"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-[#1a73e8]"
              >
                Gemini Live Agent Entry
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 text-[#202124] sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[0_8px_32px_rgba(32,33,36,0.06)] backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5f6368]">
              <span className="gemini-text-gradient">✦</span> Gemini Rubik&apos;s Tutor
            </div>
            <div className="text-[1.2rem] font-bold text-[#202124]">Live Cube Coaching Session</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => sessionRef.current?.requestHint?.()}
              className="rounded-[12px] border border-[#fbbc04]/30 bg-[#fbbc04]/10 px-4 py-2 text-[13px] font-bold text-[#8f6a00] shadow-sm transition hover:bg-[#fbbc04]/20"
            >
              Hint
            </button>

            <button
              type="button"
              onClick={toggleChallengeMode}
              className={`rounded-[12px] border px-4 py-2 text-[13px] font-bold shadow-sm transition ${challengeMode
                ? "border-[#34a853]/30 bg-[#34a853]/10 text-[#1f6e35]"
                : "border-[#e8eaed] bg-white text-[#5f6368] hover:bg-[#f8f9fa]"
                }`}
            >
              {challengeMode ? "Challenge On" : "Challenge Mode"}
            </button>

            <button
              type="button"
              onClick={() => sessionRef.current?.solvePreview?.()}
              className="rounded-[12px] border border-[#4285f4]/30 bg-[#4285f4]/10 px-4 py-2 text-[13px] font-bold text-[#1a73e8] shadow-sm transition hover:bg-[#4285f4]/20"
            >
              Solve Preview
            </button>

            <button
              type="button"
              onClick={handleAutoSolve}
              disabled={autoSolving}
              className={`rounded-[12px] border px-4 py-2 text-[13px] font-bold shadow-sm transition ${autoSolving
                ? "border-[#34a853]/30 bg-[#34a853]/10 text-[#1f6e35] animate-pulse cursor-wait"
                : "border-[#34a853]/50 bg-[#34a853]/20 text-[#1f6e35] hover:bg-[#34a853]/30"
                }`}
            >
              {autoSolving ? "⏳ Solving..." : "✨ Auto Solve"}
            </button>
          </div>
        </header>

        {challengeMessage ? (
          <div className="rounded-xl border border-[#9cd7ad] bg-[#ecf9f0] p-3 text-sm text-[#1f6e35] shadow-[0_6px_16px_rgba(52,168,83,0.12)]">
            {challengeMessage}
          </div>
        ) : null}

        {errorText ? (
          <div className="rounded-xl border border-[#f2bbb4] bg-[#fff1f0] p-3 text-sm text-[#7a2d24] shadow-[0_6px_16px_rgba(234,67,53,0.12)]">
            {errorText}
          </div>
        ) : null}

        <section className="grid min-h-[64vh] grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white/70 p-3 shadow-[0_8px_32px_rgba(32,33,36,0.08)] backdrop-blur-xl">
            <div className="h-full min-h-[360px] overflow-hidden rounded-[18px]">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center rounded-2xl border border-[#d2d8e3] bg-[#eef4fe] text-sm font-semibold text-[#5f6368]">
                    Loading 3D cube...
                  </div>
                }
              >
                <CubeViewer cubeState={cubeState} activeMove={activeMove} />
              </Suspense>
            </div>

            <div className="absolute right-5 top-5 h-40 w-56 rounded-[22px] border border-white/60 bg-white/50 p-1.5 shadow-[0_8px_24px_rgba(32,33,36,0.12)] backdrop-blur-2xl sm:h-44 sm:w-64">
              <LiveSession
                ref={sessionRef}
                active={sessionActive}
                onStatusChange={setConnectionStatus}
                onMicLevel={setMicLevel}
                onTutorSpeakingChange={setIsTutorSpeaking}
                onTranscriptEntry={handleTranscriptEntry}
                onInstruction={enqueueMove}
                onCubeState={setCubeState}
                onMoveHistory={setMoveHistory}
                onHint={setHintText}
                onThinkingChange={setIsThinking}
                onChallengeUpdate={(payload) => {
                  setChallengeMessage(payload.message || "");
                  if (payload.enabled) {
                    setAutoSolving(false);
                    moveQueueRef.current = [];
                  }
                }}
                onError={setErrorText}
                onSolveComplete={() => setAutoSolving(false)}
              />
            </div>
          </div>

          <TutorOverlay
            latestInstruction={latestInstruction}
            hintText={hintText}
            transcript={transcript}
          />
        </section>

        <footer className="space-y-3 pb-6">
          <StatusBar
            connectionStatus={connectionStatus}
            micLevel={micLevel}
            timerSeconds={timerSeconds}
            moveCount={moveCount}
            isTutorSpeaking={isTutorSpeaking}
            isThinking={isThinking}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadSessionRecord}
              className="rounded-[12px] border border-white/60 bg-white/70 px-5 py-2.5 text-[12px] font-bold tracking-wide text-[#5f6368] shadow-sm backdrop-blur-md transition hover:bg-white"
            >
              DOWNLOAD SESSION JSON
            </button>

            <button
              type="button"
              onClick={endSession}
              className="rounded-[12px] border border-[#ea4335]/30 bg-[#ea4335]/10 px-5 py-2.5 text-[12px] font-bold tracking-wide text-[#ea4335] shadow-sm backdrop-blur-md transition hover:bg-[#ea4335]/20"
            >
              END SESSION
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
