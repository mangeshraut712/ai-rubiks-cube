import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiCopy,
  FiLoader,
  FiPlay,
  FiUsers,
  FiWifi,
  FiWifiOff,
  FiX,
  FiZap
} from "react-icons/fi";
import { v4 as uuidv4 } from "uuid";
import { useMultiplayer } from "../hooks/useMultiplayer";

const GAME_MODES = [
  {
    id: "race",
    label: "Race",
    description: "First solver wins.",
    accent: "#4285F4",
    soft: "rgba(66,133,244,0.14)",
    icon: FiZap
  },
  {
    id: "countdown",
    label: "Countdown",
    description: "Solve before the timer runs out.",
    accent: "#FBBC05",
    soft: "rgba(251,188,5,0.18)",
    icon: FiClock
  },
  {
    id: "sync",
    label: "Sync",
    description: "Mirror moves together.",
    accent: "#34A853",
    soft: "rgba(52,168,83,0.14)",
    icon: FiUsers
  }
];

function generateScramble() {
  const moves = ["U", "U'", "D", "D'", "L", "L'", "R", "R'", "F", "F'", "B", "B'"];
  return Array.from({ length: 20 }, () => moves[Math.floor(Math.random() * moves.length)]);
}

function resolveStatus(connectionState, error) {
  switch (connectionState) {
    case "connected":
      return {
        label: "Peer connected",
        tone:
          "border-[color:rgba(52,168,83,0.22)] bg-[rgba(52,168,83,0.12)] text-[#166534] dark:text-green-200",
        icon: FiWifi
      };
    case "connecting":
      return {
        label: "Connecting",
        tone:
          "border-[color:rgba(251,188,5,0.24)] bg-[rgba(251,188,5,0.14)] text-[#8a6100] dark:text-yellow-200",
        icon: FiLoader
      };
    case "error":
      return {
        label: error || "Connection error",
        tone:
          "border-[color:rgba(234,67,53,0.22)] bg-[rgba(234,67,53,0.12)] text-[#b42318] dark:text-red-200",
        icon: FiAlertCircle
      };
    case "disconnected":
      return {
        label: "Disconnected",
        tone:
          "border-[color:rgba(148,163,184,0.2)] bg-[rgba(148,163,184,0.14)] text-slate-600 dark:text-slate-300",
        icon: FiWifiOff
      };
    default:
      return {
        label: "Create a room or join one to start.",
        tone:
          "border-[color:rgba(66,133,244,0.18)] bg-[rgba(66,133,244,0.12)] text-[#1a73e8] dark:text-blue-200",
        icon: FiUsers
      };
  }
}

export default function MultiplayerLobby({ onClose, onStartGame }) {
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gameMode, setGameMode] = useState("race");

  const { connectionState, error, latency, connect, disconnect, sendGameState, isConnected, localId } =
    useMultiplayer();

  const status = resolveStatus(connectionState, error);
  const StatusIcon = status.icon;

  const createRoom = useCallback(async () => {
    const newRoomId = uuidv4().slice(0, 8).toUpperCase();
    setRoomId(newRoomId);
    setIsHost(true);

    try {
      await connect(newRoomId);
    } catch (connectError) {
      console.error("Failed to create room:", connectError);
    }
  }, [connect]);

  const joinRoom = useCallback(async () => {
    const normalizedRoomId = roomId.trim().toUpperCase();
    if (!normalizedRoomId) {
      return;
    }

    setIsHost(false);

    try {
      await connect(normalizedRoomId);
    } catch (connectError) {
      console.error("Failed to join room:", connectError);
    }
  }, [connect, roomId]);

  const copyRoomId = useCallback(async () => {
    if (!roomId || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [roomId]);

  const startGame = useCallback(() => {
    if (!isConnected) {
      return;
    }

    const gameConfig = {
      mode: gameMode,
      scramble: generateScramble(),
      startTime: null
    };

    sendGameState({ type: "game-start", config: gameConfig });
    onStartGame?.(gameConfig, true);
  }, [gameMode, isConnected, onStartGame, sendGameState]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 18 }}
        transition={{ type: "spring", stiffness: 250, damping: 24 }}
        className="modal-shell max-w-5xl"
      >
        <header className="modal-header">
          <div>
            <p className="modal-eyebrow">Multiplayer lab</p>
            <h2 className="modal-title">Bring a second cube into the same stage.</h2>
            <p className="modal-subtitle">
              This rewrite turns multiplayer into a Labs-style control room and fixes the host flow so
              creating a room now also connects the host to signaling.
            </p>
          </div>

          <button type="button" onClick={onClose} className="modal-close" aria-label="Close multiplayer">
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="modal-body space-y-5">
          <div className={`flex items-center gap-3 rounded-[24px] border px-4 py-3 text-sm ${status.tone}`}>
            <StatusIcon className={`h-4 w-4 ${connectionState === "connecting" ? "animate-spin" : ""}`} />
            <span>{status.label}</span>
            {latency > 0 ? (
              <span className="ml-auto rounded-full bg-black/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] dark:bg-white/5">
                {latency} ms
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="modal-card p-5">
              <div className="surface-kicker">Host a room</div>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                Spin up a code and invite another solver.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                The host is now connected as soon as the room is created. No extra join step is required.
              </p>

              <button type="button" onClick={createRoom} className="surface-button-primary mt-5 sm:w-auto">
                <FiUsers className="h-4 w-4" />
                Create room
              </button>

              {roomId && isHost ? (
                <div className="mt-5 rounded-[26px] border border-[rgba(66,133,244,0.16)] bg-[rgba(66,133,244,0.08)] p-4 dark:bg-[rgba(66,133,244,0.12)]">
                  <div className="surface-kicker text-[#1a73e8] dark:text-blue-200">Room code</div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <div className="flex-1 rounded-[22px] bg-white px-4 py-4 text-center font-['IBM_Plex_Mono'] text-2xl font-semibold tracking-[0.28em] text-[#1a73e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:bg-[rgba(8,18,32,0.82)] dark:text-blue-200">
                      {roomId}
                    </div>
                    <button type="button" onClick={copyRoomId} className="surface-button-secondary sm:w-auto">
                      {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Share this code with your opponent while the host waits for the peer connection.
                  </p>
                </div>
              ) : null}
            </section>

            <section className="modal-card p-5">
              <div className="surface-kicker">Join a room</div>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                Connect to an existing match.
              </h3>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={roomId}
                  onChange={(event) => setRoomId(event.target.value.toUpperCase())}
                  placeholder="Enter room code"
                  maxLength={8}
                  className="min-h-[3.2rem] flex-1 rounded-full border border-[rgba(15,23,42,0.08)] bg-white/80 px-5 text-center font-['IBM_Plex_Mono'] text-lg tracking-[0.25em] text-slate-900 outline-none placeholder:tracking-[0.18em] placeholder:text-slate-400 dark:border-white/10 dark:bg-[rgba(8,18,32,0.84)] dark:text-white dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={joinRoom}
                  disabled={roomId.trim().length < 4 || connectionState === "connecting"}
                  className="surface-button-secondary sm:w-auto"
                >
                  {connectionState === "connecting" ? <FiLoader className="h-4 w-4 animate-spin" /> : null}
                  Join room
                </button>
              </div>

              {error ? (
                <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-[rgba(234,67,53,0.22)] bg-[rgba(234,67,53,0.12)] px-4 py-3 text-sm text-[#8a2c21] dark:text-red-200">
                  <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="mt-5 rounded-[24px] bg-white/60 px-4 py-4 text-sm leading-7 text-slate-500 dark:bg-white/5 dark:text-slate-300">
                Room codes stay short for live demos and pair tests. The UI is optimized for quick host/join flows,
                not account-based lobbies.
              </div>
            </section>
          </div>

          <section className="modal-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="surface-kicker">Game mode</div>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                  Choose the multiplayer behavior before the match starts.
                </h3>
              </div>

              <span className="surface-chip text-xs">
                <FiUsers className="h-4 w-4 text-[#34A853]" />
                Local ID {localId.slice(0, 8)}
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {GAME_MODES.map((mode) => {
                const Icon = mode.icon;
                const active = gameMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGameMode(mode.id)}
                    className={`rounded-[26px] border p-4 text-left transition duration-200 ${
                      active
                        ? "border-[color:rgba(66,133,244,0.22)] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.08)] dark:bg-[rgba(8,18,32,0.86)]"
                        : "border-[color:rgba(15,23,42,0.08)] bg-white/60 hover:border-[color:rgba(66,133,244,0.16)] dark:border-white/10 dark:bg-white/5"
                    }`}
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-[18px]"
                      style={{ backgroundColor: mode.soft, color: mode.accent }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                      {mode.label}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {mode.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-[rgba(15,23,42,0.08)] pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Start becomes available once the peer data channel is fully connected.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                {connectionState !== "idle" && connectionState !== "disconnected" ? (
                  <button type="button" onClick={disconnect} className="surface-button-danger sm:w-auto">
                    Disconnect
                  </button>
                ) : null}

                {isHost ? (
                  <button
                    type="button"
                    onClick={startGame}
                    disabled={!isConnected}
                    className="surface-button-primary sm:w-auto"
                  >
                    <FiPlay className="h-4 w-4" />
                    Start game
                  </button>
                ) : (
                  <span className="surface-chip text-xs">
                    {isConnected ? "Waiting for host to start" : "Join a host to continue"}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
