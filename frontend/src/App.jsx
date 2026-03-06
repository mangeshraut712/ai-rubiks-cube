import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiCamera,
  FiCommand,
  FiDownload,
  FiHelpCircle,
  FiMessageSquare,
  FiMic,
  FiMoon,
  FiPlay,
  FiRefreshCw,
  FiSettings,
  FiSun,
  FiUsers,
  FiZap
} from "react-icons/fi";

import {
  BrandWordmark,
  CapabilityCard,
  ClockMarker,
  DetailMetric,
  QuickActionButton
} from "./components/AppShellPrimitives.jsx";
import CubeViewer from "./components/CubeViewer.jsx";
import {
  HERO_CAPABILITIES,
  HERO_FACTS,
  SCRAMBLE_MOVES,
  SESSION_PROMPTS,
  VOICE_MOVE_COMMANDS
} from "./content/appContent.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useCubeStore } from "./store/cubeStore";
import { createSolvedCubeState } from "./utils/cubeColors";
import { applyMoveToState } from "./utils/cubeLogic";
import { syncDocumentTheme } from "./utils/theme.js";

const LiveSession = lazy(() => import("./components/LiveSession.jsx"));
const MultiplayerLobby = lazy(() => import("./components/MultiplayerLobby.jsx"));
const Settings = lazy(() => import("./components/Settings.jsx"));
const Statistics = lazy(() => import("./components/Statistics.jsx"));
const StatusBar = lazy(() => import("./components/StatusBar.jsx"));
const Tutorial = lazy(() => import("./components/Tutorial.jsx"));
const TutorOverlay = lazy(() => import("./components/TutorOverlay.jsx"));

function normalizeTranscriptText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function PanelFallback({
  eyebrow = "Loading",
  title = "Preparing the workspace surface.",
  className = "surface-panel p-5"
}) {
  return (
    <div className={className}>
      <div className="surface-kicker">{eyebrow}</div>
      <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{title}</div>
      <div className="mt-4 space-y-3">
        <div className="h-11 rounded-2xl bg-slate-200/80 dark:bg-white/10" />
        <div className="h-11 rounded-2xl bg-slate-200/60 dark:bg-white/5" />
        <div className="h-11 rounded-2xl bg-slate-200/40 dark:bg-white/5" />
      </div>
    </div>
  );
}

function ModalFallback() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 px-4 backdrop-blur-md">
      <PanelFallback
        eyebrow="Loading panel"
        title="Preparing the next workspace surface."
        className="surface-panel w-full max-w-lg p-6"
      />
    </div>
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
  const [promptInput, setPromptInput] = useState("");

  const moveQueueRef = useRef([]);
  const moveAnimTimerRef = useRef(null);

  useEffect(() => {
    syncDocumentTheme(isDarkMode ? "dark" : "light", settings.highContrast);
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
    setLatestInstructionLocal("Cubey is mapping the cube and preparing the first instruction.");
    setLatestInstruction("Cubey is mapping the cube and preparing the first instruction.");
    setTranscript([]);
    setHintTextLocal("");
    setHintText("");
    setChallengeMode(false);
    setChallengeMessage("");
    setTimerSeconds(0);
    setErrorText("");
    setPromptInput("");
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
    toast.success("Live coaching launched");
  }

  async function endSession() {
    const sessionDuration = startTimestamp ? Math.floor((Date.now() - startTimestamp) / 1000) : 0;

    await sessionRef.current?.endSession?.();
    setSessionActive(false);
    setConnectionStatus("disconnected");
    setIsTutorSpeaking(false);
    setPromptInput("");

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
    toast(next ? "Challenge mode enabled" : "Challenge mode disabled");
  }

  function sendPrompt(text) {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      return;
    }

    sessionRef.current?.sendUserText?.(trimmed);
    setPromptInput("");
  }

  function handlePromptSubmit(event) {
    event.preventDefault();
    sendPrompt(promptInput);
  }

  const moveCount = moveHistory.length;
  const sessionReady = connectionStatus === "connected" || connectionStatus === "demo_mode";
  const connectionLabel =
    connectionStatus === "demo_mode"
      ? "Demo live"
      : connectionStatus === "connected"
        ? "Connected"
        : connectionStatus === "connecting"
          ? "Connecting"
          : "Offline";

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "20px",
            padding: "14px 18px",
            background: "rgba(255,255,255,0.9)",
            color: "#0f172a",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.14)"
          }
        }}
      />

      <Suspense fallback={<ModalFallback />}>
        {showTutorial ? (
          <Tutorial onClose={() => setShowTutorial(false)} onComplete={() => setShowTutorial(false)} />
        ) : null}
        {showStatistics ? <Statistics onClose={() => setShowStatistics(false)} /> : null}
        {showSettings ? <Settings onClose={() => setShowSettings(false)} /> : null}
        {showMultiplayer ? <MultiplayerLobby onClose={() => setShowMultiplayer(false)} /> : null}
      </Suspense>

      {!storeSessionActive ? (
        <main className="min-h-screen px-4 pb-12 pt-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-8">
            <header className="surface-panel flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-4">
                <div className="rounded-[22px] border border-white/80 bg-white/90 px-4 py-2 shadow-sm dark:border-white/10 dark:bg-slate-950/40">
                  <div className="surface-kicker">Gemini Live Agent Challenge 2026</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    Google-inspired tutoring interface for a physical cube.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowTutorial(true)} className="surface-chip">
                  <FiHelpCircle className="h-4 w-4" />
                  Tutorial
                </button>
                <button type="button" onClick={() => setShowStatistics(true)} className="surface-chip">
                  <FiBarChart2 className="h-4 w-4" />
                  Statistics
                </button>
                <button type="button" onClick={() => setShowSettings(true)} className="surface-chip">
                  <FiSettings className="h-4 w-4" />
                  Settings
                </button>
                <button type="button" onClick={toggleDarkMode} className="surface-chip">
                  {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                  {isDarkMode ? "Light" : "Dark"}
                </button>
              </div>
            </header>

            <section className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(66,133,244,0.18)] bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-[#4285F4]" />
                  Search calm. Live coaching. Physical cube.
                </div>

                <div className="space-y-4">
                  <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.08em] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
                    <BrandWordmark className="mr-3" />
                    builds a live coaching stage around your Rubik&apos;s Cube.
                  </h1>

                  <p className="max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                    I redesigned the product like a Google Labs experiment: quiet search-page clarity,
                    layered Workspace-style panels, and one central stage for voice, vision, hints,
                    solve previews, and multiplayer.
                  </p>
                </div>

                <div className="hero-query-shell">
                  <FiMessageSquare className="h-5 w-5 text-[#4285F4]" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      “Ask the cube what to do next.”
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      The new interface uses a search-like command language instead of hiding the tutor
                      behind buttons alone.
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={startSession} className="surface-button-primary">
                    <FiPlay className="h-4 w-4" />
                    Launch live coaching
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMultiplayer(true)}
                    className="surface-button-secondary"
                  >
                    <FiUsers className="h-4 w-4" />
                    Open multiplayer lab
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {HERO_CAPABILITIES.map((item) => (
                    <CapabilityCard key={item.title} {...item} />
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/legacy-2x2-solver/index.html"
                    className="surface-chip"
                  >
                    <FiArrowRight className="h-4 w-4" />
                    Open the classic 2x2 solver
                  </a>
                  <a
                    href="https://geminiliveagentchallenge.devpost.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="surface-chip"
                  >
                    <FiArrowRight className="h-4 w-4" />
                    View the challenge page
                  </a>
                </div>
              </div>

              <div className="surface-panel relative overflow-hidden p-4 sm:p-6">
                <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(66,133,244,0.28),transparent_70%)] blur-2xl" />
                <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(52,168,83,0.18),transparent_72%)] blur-2xl" />

                <div className="relative z-10 space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="surface-kicker">Live stage preview</div>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                        A single scene for cube state, camera vision, and tutor memory.
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {HERO_FACTS.map((fact) => (
                        <div key={fact.label} className="surface-chip">
                          <span className="font-medium text-slate-500 dark:text-slate-400">{fact.label}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{fact.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                    <div className="surface-panel surface-panel--muted min-h-[420px] overflow-hidden p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="surface-kicker">Cube stage</span>
                        <span className="surface-chip">
                          <FiActivity className="h-4 w-4 text-[#4285F4]" />
                          Solved state loaded
                        </span>
                      </div>
                      <div className="h-[360px] overflow-hidden rounded-[28px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.16),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,248,255,0.9))] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.2),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.94))]">
                        <CubeViewer cubeState={cubeState} activeMove={activeMove} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <DetailMetric eyebrow="What changed" label="Landing" value="Search-first product story" />
                      <DetailMetric eyebrow="What changed" label="Session" value="Workspace-style control stage" />
                      <DetailMetric eyebrow="What changed" label="Modals" value="Unified Google Labs visual system" />
                      <DetailMetric
                        eyebrow="Designed for demos"
                        label="Core promise"
                        value="See. Speak. Solve."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      ) : (
        <main className="min-h-screen px-4 pb-10 pt-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <header className="surface-panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
              <div className="space-y-2">
                <div className="surface-kicker">Live session</div>
                <div className="flex flex-wrap items-end gap-3">
                  <h1 className="text-3xl font-semibold tracking-[-0.06em] text-slate-950 dark:text-white sm:text-4xl">
                    <BrandWordmark className="mr-2" />
                    coaching stage
                  </h1>
                  <div className="surface-chip">
                    <span className="h-2 w-2 rounded-full bg-[#4285F4]" />
                    {connectionLabel}
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  The interface is organized like a search workspace: stage on the left, tutor memory on
                  the right, and a command composer anchored under the core experience.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowTutorial(true)} className="surface-chip">
                  <FiHelpCircle className="h-4 w-4" />
                  Tutorial
                </button>
                <button type="button" onClick={() => setShowStatistics(true)} className="surface-chip">
                  <FiBarChart2 className="h-4 w-4" />
                  Statistics
                </button>
                <button type="button" onClick={() => setShowSettings(true)} className="surface-chip">
                  <FiSettings className="h-4 w-4" />
                  Settings
                </button>
                <button type="button" onClick={toggleDarkMode} className="surface-chip">
                  {isDarkMode ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                  {isDarkMode ? "Light" : "Dark"}
                </button>
              </div>
            </header>

            {challengeMessage ? (
              <div className="surface-panel border-[color:rgba(52,168,83,0.24)] bg-[rgba(236,249,240,0.82)] px-5 py-4 text-sm text-[#1f6e35] dark:bg-[rgba(22,101,52,0.2)] dark:text-green-200">
                {challengeMessage}
              </div>
            ) : null}

            {errorText ? (
              <div className="surface-panel border-[color:rgba(234,67,53,0.24)] bg-[rgba(255,241,240,0.82)] px-5 py-4 text-sm text-[#8a2c21] dark:bg-[rgba(127,29,29,0.28)] dark:text-red-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{errorText}</span>
                  {isLocalEnvironment ? (
                    <button type="button" onClick={retrySessionConnection} className="surface-chip">
                      <FiRefreshCw className="h-4 w-4" />
                      Retry backend
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_400px]">
              <div className="space-y-6">
                <section className="surface-panel overflow-hidden p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="surface-kicker">Primary stage</div>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                        Camera lens, tutor brain, and cube state on one plane.
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="surface-chip">
                        <ClockMarker />
                        {formatDuration(timerSeconds)}
                      </div>
                      <div className="surface-chip">
                        <FiCommand className="h-4 w-4" />
                        {moveCount} moves
                      </div>
                      <div className="surface-chip">
                        <FiMic className="h-4 w-4" />
                        Mic {Math.round(Math.min(100, micLevel * 250))}%
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
                    <div className="surface-panel surface-panel--muted relative min-h-[620px] overflow-hidden p-3">
                      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.22),transparent_60%)]" />
                      <div className="absolute bottom-[-80px] right-[-40px] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(251,188,5,0.18),transparent_65%)] blur-2xl" />

                      <div className="relative z-10 h-full">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                          <div className="surface-chip">
                            <span className="h-2 w-2 rounded-full bg-[#34A853]" />
                            Search-calm stage
                          </div>
                          <div className="surface-chip">
                            <FiCamera className="h-4 w-4 text-[#4285F4]" />
                            Vision feed floating in context
                          </div>
                        </div>

                        <div className="h-[540px] overflow-hidden rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.12),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,247,255,0.92))] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.16),transparent_46%),linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))]">
                          <CubeViewer cubeState={cubeState} activeMove={activeMove} />
                        </div>

                        <div className="pointer-events-none absolute right-4 top-16 h-[190px] w-[290px] max-w-[46%] rounded-[28px] border border-white/70 bg-[rgba(255,255,255,0.64)] p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur-2xl dark:border-white/10 dark:bg-[rgba(2,6,23,0.64)]">
                          <div className="pointer-events-auto h-full overflow-hidden rounded-[22px] border border-white/80 bg-white/30 dark:border-white/10 dark:bg-black/20">
                            <Suspense
                              fallback={
                                <PanelFallback
                                  eyebrow="Live session"
                                  title="Loading camera, mic, and tutor transport."
                                  className="flex h-full flex-col justify-center p-4"
                                />
                              }
                            >
                              <LiveSession
                                ref={sessionRef}
                                active={storeSessionActive}
                                onStatusChange={setConnectionStatus}
                                onMicLevel={setMicLevel}
                                onTutorSpeakingChange={setIsTutorSpeaking}
                                onTranscriptEntry={handleTranscriptEntry}
                                onInstruction={enqueueMove}
                                onCubeState={setCubeState}
                                onMoveHistory={(_history) => {}}
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
                            </Suspense>
                          </div>
                        </div>
                      </div>
                    </div>

                    <aside className="space-y-4">
                      <DetailMetric eyebrow="Current instruction" label="Cubey says" value={latestInstruction || "Show the cube to begin."} />
                      <QuickActionButton
                        icon={FiHelpCircle}
                        label="Request a hint"
                        description="Ask for the next helpful move without leaving the flow."
                        onClick={() => sessionRef.current?.requestHint?.()}
                        tone="yellow"
                      />
                      <QuickActionButton
                        icon={FiActivity}
                        label={challengeMode ? "Challenge mode enabled" : "Challenge mode"}
                        description="Turn practice into a race against the tutor."
                        onClick={toggleChallengeMode}
                        tone={challengeMode ? "green" : "default"}
                      />
                      <QuickActionButton
                        icon={FiZap}
                        label="Solve preview"
                        description="See the tutor's predicted solution path before committing."
                        onClick={() => sessionRef.current?.solvePreview?.()}
                        tone="blue"
                      />
                      <QuickActionButton
                        icon={FiArrowRight}
                        label={autoSolving ? "Auto-solving…" : "Auto solve"}
                        description="Let Cubey take the current state to solved automatically."
                        onClick={handleAutoSolve}
                        tone="green"
                        disabled={autoSolving}
                      />
                      <QuickActionButton
                        icon={FiRefreshCw}
                        label="Scramble or reset"
                        description="Use the lab controls to stress-test the tutor with new states."
                        onClick={handleScramble}
                      />
                      <QuickActionButton
                        icon={FiCommand}
                        label="Undo last move"
                        description="Keep the conversation going without losing your place."
                        onClick={handleUndo}
                        tone="default"
                      />
                    </aside>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="surface-panel px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="surface-kicker">Command composer</div>
                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                          Type to Cubey like a search query.
                        </h2>
                      </div>
                      <div className="surface-chip">
                        <FiMessageSquare className="h-4 w-4 text-[#4285F4]" />
                        Text + voice together
                      </div>
                    </div>

                    <form onSubmit={handlePromptSubmit} className="mt-5 space-y-4">
                      <div className="search-composer">
                        <FiMessageSquare className="h-5 w-5 text-slate-400" />
                        <input
                          type="text"
                          value={promptInput}
                          onChange={(event) => setPromptInput(event.target.value)}
                          disabled={!sessionReady}
                          placeholder={
                            sessionReady
                              ? "Ask Cubey to explain the current state, speed up the algorithm, or coach your next move."
                              : "Wait for the connection, then talk or type to Cubey."
                          }
                          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed dark:text-white dark:placeholder:text-slate-500"
                        />
                        <button type="submit" className="surface-button-primary" disabled={!sessionReady}>
                          Send
                          <FiArrowRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {SESSION_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => sendPrompt(prompt)}
                            disabled={!sessionReady}
                            className="surface-chip disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </form>
                  </div>

                  <Suspense
                    fallback={
                      <PanelFallback
                        eyebrow="System strip"
                        title="Loading connection and audio diagnostics."
                        className="surface-panel surface-panel--muted px-4 py-4"
                      />
                    }
                  >
                    <StatusBar
                      connectionStatus={connectionStatus}
                      micLevel={micLevel}
                      timerSeconds={timerSeconds}
                      moveCount={moveCount}
                      isTutorSpeaking={isTutorSpeaking}
                      isThinking={isThinking}
                    />
                  </Suspense>
                </section>
              </div>

              <Suspense
                fallback={
                  <PanelFallback
                    eyebrow="Tutor memory"
                    title="Loading transcript and answer memory."
                    className="surface-panel h-full min-h-[720px] p-5"
                  />
                }
              >
                <TutorOverlay
                  latestInstruction={latestInstruction}
                  hintText={hintText}
                  transcript={transcript}
                  connectionStatus={connectionStatus}
                  errorText={errorText}
                  isLocalEnvironment={isLocalEnvironment}
                />
              </Suspense>
            </section>

            <footer className="surface-panel flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={downloadSessionRecord} className="surface-button-secondary">
                  <FiDownload className="h-4 w-4" />
                  Download session JSON
                </button>
                <button type="button" onClick={handleReset} className="surface-button-secondary">
                  <FiRefreshCw className="h-4 w-4" />
                  Reset cube
                </button>
                <button type="button" onClick={handleRedo} className="surface-button-secondary">
                  <FiArrowRight className="h-4 w-4" />
                  Redo move
                </button>
              </div>

              <button type="button" onClick={endSession} className="surface-button-danger">
                End live session
              </button>
            </footer>
          </div>
        </main>
      )}
    </>
  );
}
