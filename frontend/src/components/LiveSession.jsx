import { forwardRef, useEffect, useEffectEvent, useImperativeHandle, useRef, useState } from "react";

import {
  captureVideoFrame,
  encodeBinaryEnvelope,
  requestMediaStream,
  startPcmCapture
} from "../utils/webrtcHelpers";
import { getTutorSocketUrlCandidates } from "../utils/backendOrigin.js";

const INTERRUPT_THRESHOLD = 0.82;
const INTERRUPT_HOLD_MS = 1500;
const INTERRUPT_COOLDOWN_MS = 7000;
const INTERRUPT_ARM_DELAY_MS = 3000;
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function pcm16ToAudioBuffer(audioContext, arrayBuffer, sampleRate = 16000) {
  const pcm = new Int16Array(arrayBuffer);
  const audioBuffer = audioContext.createBuffer(1, pcm.length, sampleRate);
  const channel = audioBuffer.getChannelData(0);

  for (let i = 0; i < pcm.length; i += 1) {
    channel[i] = pcm[i] / 32768;
  }

  return audioBuffer;
}

function parsePcmRate(mimeType, fallbackRate = 16000) {
  const raw = String(mimeType || "");
  const match = raw.match(/rate=(\d{4,6})/i);
  if (!match) {
    return fallbackRate;
  }

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 8000 || parsed > 96000) {
    return fallbackRate;
  }

  return parsed;
}

/**
 * Handles webcam/mic capture + websocket transport for the live Gemini session.
 */
const LiveSession = forwardRef(function LiveSession(
  {
    active,
    onStatusChange,
    onMicLevel,
    onTranscriptEntry,
    onInstruction,
    onCubeState,
    onMoveHistory,
    onTutorSpeakingChange,
    onHint,
    onChallengeUpdate,
    onError,
    onThinkingChange,
    onSolveComplete
  },
  ref
) {
  const [permissionError, setPermissionError] = useState("");
  const [previewStatus, setPreviewStatus] = useState("disconnected");
  const [hasVideoPreview, setHasVideoPreview] = useState(false);

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const unmountedRef = useRef(false);
  const lastFrameRef = useRef(null);
  const lastInterruptMsRef = useRef(0);
  const aboveInterruptThresholdSinceRef = useRef(null);

  const audioCaptureRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const playbackContextRef = useRef(null);
  const playbackGenerationRef = useRef(0);
  const scheduledEndTimeRef = useRef(0);
  const currentSourcesRef = useRef([]);
  const isPlayingRef = useRef(false);
  const tutorSpeechStartedAtRef = useRef(0);
  const speakingCheckRef = useRef(null);

  const statusRef = useRef("disconnected");
  const wsTargetRef = useRef("");
  const wsCandidatesRef = useRef([]);

  const emitTranscriptEntry = useEffectEvent((entry) => onTranscriptEntry?.(entry));
  const emitInstruction = useEffectEvent((move) => onInstruction?.(move));
  const emitCubeState = useEffectEvent((cubeState) => onCubeState?.(cubeState));
  const emitMoveHistory = useEffectEvent((moveHistory) => onMoveHistory?.(moveHistory));
  const emitTutorSpeaking = useEffectEvent((flag) => onTutorSpeakingChange?.(flag));
  const emitHint = useEffectEvent((hint) => onHint?.(hint));
  const emitChallengeUpdate = useEffectEvent((payload) => onChallengeUpdate?.(payload));
  const emitError = useEffectEvent((message) => onError?.(message));
  const emitThinking = useEffectEvent((flag) => onThinkingChange?.(flag));
  const emitSolveComplete = useEffectEvent(() => onSolveComplete?.());
  const emitMicLevel = useEffectEvent((level) => onMicLevel?.(level));

  function emitStatus(nextStatus) {
    statusRef.current = nextStatus;
    setPreviewStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }

  function wsUrls() {
    return getTutorSocketUrlCandidates();
  }

  function sendJson(payload) {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify(payload));
  }

  function updateTutorSpeakingState(flag) {
    emitTutorSpeaking(flag);
  }

  function stopAudioPlayback() {
    playbackGenerationRef.current += 1;
    scheduledEndTimeRef.current = 0;

    for (const source of currentSourcesRef.current) {
      try {
        source.stop();
        source.disconnect();
      } catch (_error) {
        // Ignore stop race conditions.
      }
    }
    currentSourcesRef.current = [];

    if (speakingCheckRef.current) {
      clearInterval(speakingCheckRef.current);
      speakingCheckRef.current = null;
    }

    isPlayingRef.current = false;
    tutorSpeechStartedAtRef.current = 0;
    updateTutorSpeakingState(false);
  }

  async function ensurePlaybackContext() {
    if (!playbackContextRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      playbackContextRef.current = new Ctor({ sampleRate: 24000 });
    }

    if (playbackContextRef.current.state === "suspended") {
      await playbackContextRef.current.resume();
    }

    return playbackContextRef.current;
  }

  /**
   * Gapless audio scheduling: Each chunk is scheduled to play exactly when
   * the previous one ends, using Web Audio API's precise time-based scheduling.
   * This eliminates the gaps/pops that caused the broken voice.
   */
  async function enqueueAudio(base64Audio, mimeType) {
    try {
      const audioContext = await ensurePlaybackContext();
      const generation = playbackGenerationRef.current;
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      let decoded;

      if (mimeType?.includes("pcm")) {
        // Gemini Live API sends audio at 24kHz PCM by default
        decoded = pcm16ToAudioBuffer(audioContext, arrayBuffer, parsePcmRate(mimeType, 24000));
      } else {
        decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      }

      if (generation !== playbackGenerationRef.current) {
        return; // Playback was stopped/reset while decoding
      }

      const source = audioContext.createBufferSource();
      source.buffer = decoded;
      source.connect(audioContext.destination);

      // Schedule this chunk to start exactly when the previous one ends
      const now = audioContext.currentTime;
      const startAt = Math.max(now, scheduledEndTimeRef.current);
      scheduledEndTimeRef.current = startAt + decoded.duration;

      source.onended = () => {
        // Remove from tracked sources
        currentSourcesRef.current = currentSourcesRef.current.filter((s) => s !== source);
        try {
          source.disconnect();
        } catch (_e) {
          /* noop */
        }
      };

      currentSourcesRef.current.push(source);
      source.start(startAt);

      // Mark as speaking
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        tutorSpeechStartedAtRef.current = Date.now();
        updateTutorSpeakingState(true);

        // Periodic check to detect when all scheduled audio has finished
        if (speakingCheckRef.current) {
          clearInterval(speakingCheckRef.current);
        }
        speakingCheckRef.current = setInterval(() => {
          if (generation !== playbackGenerationRef.current) {
            clearInterval(speakingCheckRef.current);
            speakingCheckRef.current = null;
            return;
          }
          const ctx = playbackContextRef.current;
          if (
            ctx &&
            ctx.currentTime >= scheduledEndTimeRef.current &&
            currentSourcesRef.current.length === 0
          ) {
            isPlayingRef.current = false;
            tutorSpeechStartedAtRef.current = 0;
            updateTutorSpeakingState(false);
            clearInterval(speakingCheckRef.current);
            speakingCheckRef.current = null;
          }
        }, 200);
      }
    } catch (error) {
      console.error("[LiveSession] enqueueAudio failed", error);
      emitError("Audio playback decode failed.");
    }
  }

  function setupWebSocket() {
    if (unmountedRef.current || !active) {
      return;
    }

    emitStatus("connecting");

    if (wsCandidatesRef.current.length === 0) {
      wsCandidatesRef.current = wsUrls();
    }

    const candidates = wsCandidatesRef.current;
    const targetIndex = reconnectAttemptRef.current % candidates.length;
    const targetUrl = candidates[targetIndex];

    wsTargetRef.current = targetUrl;
    const socket = new WebSocket(targetUrl);
    wsRef.current = socket;
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      reconnectAttemptRef.current = 0;
      emitStatus("connected");
      emitError("");
    };

    socket.onmessage = async (event) => {
      if (typeof event.data !== "string") {
        return;
      }

      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "status":
            if (message.status) {
              emitStatus(message.status);
            }
            if (message.status === "demo_mode") {
              setPermissionError("");
              emitError("");
              emitTranscriptEntry({
                speaker: "cubey",
                text: "Demo mode enabled. You can test the tutor without a physical cube or camera feed.",
                ts: new Date().toISOString()
              });
            }
            break;

          case "error":
            emitError(message.message || "Server error");
            break;

          case "text_response":
            emitTranscriptEntry({
              speaker: "cubey",
              text: message.text || "",
              ts: message.ts || new Date().toISOString()
            });
            break;

          case "audio_response":
            if (message.data) {
              await enqueueAudio(message.data, message.mimeType);
            }
            break;

          case "move_instruction":
            emitInstruction(message.move || "");
            break;

          case "cube_state_update":
            emitCubeState(message.cubeState);
            break;

          case "move_history_update":
            emitMoveHistory(message.moveHistory || []);
            break;

          case "hint_response":
            emitHint(message.text || "");
            emitTranscriptEntry({
              speaker: "cubey",
              text: `[Hint] ${message.text || ""}`,
              ts: new Date().toISOString()
            });
            break;

          case "challenge_update":
            emitChallengeUpdate(message);
            break;

          case "interruption":
            stopAudioPlayback();
            break;

          case "thinking":
            // AI is thinking/processing
            emitThinking(message.thinking === true);
            break;

          case "solution_response":
            if (Array.isArray(message.solution) && message.solution.length) {
              emitTranscriptEntry({
                speaker: "cubey",
                text: `Solution preview: ${message.solution.join(" ")} (${message.solution.length} moves)`,
                ts: new Date().toISOString()
              });
            }
            break;

          case "solve_complete":
            emitTranscriptEntry({
              speaker: "cubey",
              text: `🎉 Cube solved in ${message.totalMoves} moves!`,
              ts: new Date().toISOString()
            });
            emitSolveComplete();
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("[LiveSession] message parse failed", error);
        emitError("Failed to parse backend message.");
      }
    };

    socket.onerror = (event) => {
      console.error("[LiveSession] websocket error", event);
      emitError(
        `WebSocket connection error. Ensure backend is running and reachable at ${wsTargetRef.current}.`
      );
    };

    socket.onclose = () => {
      emitStatus("disconnected");
      stopAudioPlayback();

      if (!active || unmountedRef.current) {
        return;
      }

      reconnectAttemptRef.current += 1;
      const candidateCount = Math.max(1, wsCandidatesRef.current.length);
      if (reconnectAttemptRef.current >= candidateCount) {
        emitError(
          `Connection lost. Retrying across backend endpoints. Last endpoint: ${wsTargetRef.current}`
        );
      }
      const delayMs =
        reconnectAttemptRef.current <= candidateCount
          ? 450
          : Math.min(8000, 800 * 2 ** (reconnectAttemptRef.current - candidateCount));

      reconnectTimerRef.current = setTimeout(() => {
        setupWebSocket();
      }, delayMs);
    };
  }

  async function startMedia() {
    try {
      setHasVideoPreview(false);
      const stream = await requestMediaStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasVideoPreview(true);
      }

      audioCaptureRef.current = startPcmCapture(
        stream,
        (chunk) => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            return;
          }

          // Avoid feeding speaker playback back into Gemini while Cubey is talking.
          // User barge-in is handled by the local interrupt detector below.
          const speaking = isPlayingRef.current || currentSourcesRef.current.length > 0;
          if (speaking) {
            return;
          }

          const packet = encodeBinaryEnvelope(
            { type: "audio_chunk", mimeType: "audio/pcm;rate=16000" },
            chunk
          );

          wsRef.current.send(packet);
        },
        (level) => {
          emitMicLevel(level);

          const speaking = isPlayingRef.current || currentSourcesRef.current.length > 0;
          if (!speaking) {
            aboveInterruptThresholdSinceRef.current = null;
            return;
          }

          const now = Date.now();
          if (now - tutorSpeechStartedAtRef.current < INTERRUPT_ARM_DELAY_MS) {
            aboveInterruptThresholdSinceRef.current = null;
            return;
          }

          if (level > INTERRUPT_THRESHOLD) {
            if (!aboveInterruptThresholdSinceRef.current) {
              aboveInterruptThresholdSinceRef.current = now;
            }

            const heldForMs = now - aboveInterruptThresholdSinceRef.current;
            const cooldownSatisfied = now - lastInterruptMsRef.current > INTERRUPT_COOLDOWN_MS;

            if (heldForMs >= INTERRUPT_HOLD_MS && cooldownSatisfied) {
              lastInterruptMsRef.current = now;
              aboveInterruptThresholdSinceRef.current = null;
              sendJson({ type: "interrupt" });
              stopAudioPlayback();
            }
            return;
          }

          aboveInterruptThresholdSinceRef.current = null;
        }
      );

      // Send video frames at 4fps (250ms) - responsive but bandwidth-efficient
      frameIntervalRef.current = setInterval(() => {
        const frame = captureVideoFrame(videoRef.current, canvasRef.current, 0.7, true);
        if (!frame) {
          return;
        }

        lastFrameRef.current = frame;
        sendJson({ type: "video_frame", data: frame });
      }, 250);

      setPermissionError("");
    } catch (error) {
      console.error("[LiveSession] media permission denied", error);
      const message =
        "Camera/Microphone permission denied. Please allow access and restart session.";
      setHasVideoPreview(false);
      setPermissionError(message);
      emitError(message);
      emitStatus("permission_denied");
    }
  }

  async function cleanupMediaAndSocket() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (audioCaptureRef.current) {
      await audioCaptureRef.current.stop();
      audioCaptureRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "end_session" }));
        }
        wsRef.current.close();
      } catch (error) {
        console.warn("[LiveSession] websocket close warning", error);
      }
      wsRef.current = null;
    }

    stopAudioPlayback();

    if (playbackContextRef.current) {
      try {
        await playbackContextRef.current.close();
      } catch (error) {
        console.warn("[LiveSession] playback context close warning", error);
      }
      playbackContextRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setHasVideoPreview(false);
    emitMicLevel(0);
    updateTutorSpeakingState(false);
  }

  useImperativeHandle(ref, () => ({
    requestHint() {
      if (!lastFrameRef.current) {
        emitError("No video frame available yet for hint.");
        return;
      }

      sendJson({ type: "hint_request", frame: lastFrameRef.current });
    },

    setChallengeMode(enabled) {
      sendJson({ type: "challenge_mode", enabled: Boolean(enabled) });
    },

    reportMoveApplied(move) {
      const normalized = String(move || "").trim().toUpperCase();
      if (!normalized) {
        return;
      }

      sendJson({ type: "move_applied", move: normalized });
    },

    syncCubeState(cubeState, reason = "manual") {
      if (!cubeState) {
        return;
      }

      sendJson({
        type: "cube_state_sync",
        cubeState,
        reason
      });
    },

    sendUserText(text) {
      const trimmed = String(text || "").trim();
      if (!trimmed) {
        return;
      }
      emitTranscriptEntry({
        speaker: "user",
        text: trimmed,
        ts: new Date().toISOString()
      });
      sendJson({ type: "user_text", text: trimmed });
    },

    solvePreview() {
      sendJson({ type: "solve_request" });
    },

    autoSolve() {
      sendJson({ type: "auto_solve" });
    },

    async retryConnection() {
      reconnectAttemptRef.current = 0;
      wsCandidatesRef.current = wsUrls();
      wsTargetRef.current = "";
      setPermissionError("");
      await cleanupMediaAndSocket();
      await startMedia();
      setupWebSocket();
    },

    async endSession() {
      await cleanupMediaAndSocket();
      emitStatus("disconnected");
    }
  }));

  /* eslint-disable react-hooks/exhaustive-deps -- intentionally keyed by session activity only */
  useEffect(() => {
    unmountedRef.current = false;
    wsCandidatesRef.current = wsUrls();
    reconnectAttemptRef.current = 0;
    wsTargetRef.current = "";

    if (!active) {
      cleanupMediaAndSocket();
      emitStatus("disconnected");
      return () => {
        unmountedRef.current = true;
      };
    }

    (async () => {
      await startMedia();
      setupWebSocket();
    })();

    return () => {
      unmountedRef.current = true;
      cleanupMediaAndSocket();
    };
  }, [active]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const previewMeta =
    previewStatus === "connected"
      ? { label: "Lens live", dot: "is-green" }
      : previewStatus === "demo_mode"
        ? { label: "Demo lens", dot: "is-blue" }
        : previewStatus === "connecting"
          ? { label: "Opening devices", dot: "is-yellow" }
          : previewStatus === "permission_denied"
            ? { label: "Permissions blocked", dot: "is-red" }
            : { label: "Lens offline", dot: "is-red" };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.18),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0.12))] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] dark:bg-[radial-gradient(circle_at_top,rgba(66,133,244,0.18),transparent_45%),linear-gradient(180deg,rgba(8,18,32,0.68),rgba(8,18,32,0.36))]">
      <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(8,18,32,0.72)] dark:text-slate-300">
          <span className={`status-dot ${previewMeta.dot}`} />
          {previewMeta.label}
        </div>
        <div className="rounded-full border border-white/70 bg-white/72 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-[rgba(8,18,32,0.72)] dark:text-slate-300">
          Live camera tile
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.26))]" />

      {!permissionError && !hasVideoPreview ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/68 px-4 backdrop-blur-sm dark:bg-[rgba(8,18,32,0.74)]">
          <div className="rounded-[24px] border border-white/80 bg-white/82 px-5 py-4 text-center text-sm font-medium text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[rgba(8,18,32,0.88)] dark:text-slate-300">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Camera preview
            </div>
            <div className="mt-2 leading-7">
              {previewStatus === "connecting"
                ? "Opening media devices and backend session..."
                : "Preview will appear here once the camera is available."}
            </div>
          </div>
        </div>
      ) : null}

      {permissionError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/92 p-4 dark:bg-[rgba(8,18,32,0.94)]">
          <div className="rounded-[24px] border border-[rgba(234,67,53,0.22)] bg-[rgba(234,67,53,0.12)] px-5 py-4 text-center text-sm leading-7 text-[#7a2d24] dark:text-red-200">
            {permissionError}
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default LiveSession;
