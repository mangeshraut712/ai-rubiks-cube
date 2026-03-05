/**
 * Multiplayer Lobby Component
 * 2026: WebRTC peer-to-peer matchmaking interface
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    FiUsers,
    FiPlay,
    FiCopy,
    FiCheck,
    FiX,
    FiWifi,
    FiWifiOff,
    FiLoader,
    FiAward,
    FiClock
} from "react-icons/fi";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { v4 as uuidv4 } from "uuid";

export default function MultiplayerLobby({ onClose, onStartGame }) {
    const [roomId, setRoomId] = useState("");
    const [isHost, setIsHost] = useState(false);
    const [copied, setCopied] = useState(false);
    const [gameMode, setGameMode] = useState("race"); // race, countdown, sync

    const {
        connectionState,
        error,
        latency,
        connect,
        disconnect,
        sendGameState,
        isConnected,
        localId
    } = useMultiplayer();

    // Generate room ID
    const createRoom = useCallback(() => {
        const newRoomId = uuidv4().slice(0, 8).toUpperCase();
        setRoomId(newRoomId);
        setIsHost(true);
    }, []);

    // Join room
    const joinRoom = useCallback(async () => {
        if (!roomId.trim()) return;

        try {
            await connect(roomId.trim().toUpperCase());
        } catch (err) {
            console.error("Failed to join room:", err);
        }
    }, [roomId, connect]);

    // Copy room ID
    const copyRoomId = useCallback(() => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [roomId]);

    // Start game
    const startGame = useCallback(() => {
        if (!isConnected) return;

        const gameConfig = {
            mode: gameMode,
            scramble: generateScramble(),
            startTime: null
        };

        sendGameState({ type: "game-start", config: gameConfig });
        onStartGame?.(gameConfig, true);
    }, [isConnected, gameMode, sendGameState, onStartGame]);

    // Generate random scramble
    const generateScramble = () => {
        const moves = ["U", "U'", "D", "D'", "L", "L'", "R", "R'", "F", "F'", "B", "B'"];
        const scramble = [];
        for (let i = 0; i < 20; i++) {
            scramble.push(moves[Math.floor(Math.random() * moves.length)]);
        }
        return scramble;
    };

    // Status message
    const getStatusMessage = () => {
        switch (connectionState) {
            case "idle":
                return "Create or join a room to start";
            case "connecting":
                return "Connecting...";
            case "connected":
                return "Connected! Ready to play";
            case "disconnected":
                return "Disconnected";
            case "error":
                return error || "Connection error";
            default:
                return connectionState;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-effect shadow-2xl dark:text-white"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200/50 p-6 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 text-white shadow-lg shadow-purple-500/20">
                            <FiUsers className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Multiplayer</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Race against a friend in real-time
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                    >
                        <FiX className="h-6 w-6" />
                    </button>
                </div>

                {/* Connection Status */}
                <div
                    className={`flex items-center justify-center gap-2 p-3 text-sm ${connectionState === "connected"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : connectionState === "error"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                >
                    {connectionState === "connecting" ? (
                        <FiLoader className="h-4 w-4 animate-spin" />
                    ) : connectionState === "connected" ? (
                        <FiWifi className="h-4 w-4" />
                    ) : (
                        <FiWifiOff className="h-4 w-4" />
                    )}
                    {getStatusMessage()}
                    {latency > 0 && <span className="ml-2 text-xs">({latency}ms)</span>}
                </div>

                {/* Content */}
                <div className="p-6">
                    {!isConnected ? (
                        <div className="space-y-4">
                            {/* Create Room */}
                            {!roomId && (
                                <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center dark:border-slate-600">
                                    <FiUsers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                                    <h3 className="mb-2 text-lg font-semibold">Create a Room</h3>
                                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                                        Host a new multiplayer session
                                    </p>
                                    <button
                                        onClick={createRoom}
                                        className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-2 font-medium text-white shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        Create Room
                                    </button>
                                </div>
                            )}

                            {/* Room Created */}
                            {roomId && isHost && (
                                <div className="rounded-xl bg-purple-50 p-4 dark:bg-purple-900/20">
                                    <h3 className="mb-3 font-semibold text-purple-900 dark:text-purple-400">
                                        Share this code with a friend:
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className="flex-1 rounded-lg bg-white p-3 text-center text-2xl font-mono font-bold tracking-wider text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400">
                                            {roomId}
                                        </div>
                                        <button
                                            onClick={copyRoomId}
                                            className="rounded-lg bg-purple-100 p-3 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900"
                                        >
                                            {copied ? <FiCheck className="h-6 w-6" /> : <FiCopy className="h-6 w-6" />}
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Waiting for opponent to join...
                                    </p>
                                </div>
                            )}

                            {/* Join Room */}
                            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                                <h3 className="mb-3 font-semibold">Join a Room</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => {
                                            setRoomId(e.target.value.toUpperCase());
                                            setIsHost(false);
                                        }}
                                        placeholder="Enter room code"
                                        maxLength={8}
                                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center font-mono text-lg uppercase focus:border-purple-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                    />
                                    <button
                                        onClick={joinRoom}
                                        disabled={roomId.length < 4 || connectionState === "connecting"}
                                        className="rounded-lg bg-gray-900 px-6 py-2 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-gray-900"
                                    >
                                        {connectionState === "connecting" ? (
                                            <FiLoader className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Join"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Connected - Game Setup */
                        <div className="space-y-4">
                            <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
                                <FiUsers className="mx-auto mb-2 h-8 w-8 text-green-600 dark:text-green-400" />
                                <h3 className="font-semibold text-green-900 dark:text-green-400">
                                    Opponent Connected!
                                </h3>
                                <p className="text-sm text-green-700 dark:text-green-300">Latency: {latency}ms</p>
                            </div>

                            {/* Game Mode Selection */}
                            <div>
                                <h3 className="mb-3 font-semibold">Game Mode</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: "race", label: "Race", icon: FiAward, desc: "First to solve wins" },
                                        {
                                            id: "countdown",
                                            label: "Countdown",
                                            icon: FiClock,
                                            desc: "Solve in time limit"
                                        },
                                        { id: "sync", label: "Sync", icon: FiUsers, desc: "Mirror each other" }
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => setGameMode(mode.id)}
                                            className={`rounded-lg border-2 p-3 text-center transition-colors ${gameMode === mode.id
                                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                                    : "border-gray-200 hover:border-gray-300 dark:border-slate-700 dark:hover:border-slate-600"
                                                }`}
                                        >
                                            <mode.icon
                                                className={`mx-auto mb-1 h-5 w-5 ${gameMode === mode.id ? "text-purple-500" : "text-gray-400"
                                                    }`}
                                            />
                                            <div className="text-sm font-medium">{mode.label}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{mode.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Button */}
                            {isHost && (
                                <button
                                    onClick={startGame}
                                    className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 py-3 font-bold text-white shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    <FiPlay className="mr-2 inline h-5 w-5" />
                                    Start Game
                                </button>
                            )}

                            {!isHost && (
                                <p className="text-center text-gray-500 dark:text-gray-400">
                                    Waiting for host to start...
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="text-xs text-gray-500 dark:text-gray-400">ID: {localId.slice(0, 8)}</div>

                    {isConnected && (
                        <button
                            onClick={disconnect}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
