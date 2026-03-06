import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { FiBarChart2, FiHelpCircle, FiMoon, FiSettings, FiSun, FiUsers } from "react-icons/fi";

import LiveSession from "./components/LiveSession";
import MultiplayerLobby from "./components/MultiplayerLobby";
import Settings from "./components/Settings";
import Statistics from "./components/Statistics";
import StatusBar from "./components/StatusBar";
import Tutorial from "./components/Tutorial";
import TutorOverlay from "./components/TutorOverlay";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useCubeStore } from "./store/cubeStore";
import { createSolvedCubeState } from "./utils/cubeColors";
import { applyMoveToState } from "./utils/cubeLogic";

import CubeViewer from "./components/CubeViewer.jsx";
const SCRAMBLE_MOVES = ["U", "U'", "D", "D'", "L", "L'", "R", "R'", "F", "F'", "B", "B'"];
const VOICE_MOVE_COMMANDS = new Set([
  "U",
  "U'",
  "U2",
  "D",
  "D'",
  "D2",
  "L",
  "L'",
  "L2",
  "R",
  "R'",
  "R2",
  "F",
  "F'",
  "F2",
  "B",
  "B'",
  "B2"
]);
const HERO_FEATURES = [
  {
    title: "Show Your Cube",
    desc: "Position your Rubik's Cube in front of the camera",
    emoji: "🎥",
    titleClassName: "text-[#1f3a68] dark:text-blue-300",
    bodyClassName: "text-[#4d648c] dark:text-blue-200",
    cardClassName:
      "border-[#c9ddff] bg-[#edf4ff] shadow-[0_10px_20px_rgba(66,133,244,0.12)] dark:border-blue-800 dark:bg-blue-900/20"
  },
  {
    title: "Talk to Cubey",
    desc: "Voice coaching guides you through each move",
    emoji: "🎙️",
    titleClassName: "text-[#7a2d24] dark:text-red-300",
    bodyClassName: "text-[#8a4d46] dark:text-red-200",
    cardClassName:
      "border-[#f9ceca] bg-[#fff1f0] shadow-[0_10px_20px_rgba(234,67,53,0.12)] dark:border-red-800 dark:bg-red-900/20"
  },
  {
    title: "Challenge Mode",
    desc: "Race against Cubey to solve the scrambled cube",
    emoji: "🏆",
    titleClassName: "text-[#6a5413] dark:text-yellow-300",
    bodyClassName: "text-[#7e6a2f] dark:text-yellow-200",
    cardClassName:
      "border-[#f8df9a] bg-[#fff9e6] shadow-[0_10px_20px_rgba(251,188,4,0.14)] dark:border-yellow-800 dark:bg-yellow-900/20"
  }
];

function normalizeTranscriptText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function GoogleLogo() {
  return (
    <span className="google-wordmark">
      <span>G</span>
      <span>e</span>
      <span>m</span>
      <span>i</span>
      <span>n</span>
      <span>i</span>
    </span>
  );
}

export default function App() {
  const sessionRef = useRef(null);
  const isLocalEnvironment =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const {
    cubeState,
    moveHistory,
    sessionActive: storeSessionActive,
    isDarkMode,
    settings,
    setCubeState,
    applyMove,
    undoMove,
    redoMove,
    resetCube,
    setSessionActive,
    setActiveMove,
    setHintText,
    setLatestInstruction,
    toggleDarkMode,
    recordSessionComplete
  } = useCubeStore();

  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [micLevel, setMicLevel] = useState(0);
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);
  const [latestInstruction, setLatestInstructionLocal] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [hintText, setHintTextLocal] = useState("");
  const [challengeMode, setChallengeMode] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [errorText, setErrorText] = useState("");
  const [startTimestamp, setStartTimestamp] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [autoSolving, setAutoSolving] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [activeMove, setActiveMoveLocal] = useState("");

  const moveQueueRef = useRef([]);
  const moveAnimTimerRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", Boolean(isDarkMode));
    root.classList.toggle("high-contrast", Boolean(settings.highContrast));
  }, [isDarkMode, settings.highContrast]);

  useEffect(
    () => () => {
      if (moveAnimTimerRef.current) {
        clearTimeout(moveAnimTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!storeSessionActive || !startTimestamp) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTimestamp) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [storeSessionActive, startTimestamp]);

  const triggerHapticFeedback = useCallback(
    (duration = 50) => {
      if (
        !settings.hapticsEnabled ||
        typeof window === "undefined" ||
        typeof navigator.vibrate !== "function"
      ) {
        return;
      }
      navigator.vibrate(duration);
    },
    [settings.hapticsEnabled]
  );

  const handleMove = useCallback(
    (move) => {
      if (!move || autoSolving) {
        return;
      }

      try {
        setActiveMoveLocal(move);
        setActiveMove(move);
        setCubeState(applyMoveToState(cubeState, move));
        applyMove(move, "user");

        if (moveAnimTimerRef.current) {
          clearTimeout(moveAnimTimerRef.current);
        }
        moveAnimTimerRef.current = window.setTimeout(
          () => setActiveMoveLocal(""),
          settings.animationSpeed || 420
        );

        triggerHapticFeedback();
      } catch (_error) {
        toast.error("Invalid move");
      }
    },
    [
      applyMove,
      autoSolving,
      cubeState,
      setActiveMove,
      setCubeState,
      settings.animationSpeed,
      triggerHapticFeedback
    ]
  );

  const handleUndo = useCallback(() => {
    const move = undoMove();
    if (move?.stateBefore) {
      setCubeState(move.stateBefore);
      toast.success("Undo");
    }
  }, [setCubeState, undoMove]);

  const handleRedo = useCallback(() => {
    const move = redoMove();
    if (move) {
      setCubeState(applyMoveToState(cubeState, move.move));
      toast.success("Redo");
    }
  }, [cubeState, redoMove, setCubeState]);

  const handleScramble = useCallback(() => {
    const scramble = Array.from(
      { length: 20 },
      () => SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)]
    );
    let currentState = createSolvedCubeState();
    scramble.forEach((move) => {
      currentState = applyMoveToState(currentState, move);
    });
    setCubeState(currentState);
    toast.success("Cube scrambled!");
  }, [setCubeState]);

  const handleReset = useCallback(() => {
    resetCube();
    toast.success("Cube reset");
  }, [resetCube]);

  useKeyboardShortcuts({
    onMove: handleMove,
    onScramble: handleScramble,
    onReset: handleReset,
    onUndo: handleUndo,
    onRedo: handleRedo,
    onHint: () => sessionRef.current?.requestHint?.(),
    onToggleChallenge: toggleChallengeMode,
    onToggleDarkMode: toggleDarkMode,
    onToggleSettings: () => setShowSettings(true),
    onStartSession: () => !storeSessionActive && startSession(),
    onEndSession: () => storeSessionActive && endSession()
  });

  useVoiceCommands({
    onCommand: (command) => {
      if (command === "RESET") {
        handleReset();
      } else if (command === "SCRAMBLE") {
        handleScramble();
      } else if (command === "UNDO") {
        handleUndo();
      } else if (command === "REDO") {
        handleRedo();
      } else if (command === "HINT") {
        sessionRef.current?.requestHint?.();
      } else if (VOICE_MOVE_COMMANDS.has(command)) {
        handleMove(command);
      }
    },
    enabled: settings.voiceEnabled !== false && storeSessionActive
  });

  function resetSessionUiState() {
    setConnectionStatus("connecting");
    setActiveMoveLocal("");
    setMicLevel(0);
    setIsTutorSpeaking(false);
    setIsThinking(false);
    setLatestInstructionLocal("Cubey is getting ready...");
    setLatestInstruction("Cubey is getting ready...");
    setTranscript([]);
    setHintTextLocal("");
    setHintText("");
    setChallengeMode(false);
    setChallengeMessage("");
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
    toast.success("Session started!");
  }

  async function endSession() {
    const sessionDuration = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;

    await sessionRef.current?.endSession?.();
    setSessionActive(false);
    setConnectionStatus("disconnected");
    setIsTutorSpeaking(false);

    if (sessionDuration > 0) {
      recordSessionComplete(sessionDuration, moveHistory.length);
    }

    toast.success("Session ended");
  }

  async function retrySessionConnection() {
    setErrorText("");
    setConnectionStatus("connecting");
    await sessionRef.current?.retryConnection?.();
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
      setLatestInstructionLocal(entry.text);
      setLatestInstruction(entry.text);
    }
  }

  function enqueueMove(move) {
    if (!move) {
      return;
    }
    moveQueueRef.current.push(move);
    drainMoveQueue();
  }

  function drainMoveQueue() {
    if (moveAnimTimerRef.current || moveQueueRef.current.length === 0) {
      return;
    }

    const next = moveQueueRef.current.shift();
    setActiveMoveLocal(next);
    setActiveMove(next);

    moveAnimTimerRef.current = window.setTimeout(() => {
      moveAnimTimerRef.current = null;
      if (moveQueueRef.current.length > 0) {
        drainMoveQueue();
      } else {
        setActiveMoveLocal("");
      }
    }, settings.animationSpeed || 420);
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

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `rubiks-session-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    toast.success("Session record downloaded");
  }

  function toggleChallengeMode() {
    const next = !challengeMode;
    setChallengeMode(next);
    sessionRef.current?.setChallengeMode?.(next);
    toast(next ? "Challenge mode enabled!" : "Challenge mode disabled");
  }

  const moveCount = moveHistory.length;

  return (
    <>
      <Toaster position="top-right" />

      {showTutorial ? (
        <Tutorial onClose={() => setShowTutorial(false)} onComplete={() => setShowTutorial(false)} />
      ) : null}
      {showStatistics ? <Statistics onClose={() => setShowStatistics(false)} /> : null}
      {showSettings ? <Settings onClose={() => setShowSettings(false)} /> : null}
      {showMultiplayer ? <MultiplayerLobby onClose={() => setShowMultiplayer(false)} /> : null}

      {!storeSessionActive ? (
        <main className="min-h-screen px-6 py-10 text-[#202124] dark:text-white">
          <div className="mx-auto flex min-h-[84vh] max-w-5xl flex-col items-center justify-center rounded-3xl border border-[#d2d8e3] bg-white/95 p-10 text-center shadow-[0_18px_40px_rgba(32,33,36,0.16)] backdrop-blur dark:border-slate-700 dark:bg-slate-800/95">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d2d8e3] bg-[#f8faff] px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6368] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4285f4]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ea4335]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fbbc04]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#34a853]" />
              Gemini Live Agent Challenge 2026
            </div>

            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Meet <GoogleLogo /> Rubik&apos;s Tutor
            </h1>

            <p className="mb-8 max-w-2xl text-[#5f6368] dark:text-gray-300">
              Your AI tutor that sees your cube and talks you to victory. Real-time webcam + voice
              coaching with step-by-step move verification.
            </p>

            <div className="mb-8 grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
              {HERO_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className={`rounded-2xl border p-4 ${feature.cardClassName}`}
                >
                  <div className="mb-2 text-2xl">{feature.emoji}</div>
                  <div className={`font-semibold ${feature.titleClassName}`}>{feature.title}</div>
                  <div className={`text-sm ${feature.bodyClassName}`}>{feature.desc}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={startSession}
                className="rounded-2xl border border-[#2f6ee3] bg-[#4285f4] px-8 py-3 text-lg font-bold text-white shadow-[0_10px_20px_rgba(66,133,244,0.35)] transition hover:-translate-y-0.5 hover:bg-[#3878e8]"
              >
                Start Session
              </button>

              <button
                type="button"
                onClick={() => setShowMultiplayer(true)}
                className="rounded-2xl border border-purple-500 bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-3 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                <FiUsers className="mr-2 inline" />
                Multiplayer
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowTutorial(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#5f6368] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <FiHelpCircle />
                Tutorial
              </button>

              <button
                type="button"
                onClick={() => setShowStatistics(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#5f6368] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <FiBarChart2 />
                Statistics
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#5f6368] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <FiSettings />
                Settings
              </button>

              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-[#5f6368] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                {isDarkMode ? <FiSun /> : <FiMoon />}
                {isDarkMode ? "Light" : "Dark"}
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <a
                href="/legacy-2x2-solver/index.html"
                className="flex items-center justify-center gap-2 text-sm text-[#5f6368] decoration-[#4285f4]/60 hover:text-[#1a73e8] hover:underline dark:text-gray-400"
              >
                Looking for our classic 2x2 AI Solver? 🎲
              </a>

              <div className="flex items-center gap-4 text-xs text-[#5f6368] dark:text-gray-400">
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
                  Gemini Live Agent Entry 2026
                </a>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="min-h-screen px-4 py-4 text-[#202124] dark:text-white sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4">
            <header className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[0_8px_32px_rgba(32,33,36,0.06)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5f6368] dark:text-gray-400">
                  <span className="gemini-text-gradient">✦</span> Gemini Rubik&apos;s Tutor
                </div>
                <div className="text-[1.2rem] font-bold text-[#202124] dark:text-white">
                  Live Cube Coaching Session
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => sessionRef.current?.requestHint?.()}
                  className="rounded-[12px] border border-[#fbbc04]/30 bg-[#fbbc04]/10 px-4 py-2 text-[13px] font-bold text-[#8f6a00] shadow-sm transition hover:bg-[#fbbc04]/20 dark:text-yellow-400"
                  aria-label="Request solving hint"
                >
                  Hint
                </button>

                <button
                  type="button"
                  onClick={toggleChallengeMode}
                  className={`rounded-[12px] border px-4 py-2 text-[13px] font-bold shadow-sm transition ${challengeMode
                    ? "border-[#34a853]/30 bg-[#34a853]/10 text-[#1f6e35] dark:text-green-400"
                    : "border-[#e8eaed] bg-white text-[#5f6368] hover:bg-[#f8f9fa] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                    }`}
                  aria-label="Toggle challenge mode"
                >
                  {challengeMode ? "Challenge On" : "Challenge Mode"}
                </button>

                <button
                  type="button"
                  onClick={() => sessionRef.current?.solvePreview?.()}
                  className="rounded-[12px] border border-[#4285f4]/30 bg-[#4285f4]/10 px-4 py-2 text-[13px] font-bold text-[#1a73e8] shadow-sm transition hover:bg-[#4285f4]/20 dark:text-blue-400"
                  aria-label="Preview AI solving path"
                >
                  Solve Preview
                </button>

                <button
                  type="button"
                  onClick={handleAutoSolve}
                  disabled={autoSolving}
                  className={`rounded-[12px] border px-4 py-2 text-[13px] font-bold shadow-sm transition ${autoSolving
                    ? "animate-pulse cursor-wait border-[#34a853]/30 bg-[#34a853]/10 text-[#1f6e35]"
                    : "border-[#34a853]/50 bg-[#34a853]/20 text-[#1f6e35] hover:bg-[#34a853]/30 dark:text-green-400"
                    }`}
                  aria-label="Start automatic solve mode"
                >
                  {autoSolving ? "⏳ Solving..." : "✨ Auto Solve"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="rounded-[12px] border border-gray-300 bg-white px-4 py-2 text-[13px] font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
                  aria-label="Open settings"
                >
                  <FiSettings />
                </button>
              </div>
            </header>

            {challengeMessage ? (
              <div className="rounded-xl border border-[#9cd7ad] bg-[#ecf9f0] p-3 text-sm text-[#1f6e35] shadow-[0_6px_16px_rgba(52,168,83,0.12)] dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                {challengeMessage}
              </div>
            ) : null}

            {errorText ? (
              <div className="rounded-xl border border-[#f2bbb4] bg-[#fff1f0] p-3 text-sm text-[#7a2d24] shadow-[0_6px_16px_rgba(234,67,53,0.12)] dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{errorText}</span>
                  {isLocalEnvironment ? (
                    <button
                      type="button"
                      onClick={retrySessionConnection}
                      className="rounded-lg border border-[#ea4335]/25 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#ea4335] hover:bg-white dark:bg-red-950/20 dark:hover:bg-red-950/40"
                    >
                      Retry
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <section className="grid min-h-[64vh] grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
              <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-white/60 bg-white/70 p-3 shadow-[0_8px_32px_rgba(32,33,36,0.08)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/70">
                <div className="h-full min-h-[360px] overflow-hidden rounded-[18px]">
                  <CubeViewer cubeState={cubeState} activeMove={activeMove} />
                </div>

                <div className="absolute right-5 top-5 h-40 w-56 rounded-[22px] border border-white/60 bg-white/50 p-1.5 shadow-[0_8px_24px_rgba(32,33,36,0.12)] backdrop-blur-2xl sm:h-44 sm:w-64 dark:border-slate-600 dark:bg-slate-700/50">
                  <LiveSession
                    ref={sessionRef}
                    active={storeSessionActive}
                    onStatusChange={setConnectionStatus}
                    onMicLevel={setMicLevel}
                    onTutorSpeakingChange={setIsTutorSpeaking}
                    onTranscriptEntry={handleTranscriptEntry}
                    onInstruction={enqueueMove}
                    onCubeState={setCubeState}
                    onMoveHistory={(_history) => { }}
                    onHint={(hint) => {
                      setHintTextLocal(hint);
                      setHintText(hint);
                    }}
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
                connectionStatus={connectionStatus}
                errorText={errorText}
                isLocalEnvironment={isLocalEnvironment}
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
                  className="rounded-[12px] border border-white/60 bg-white/70 px-5 py-2.5 text-[12px] font-bold tracking-wide text-[#5f6368] shadow-sm backdrop-blur-md transition hover:bg-white dark:border-slate-600 dark:bg-slate-700/70 dark:text-gray-300 dark:hover:bg-slate-600"
                >
                  DOWNLOAD SESSION JSON
                </button>

                <button
                  type="button"
                  onClick={endSession}
                  className="rounded-[12px] border border-[#ea4335]/30 bg-[#ea4335]/10 px-5 py-2.5 text-[12px] font-bold tracking-wide text-[#ea4335] shadow-sm backdrop-blur-md transition hover:bg-[#ea4335]/20 dark:text-red-400"
                >
                  END SESSION
                </button>
              </div>
            </footer>
          </div>
        </main>
      )}
    </>
  );
}
