import { useEffect, useRef, useState } from "react";

import CubeViewer from "./components/CubeViewer";
import LiveSession from "./components/LiveSession";
import StatusBar from "./components/StatusBar";
import TutorOverlay from "./components/TutorOverlay";
import { createSolvedCubeState } from "./utils/cubeColors";

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
    setLatestInstruction("Cubey is getting ready...");
    setTranscript([]);
    setHintText("");
    setChallengeMode(false);
    setChallengeMessage("");
    setMoveHistory([]);
    setTimerSeconds(0);
    setErrorText("");
    setStartTimestamp(Date.now());
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

    setTranscript((prev) => [...prev, entry]);

    if (entry.speaker === "cubey") {
      setLatestInstruction(entry.text);
    }
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
      <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#1d4ed8_0%,#0f172a_45%,#020617_100%)] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[84vh] max-w-5xl flex-col items-center justify-center rounded-3xl border border-white/15 bg-slate-900/40 p-10 text-center shadow-2xl backdrop-blur">
          <div className="mb-4 rounded-full border border-cyan-200/30 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-100">
            Gemini Live Agent Challenge
          </div>
          <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
            Meet Cubey, Your AI Rubik&apos;s Tutor
          </h1>
          <p className="mb-8 max-w-2xl text-slate-200">
            Your AI tutor that sees your cube and talks you to victory. Real-time webcam + voice coaching with step-by-step move verification.
          </p>

          <div className="mb-8 grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl mb-2">🎥</div>
              <div className="font-semibold">Show Your Cube</div>
              <div className="text-sm text-slate-400">Position your Rubik's Cube in front of the camera</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl mb-2">🎙️</div>
              <div className="font-semibold">Talk to Cubey</div>
              <div className="text-sm text-slate-400">Voice coaching guides you through each move</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold">Challenge Mode</div>
              <div className="text-sm text-slate-400">Race against Cubey to solve the scrambled cube!</div>
            </div>
          </div>

          <button
            type="button"
            onClick={startSession}
            className="rounded-2xl bg-cyan-400 px-8 py-3 text-lg font-bold text-slate-950 shadow-lg transition hover:scale-[1.02] hover:bg-cyan-300"
          >
            Start Session
          </button>

          <a
            href="/legacy-2x2-solver/index.html"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 decoration-cyan-400/50 hover:text-cyan-200 hover:underline"
          >
            Looking for our classic 2x2 AI Solver? 🎲
          </a>
          <p className="mt-4 text-xs text-slate-400">
            Requires camera and microphone access
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(140deg,#020617_0%,#111827_40%,#1e293b_100%)] px-4 py-4 text-white sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-900/70 p-4 shadow-lg backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Gemini Rubik&apos;s Tutor</div>
            <div className="text-xl font-bold">Live Cube Coaching Session</div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => sessionRef.current?.requestHint?.()}
              className="rounded-xl border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20"
            >
              Hint
            </button>

            <button
              type="button"
              onClick={toggleChallengeMode}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${challengeMode
                ? "border-fuchsia-300/60 bg-fuchsia-500/20 text-fuchsia-100"
                : "border-slate-500/60 bg-slate-700/40 text-slate-100"
                }`}
            >
              {challengeMode ? "Challenge On" : "Challenge Mode"}
            </button>

            <button
              type="button"
              onClick={() => sessionRef.current?.solvePreview?.()}
              className="rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Solve Preview
            </button>
          </div>
        </header>

        {challengeMessage ? (
          <div className="rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-3 text-sm text-fuchsia-100">
            {challengeMessage}
          </div>
        ) : null}

        {errorText ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {errorText}
          </div>
        ) : null}

        <section className="grid min-h-[64vh] grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900/40 p-3 shadow-xl">
            <div className="h-full min-h-[360px]">
              <CubeViewer cubeState={cubeState} activeMove={activeMove} />
            </div>

            <div className="absolute right-5 top-5 h-40 w-56 sm:h-44 sm:w-64">
              <LiveSession
                ref={sessionRef}
                active={sessionActive}
                onStatusChange={setConnectionStatus}
                onMicLevel={setMicLevel}
                onTutorSpeakingChange={setIsTutorSpeaking}
                onTranscriptEntry={handleTranscriptEntry}
                onInstruction={setActiveMove}
                onCubeState={setCubeState}
                onMoveHistory={setMoveHistory}
                onHint={setHintText}
                onChallengeUpdate={(payload) => {
                  setChallengeMessage(payload.message || "");
                }}
                onError={setErrorText}
              />
            </div>
          </div>

          <TutorOverlay
            latestInstruction={latestInstruction}
            hintText={hintText}
            transcript={transcript}
          />
        </section>

        <footer className="space-y-3">
          <StatusBar
            connectionStatus={connectionStatus}
            micLevel={micLevel}
            timerSeconds={timerSeconds}
            moveCount={moveCount}
            isTutorSpeaking={isTutorSpeaking}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadSessionRecord}
              className="rounded-xl border border-slate-400/50 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-700"
            >
              Download Session JSON
            </button>

            <button
              type="button"
              onClick={endSession}
              className="rounded-xl border border-rose-400/50 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30"
            >
              End Session
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
