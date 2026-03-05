/**
 * Gemini Rubik's Tutor - Ultra-Polished Frontend
 * 2026: Professional Google-inspired design with ice cube aesthetic 🧊
 */
import { Suspense, lazy, useEffect, useRef, useState, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  FiSettings,
  FiBarChart2,
  FiHelpCircle,
  FiUsers,
  FiMic,
  FiVideo,
  FiAward,
  FiZap,
  FiClock,
  FiArrowRight,
  FiPlay,
  FiGrid,
  FiMoon,
  FiSun
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

import LiveSession from "./components/LiveSession";
import StatusBar from "./components/StatusBar";
import TutorOverlay from "./components/TutorOverlay";
import Tutorial from "./components/Tutorial";
import Statistics from "./components/Statistics";
import Settings from "./components/Settings";
import MultiplayerLobby from "./components/MultiplayerLobby";
import { useCubeStore } from "./store/cubeStore";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { createSolvedCubeState } from "./utils/cubeColors";
import { applyMoveToState } from "./utils/cubeLogic";

const CubeViewer = lazy(() => import("./components/CubeViewer"));
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
const LANDING_NAV_ITEMS = [
  { icon: FiHelpCircle, label: "Tutorial", action: "tutorial" },
  { icon: FiBarChart2, label: "Statistics", action: "statistics" },
  { icon: FiSettings, label: "Settings", action: "settings" }
];
const HERO_FEATURES = [
  {
    icon: FiVideo,
    title: "Show Your Cube",
    desc: "Position your Rubik's Cube in front of the camera",
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
    shadow: "shadow-blue-500/10"
  },
  {
    icon: FiMic,
    title: "Talk to Cubey",
    desc: "Voice coaching guides you through each move",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    shadow: "shadow-red-500/10"
  },
  {
    icon: FiAward,
    title: "Challenge Mode",
    desc: "Race against Cubey to solve the scrambled cube",
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    shadow: "shadow-green-500/10"
  }
];
const TECH_STACK_BADGES = [
  { icon: FiZap, label: "AI-Powered" },
  { icon: FiGrid, label: "WebRTC" },
  { icon: FiClock, label: "WebAssembly" },
  { icon: FiMic, label: "Voice Control" }
];

function normalizeTranscriptText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Animated Google Logo Component
function GoogleLogo() {
  return (
    <span className="inline-flex font-bold tracking-tight">
      <span className="text-[#4285f4]">G</span>
      <span className="text-[#ea4335]">e</span>
      <span className="text-[#fbbc04]">m</span>
      <span className="text-[#4285f4]">i</span>
      <span className="text-[#34a853]">n</span>
      <span className="text-[#ea4335]">i</span>
    </span>
  );
}

export default function App() {
  const sessionRef = useRef(null);

  const {
    cubeState,
    moveHistory,
    sessionActive: storeSessionActive,
    settings,
    isDarkMode,
    tutorialCompleted,
    setCubeState,
    applyMove,
    undoMove,
    redoMove,
    resetCube,
    setSessionActive,
    setActiveMove,
    setHintText,
    setLatestInstruction,
    recordSessionComplete,
    toggleDarkMode,
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

  const openPanel = useCallback((panel) => {
    if (panel === "tutorial") {
      setShowTutorial(true);
      return;
    }
    if (panel === "statistics") {
      setShowStatistics(true);
      return;
    }
    if (panel === "settings") {
      setShowSettings(true);
    }
  }, []);

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
    if (!storeSessionActive || !startTimestamp) return;
    const interval = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTimestamp) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [storeSessionActive, startTimestamp]);

  useEffect(() => {
    if (!tutorialCompleted && !storeSessionActive) {
      setShowTutorial(true);
    }
  }, [tutorialCompleted, storeSessionActive]);

  const handleMove = useCallback((move) => {
    if (!move || autoSolving) return;
    try {
      setActiveMoveLocal(move);
      setActiveMove(move);
      const newState = applyMoveToState(cubeState, move);
      setCubeState(newState);
      applyMove(move, "user");

      if (moveAnimTimerRef.current) clearTimeout(moveAnimTimerRef.current);
      moveAnimTimerRef.current = setTimeout(() => setActiveMoveLocal(""), settings.animationSpeed || 420);

      triggerHapticFeedback();
    } catch (_error) {
      toast.error("Invalid move");
    }
  }, [cubeState, autoSolving, settings.animationSpeed, setCubeState, applyMove, setActiveMove, triggerHapticFeedback]);

  const handleUndo = useCallback(() => {
    const move = undoMove();
    if (move?.stateBefore) {
      setCubeState(move.stateBefore);
      toast.success("Undo");
    }
  }, [undoMove, setCubeState]);

  const handleRedo = useCallback(() => {
    const move = redoMove();
    if (move) {
      setCubeState(applyMoveToState(cubeState, move.move));
      toast.success("Redo");
    }
  }, [redoMove, cubeState, setCubeState]);

  const handleScramble = useCallback(() => {
    const scramble = Array.from({ length: 20 }, () => SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)]);
    let currentState = createSolvedCubeState();
    scramble.forEach(move => { currentState = applyMoveToState(currentState, move); });
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
      if (command === "RESET") handleReset();
      else if (command === "SCRAMBLE") handleScramble();
      else if (command === "UNDO") handleUndo();
      else if (command === "REDO") handleRedo();
      else if (command === "HINT") sessionRef.current?.requestHint?.();
      else if (VOICE_MOVE_COMMANDS.has(command)) handleMove(command);
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
    if (sessionDuration > 0) recordSessionComplete(sessionDuration, moveHistory.length);
    toast.success("Session ended");
  }

  function handleTranscriptEntry(entry) {
    if (!entry?.text) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      const isDuplicate = entry.speaker === "cubey" && last?.speaker === "cubey" &&
        normalizeTranscriptText(last.text) === normalizeTranscriptText(entry.text);
      if (isDuplicate) return prev;
      return [...prev, entry];
    });
    if (entry.speaker === "cubey") {
      setLatestInstructionLocal(entry.text);
      setLatestInstruction(entry.text);
    }
  }

  function enqueueMove(move) {
    if (!move) return;
    moveQueueRef.current.push(move);
    drainMoveQueue();
  }

  function drainMoveQueue() {
    if (moveAnimTimerRef.current || moveQueueRef.current.length === 0) return;
    const next = moveQueueRef.current.shift();
    setActiveMoveLocal(next);
    setActiveMove(next);
    moveAnimTimerRef.current = setTimeout(() => {
      moveAnimTimerRef.current = null;
      if (moveQueueRef.current.length > 0) drainMoveQueue();
      else setActiveMoveLocal("");
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
    const a = document.createElement("a");
    a.href = url;
    a.download = `rubiks-session-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Session record downloaded");
  }

  function toggleChallengeMode() {
    const next = !challengeMode;
    setChallengeMode(next);
    sessionRef.current?.setChallengeMode?.(next);
    toast(next ? "Challenge mode enabled!" : "Challenge mode disabled");
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: "#fff", border: "1px solid #e8eaed", borderRadius: "8px" } }}
      />

      <AnimatePresence mode="wait">
        {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} onComplete={() => setShowTutorial(false)} />}
        {showStatistics && <Statistics onClose={() => setShowStatistics(false)} />}
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        {showMultiplayer && <MultiplayerLobby onClose={() => setShowMultiplayer(false)} />}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!storeSessionActive ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen mesh-gradient-bg flex flex-col"
          >
            {/* Navbar */}
            <nav className="sticky top-0 z-50 glass-effect border-b border-gray-200 dark:border-gray-800" aria-label="Primary">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <span className="text-2xl">🧊</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Cube Solver</span>
                  </div>

                  <div className="hidden md:flex items-center gap-1">
                    {LANDING_NAV_ITEMS.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => openPanel(item.action)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                        aria-label={`Open ${item.label}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />
                    <button
                      onClick={toggleDarkMode}
                      className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Toggle dark mode"
                    >
                      {isDarkMode ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="md:hidden border-t border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
                  {LANDING_NAV_ITEMS.map((item) => (
                    <button
                      key={`mobile-${item.label}`}
                      onClick={() => openPanel(item.action)}
                      className="inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100"
                      aria-label={`Open ${item.label}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-full">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Gemini Live Agent Challenge 2026</span>
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Meet <GoogleLogo /> Rubik&apos;s Tutor
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Your AI tutor that sees your cube and talks you to victory.
                    Real-time webcam + voice coaching with step-by-step move verification.
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                {HERO_FEATURES.map((feature, idx) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx + 0.3 }}
                    className={`group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border ${feature.border} dark:border-gray-700 p-6 hover:shadow-xl ${feature.shadow} transition-all duration-300 hover:-translate-y-1`}
                  >
                    <div className={`w-14 h-14 ${feature.bg} dark:bg-opacity-20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-7 h-7 ${feature.text}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <button
                  onClick={startSession}
                  className="group flex items-center gap-2 px-8 py-4 bg-[#4285f4] text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
                  aria-label="Start new tutoring session"
                >
                  <FiPlay className="w-5 h-5" />
                  Start Session
                  <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setShowMultiplayer(true)}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all"
                  aria-label="Open multiplayer mode"
                >
                  <FiUsers className="w-5 h-5" />
                  Multiplayer
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {TECH_STACK_BADGES.map((tech) => (
                  <span
                    key={tech.label}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full transition-colors cursor-default"
                  >
                    <tech.icon className="w-4 h-4" />
                    {tech.label}
                  </span>
                ))}
              </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <a
                    href="/legacy-2x2-solver/index.html"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <span>🎲</span>
                    <span className="font-medium">Looking for our classic 2×2 AI Solver?</span>
                  </a>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <a href="https://devpost.com/mbr63drexel" target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                      Made by Mangesh Raut
                    </a>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <a href="https://geminiliveagentchallenge.devpost.com/" target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                      Gemini Live Agent Entry 2026
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </motion.div>
        ) : (
          <motion.div
            key="session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen mesh-gradient-bg flex flex-col"
          >
            {/* Header */}
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🧊</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {"Gemini Rubik's Tutor"}
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">Live Session</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button onClick={() => sessionRef.current?.requestHint?.()} className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors" aria-label="Request solving hint">
                    Hint
                  </button>
                  <button onClick={toggleChallengeMode} className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${challengeMode ? "text-green-700 bg-green-50 border-green-200" : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50"}`} aria-label="Toggle challenge mode">
                    {challengeMode ? "Challenge On" : "Challenge"}
                  </button>
                  <button onClick={() => sessionRef.current?.solvePreview?.()} className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors" aria-label="Preview AI solving path">
                    Preview
                  </button>
                  <button onClick={handleAutoSolve} disabled={autoSolving} className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${autoSolving ? "text-green-700 bg-green-50 border-green-200 animate-pulse" : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"}`} aria-label="Start automatic solve mode">
                    {autoSolving ? "⏳ Solving..." : "✨ Auto Solve"}
                  </button>
                  <button onClick={() => setShowSettings(true)} className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" aria-label="Open settings">
                    <FiSettings className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-4 flex-1">
              {challengeMessage && (
                <div className="mb-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-sm">{challengeMessage}</div>
                </div>
              )}
              {errorText && (
                <div className="mb-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm">{errorText}</div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-4 h-full">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 min-h-[420px]"
                >
                  <div className="h-full min-h-[360px] rounded-lg overflow-hidden bg-gray-50/50 dark:bg-gray-900/30">
                    <Suspense fallback={<div className="flex h-full items-center justify-center text-gray-500"><div className="spinner mr-3"></div>Loading 3D cube...</div>}>
                      <CubeViewer cubeState={cubeState} activeMove={activeMove} />
                    </Suspense>
                  </div>

                  {/* Camera PIP */}
                  <div className="mt-3 h-40 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-hidden lg:mt-0 lg:absolute lg:right-6 lg:top-6 lg:w-56">
                    <LiveSession
                      ref={sessionRef}
                      active={storeSessionActive}
                      onStatusChange={setConnectionStatus}
                      onMicLevel={setMicLevel}
                      onTutorSpeakingChange={setIsTutorSpeaking}
                      onTranscriptEntry={handleTranscriptEntry}
                      onInstruction={enqueueMove}
                      onCubeState={setCubeState}
                      onMoveHistory={() => { }}
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
                </motion.div>

                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <TutorOverlay latestInstruction={latestInstruction} hintText={hintText} transcript={transcript} />
                </motion.div>
              </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 py-4 w-full">
              <StatusBar
                connectionStatus={connectionStatus}
                micLevel={micLevel}
                timerSeconds={timerSeconds}
                moveCount={moveHistory.length}
                isTutorSpeaking={isTutorSpeaking}
                isThinking={isThinking}
              />
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={downloadSessionRecord} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" aria-label="Download current session as JSON">
                  Download Session JSON
                </button>
                <button onClick={endSession} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 transition-colors" aria-label="End live tutoring session">
                  End Session
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
