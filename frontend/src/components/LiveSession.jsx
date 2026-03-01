import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";

import {
  captureVideoFrame,
  encodeBinaryEnvelope,
  requestMediaStream,
  startPcmCapture
} from "../utils/webrtcHelpers";

const INTERRUPT_THRESHOLD = 0.15;

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
    onError
  },
  ref
) {
  const [permissionError, setPermissionError] = useState("");

  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const unmountedRef = useRef(false);
  const lastFrameRef = useRef(null);
  const lastInterruptMsRef = useRef(0);

  const audioCaptureRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const playbackContextRef = useRef(null);
  const playbackQueueRef = useRef([]);
  const currentSourceRef = useRef(null);
  const isPlayingRef = useRef(false);

  const statusRef = useRef("disconnected");

  function emitStatus(nextStatus) {
    statusRef.current = nextStatus;
    onStatusChange?.(nextStatus);
  }

  function wsUrl() {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/ws`;
  }

  function sendJson(payload) {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify(payload));
  }

  function updateTutorSpeakingState(flag) {
    onTutorSpeakingChange?.(flag);
  }

  function stopAudioPlayback() {
    playbackQueueRef.current = [];

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (_error) {
        // Ignore stop race conditions.
      }
      currentSourceRef.current.disconnect();
      currentSourceRef.current = null;
    }

    isPlayingRef.current = false;
    updateTutorSpeakingState(false);
  }

  async function ensurePlaybackContext() {
    if (!playbackContextRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      playbackContextRef.current = new Ctor();
    }

    if (playbackContextRef.current.state === "suspended") {
      await playbackContextRef.current.resume();
    }

    return playbackContextRef.current;
  }

  async function drainPlaybackQueue() {
    if (isPlayingRef.current) {
      return;
    }

    const next = playbackQueueRef.current.shift();
    if (!next) {
      updateTutorSpeakingState(false);
      return;
    }

    const audioContext = await ensurePlaybackContext();
    isPlayingRef.current = true;
    updateTutorSpeakingState(true);

    const source = audioContext.createBufferSource();
    source.buffer = next;
    source.connect(audioContext.destination);
    currentSourceRef.current = source;

    source.onended = () => {
      source.disconnect();
      if (currentSourceRef.current === source) {
        currentSourceRef.current = null;
      }
      isPlayingRef.current = false;
      drainPlaybackQueue();
    };

    source.start();
  }

  async function enqueueAudio(base64Audio, mimeType) {
    try {
      const audioContext = await ensurePlaybackContext();
      const arrayBuffer = base64ToArrayBuffer(base64Audio);
      let decoded;

      if (mimeType?.includes("pcm")) {
        decoded = pcm16ToAudioBuffer(audioContext, arrayBuffer, 16000);
      } else {
        decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      }

      playbackQueueRef.current.push(decoded);
      drainPlaybackQueue();
    } catch (error) {
      console.error("[LiveSession] enqueueAudio failed", error);
      onError?.("Audio playback decode failed.");
    }
  }

  function setupWebSocket() {
    if (unmountedRef.current || !active) {
      return;
    }

    emitStatus("connecting");

    const socket = new WebSocket(wsUrl());
    wsRef.current = socket;
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      reconnectAttemptRef.current = 0;
      emitStatus("connected");
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
              onError?.("");
              onTranscriptEntry?.({
                speaker: "cubey",
                text:
                  "Demo mode enabled. You can test the tutor without a physical cube or camera feed.",
                ts: new Date().toISOString()
              });
            }
            break;

          case "error":
            onError?.(message.message || "Server error");
            break;

          case "text_response":
            onTranscriptEntry?.({
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
            onInstruction?.(message.move || "");
            break;

          case "cube_state_update":
            onCubeState?.(message.cubeState);
            if (message.move) {
              onInstruction?.(message.move);
            }
            break;

          case "move_history_update":
            onMoveHistory?.(message.moveHistory || []);
            break;

          case "hint_response":
            onHint?.(message.text || "");
            onTranscriptEntry?.({
              speaker: "cubey",
              text: `[Hint] ${message.text || ""}`,
              ts: new Date().toISOString()
            });
            break;

          case "challenge_update":
            onChallengeUpdate?.(message);
            break;

          case "interruption":
            stopAudioPlayback();
            break;

          case "solution_response":
            if (Array.isArray(message.solution) && message.solution.length) {
              onTranscriptEntry?.({
                speaker: "cubey",
                text: `Full solution preview: ${message.solution.join(" ")}`,
                ts: new Date().toISOString()
              });
            }
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("[LiveSession] message parse failed", error);
        onError?.("Failed to parse backend message.");
      }
    };

    socket.onerror = (event) => {
      console.error("[LiveSession] websocket error", event);
      onError?.("WebSocket error occurred.");
    };

    socket.onclose = () => {
      emitStatus("disconnected");
      stopAudioPlayback();

      if (!active || unmountedRef.current) {
        return;
      }

      reconnectAttemptRef.current += 1;
      const delayMs = Math.min(8000, 800 * 2 ** reconnectAttemptRef.current);

      reconnectTimerRef.current = setTimeout(() => {
        setupWebSocket();
      }, delayMs);
    };
  }

  async function startMedia() {
    try {
      const stream = await requestMediaStream();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      audioCaptureRef.current = startPcmCapture(
        stream,
        (chunk) => {
          if (wsRef.current?.readyState !== WebSocket.OPEN) {
            return;
          }

          const packet = encodeBinaryEnvelope(
            { type: "audio_chunk", mimeType: "audio/pcm;rate=16000" },
            chunk
          );

          wsRef.current.send(packet);
        },
        (level) => {
          onMicLevel?.(level);

          const speaking = isPlayingRef.current || playbackQueueRef.current.length > 0;
          if (!speaking) {
            return;
          }

          const now = Date.now();
          if (level > INTERRUPT_THRESHOLD && now - lastInterruptMsRef.current > 600) {
            lastInterruptMsRef.current = now;
            sendJson({ type: "interrupt" });
            stopAudioPlayback();
          }
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
      setPermissionError(message);
      onError?.(message);
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

    onMicLevel?.(0);
    updateTutorSpeakingState(false);
  }

  useImperativeHandle(
    ref,
    () => ({
      requestHint() {
        if (!lastFrameRef.current) {
          onError?.("No video frame available yet for hint.");
          return;
        }

        sendJson({ type: "hint_request", frame: lastFrameRef.current });
      },

      setChallengeMode(enabled) {
        sendJson({ type: "challenge_mode", enabled: Boolean(enabled) });
      },

      sendUserText(text) {
        const trimmed = String(text || "").trim();
        if (!trimmed) {
          return;
        }
        onTranscriptEntry?.({
          speaker: "user",
          text: trimmed,
          ts: new Date().toISOString()
        });
        sendJson({ type: "user_text", text: trimmed });
      },

      solvePreview() {
        sendJson({ type: "solve_request" });
      },

      async endSession() {
        await cleanupMediaAndSocket();
        emitStatus("disconnected");
      }
    }),
    []
  );

  useEffect(() => {
    unmountedRef.current = false;

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

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[#d2d8e3] bg-white/90">
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {permissionError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-4 text-center text-sm text-[#7a2d24]">
          {permissionError}
        </div>
      ) : null}
    </div>
  );
});

export default LiveSession;
