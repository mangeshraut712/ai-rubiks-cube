import { EventEmitter } from "events";
import { GoogleGenAI, Modality } from "@google/genai";

const DEFAULT_PRIMARY_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-live-2.5-flash-preview";
const DEFAULT_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";
const DEFAULT_SILENCE_DURATION_MS = 1800;
const DEFAULT_MAX_OUTPUT_TOKENS = 1536;

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

/**
 * Wraps Gemini Live API bidirectional streaming for audio + video tutoring.
 * Enhanced with improved error handling and connection resilience.
 */
export class GeminiLiveClient {
  /**
   * @param {{apiKey: string, systemPrompt: string, model?: string}} options
   */
  constructor({ apiKey, systemPrompt, model = DEFAULT_PRIMARY_MODEL }) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required to start Gemini Live session.");
    }

    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
    this.model = model;
    this.activeModel = model;

    this.ai = new GoogleGenAI({ apiKey });
    this.fallbackModelName = DEFAULT_FALLBACK_MODEL;

    this.session = null;
    this.emitter = new EventEmitter();
    this.isOpen = false;
    this.frameInputMode = "auto";
    this.pendingTranscript = "";
    this.pendingPartText = "";
    this.lastDeliveredText = "";
    this.lastDeliveredNormalized = "";
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  /**
   * Starts the live session with model fallback logic.
   * Enhanced with better error handling for challenge reliability.
   * @returns {Promise<void>}
   */
  async startSession() {
    const silenceDurationMs = toPositiveInt(
      process.env.GEMINI_SILENCE_DURATION_MS,
      DEFAULT_SILENCE_DURATION_MS
    );
    const maxOutputTokens = toPositiveInt(
      process.env.GEMINI_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS
    );
    const voiceName = String(process.env.GEMINI_VOICE_NAME || "").trim();
    const voiceLang = String(process.env.GEMINI_VOICE_LANG || "en-US").trim() || "en-US";
    const speechConfig = voiceName
      ? {
          languageCode: voiceLang,
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName
            }
          }
        }
      : {
          languageCode: voiceLang
        };

    // Enhanced model list with multiple fallbacks
    const candidateModels = Array.from(
      new Set(
        [
          this.model,
          process.env.GEMINI_LIVE_MODEL,
          "gemini-live-2.5-flash-preview",
          "gemini-2.5-flash-native-audio-preview-09-2025",
          "gemini-2.0-flash-live-preview"
        ].filter(Boolean)
      )
    );
    let lastError = null;

    for (let attempt = 0; attempt < candidateModels.length; attempt++) {
      const candidateModel = candidateModels[attempt];
      try {
        console.log(
          `[gemini-live] Attempting to connect with model: ${candidateModel} (attempt ${attempt + 1})`
        );
        let settled = false;
        let resolveOpen;
        let rejectOpen;
        const openPromise = new Promise((resolve, reject) => {
          resolveOpen = resolve;
          rejectOpen = reject;
        });

        this.session = await this.ai.live.connect({
          model: candidateModel,
          config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
                endOfSpeechSensitivity: "END_SENSITIVITY_LOW",
                prefixPaddingMs: 300,
                silenceDurationMs
              },
              activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
              turnCoverage: "TURN_INCLUDES_ONLY_ACTIVITY"
            },
            speechConfig,
            systemInstruction: {
              role: "system",
              parts: [{ text: this.systemPrompt }]
            },
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens
          },
          callbacks: {
            onopen: () => {
              this.isOpen = true;
              this.activeModel = candidateModel;
              this.reconnectAttempts = 0;
              console.log(`[gemini-live] Connected successfully with model: ${candidateModel}`);
              this.emitter.emit("open", { model: candidateModel });
              if (!settled) {
                settled = true;
                resolveOpen();
              }
            },
            onclose: () => {
              this.isOpen = false;
              console.log("[gemini-live] Connection closed");
              this.emitter.emit("close");
              if (!settled) {
                settled = true;
                rejectOpen(new Error(`Live session closed before open (${candidateModel}).`));
              }
            },
            onerror: (errorEvent) => {
              console.error("[gemini-live] Connection error:", errorEvent?.error ?? errorEvent);
              this.emitter.emit("error", errorEvent?.error ?? errorEvent);
              if (!settled) {
                settled = true;
                rejectOpen(errorEvent?.error ?? errorEvent);
              }
            },
            onmessage: (message) => {
              this.#handleServerMessage(message);
            }
          }
        });

        await openPromise;
        return;
      } catch (error) {
        lastError = error;
        console.error("[gemini-live] connect failed", {
          model: candidateModel,
          error: error?.message ?? String(error)
        });

        // Continue to next model if this one fails
      }
    }

    throw lastError ?? new Error("Unable to connect to any Gemini model.");
  }

  /**
   * Registers a listener for streamed audio chunks from Gemini.
   * @param {(chunk: {data: string, mimeType: string}) => void} callback
   */
  onAudioResponse(callback) {
    this.emitter.on("audio", callback);
  }

  /**
   * Registers a listener for streamed text responses from Gemini.
   * @param {(text: string) => void} callback
   */
  onTextResponse(callback) {
    this.emitter.on("text", callback);
  }

  /**
   * Registers a listener when interruption/barge-in is detected.
   * @param {(reason?: string) => void} callback
   */
  onInterruption(callback) {
    this.emitter.on("interruption", callback);
  }

  /**
   * Registers a listener for AI thinking state changes.
   * @param {(isThinking: boolean) => void} callback
   */
  onThinkingChange(callback) {
    this.emitter.on("thinking", callback);
  }

  /**
   * Sends a 16kHz PCM audio chunk.
   * @param {Buffer | Uint8Array} pcmBuffer
   */
  sendAudioChunk(pcmBuffer) {
    if (!this.session || !pcmBuffer) {
      return;
    }

    try {
      const encoded = Buffer.from(pcmBuffer).toString("base64");
      this.session.sendRealtimeInput({
        audio: {
          data: encoded,
          mimeType: "audio/pcm;rate=16000"
        }
      });
    } catch (error) {
      console.warn("[gemini-live] sendAudioChunk failed:", error?.message ?? error);
    }
  }

  /**
   * Sends a webcam frame (base64 JPEG) to Gemini.
   * @param {string} base64jpeg
   */
  sendVideoFrame(base64jpeg) {
    if (!this.session || !base64jpeg) {
      return;
    }
    const framePayload = {
      data: base64jpeg,
      mimeType: "image/jpeg"
    };

    if (this.frameInputMode === "media") {
      this.session.sendRealtimeInput({ media: framePayload });
      return;
    }

    if (this.frameInputMode === "video") {
      this.session.sendRealtimeInput({ video: framePayload });
      return;
    }

    try {
      this.session.sendRealtimeInput({ media: framePayload });
      this.frameInputMode = "media";
    } catch {
      try {
        this.session.sendRealtimeInput({ video: framePayload });
        this.frameInputMode = "video";
      } catch {
        console.warn("[gemini-live] Failed to send video frame with both media and video modes");
      }
    }
  }

  /**
   * Sends a text turn to the live session.
   * @param {string} text
   * @param {boolean} turnComplete
   */
  sendTextTurn(text, turnComplete = true) {
    if (!this.session || !text?.trim()) {
      return;
    }

    try {
      this.session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [{ text: text.trim() }]
          }
        ],
        turnComplete
      });
    } catch (error) {
      console.warn("[gemini-live] sendTextTurn failed:", error?.message ?? error);
    }
  }

  /**
   * Signals an interruption during model playback.
   */
  interrupt() {
    this.emitter.emit("interruption", "client_interrupt");

    if (!this.session) {
      return;
    }

    try {
      this.session.sendRealtimeInput({ activityStart: {} });
    } catch (error) {
      console.warn("[gemini-live] activityStart failed", error?.message ?? error);
    }
  }

  /**
   * Uses a text+image fallback model for one-shot hint requests.
   * @param {string} base64jpeg
   * @returns {Promise<string>}
   */
  async requestHint(base64jpeg) {
    if (!base64jpeg) {
      return "I need a clear frame to generate a hint. Please try again.";
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.fallbackModelName,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "You are Cubey. From this Rubik's Cube frame, identify the most likely recent move mistake and provide one corrective move instruction. Keep it short."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64jpeg
                }
              }
            ]
          }
        ]
      });

      return (
        response?.text ||
        "I could not detect the mistake clearly. Please rotate the cube and ask again."
      );
    } catch (error) {
      console.error("[gemini-live] requestHint failed", error);
      return "I couldn't generate a visual hint right now. Please try again in a moment.";
    }
  }

  /**
   * Closes the live connection and detaches listeners.
   */
  close() {
    try {
      this.session?.close();
    } catch (error) {
      console.warn("[gemini-live] close error", error?.message ?? error);
    }

    this.session = null;
    this.isOpen = false;
    this.pendingTranscript = "";
    this.pendingPartText = "";
    this.lastDeliveredText = "";
    this.lastDeliveredNormalized = "";
    this.emitter.removeAllListeners();
  }

  #mergeText(existing, incoming) {
    const left = String(existing || "").trim();
    const right = String(incoming || "").trim();

    if (!right) {
      return left;
    }
    if (!left) {
      return right;
    }
    if (right.startsWith(left)) {
      return right;
    }
    if (left.endsWith(right)) {
      return left;
    }
    const leftLower = left.toLowerCase();
    const rightLower = right.toLowerCase();

    if (leftLower.includes(rightLower)) {
      return left;
    }
    if (rightLower.includes(leftLower)) {
      return right;
    }

    const maxOverlap = Math.min(left.length, right.length);
    for (let len = maxOverlap; len >= 8; len -= 1) {
      if (leftLower.slice(-len) === rightLower.slice(0, len)) {
        return `${left}${right.slice(len)}`.replace(/\s+/g, " ").trim();
      }
    }

    return `${left} ${right}`.replace(/\s+/g, " ").trim();
  }

  #sanitizeText(text) {
    let cleaned = String(text || "")
      .replace(/\*\*/g, "")
      .replace(/`+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    cleaned = cleaned.replace(/^as cubey[:,]?\s*/i, "").trim();
    return cleaned;
  }

  #normalizeText(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  #handleServerMessage(message) {
    const serverContent = message?.serverContent;
    if (!serverContent) {
      return;
    }

    // Emit thinking state based on whether model is generating
    const isThinking =
      !serverContent.interrupted &&
      (serverContent.modelTurn ||
        serverContent.model_turn ||
        serverContent.outputAudioTranscription ||
        serverContent.output_audio_transcription);
    this.emitter.emit("thinking", !!isThinking);

    if (serverContent.interrupted) {
      this.emitter.emit("interruption", "model_interrupted");
      this.pendingTranscript = "";
      this.pendingPartText = "";
    }

    const outputTranscript =
      serverContent.outputAudioTranscription?.text ||
      serverContent.output_audio_transcription?.text ||
      serverContent.outputTranscription?.text ||
      serverContent.output_transcription?.text;
    const normalizedOutputTranscript = outputTranscript?.trim() || "";
    const hasOutputTranscript = Boolean(normalizedOutputTranscript);

    if (hasOutputTranscript) {
      this.pendingTranscript = this.#mergeText(this.pendingTranscript, normalizedOutputTranscript);
    }

    const parts = serverContent.modelTurn?.parts || serverContent.model_turn?.parts || [];
    for (const part of parts) {
      const text = part?.text;
      if (!hasOutputTranscript && text?.trim()) {
        this.pendingPartText = this.#mergeText(this.pendingPartText, text.trim());
      }

      const inlineData = part?.inlineData || part?.inline_data;
      const mimeType = inlineData?.mimeType || inlineData?.mime_type;
      const data = inlineData?.data;

      if (data && mimeType?.startsWith("audio/")) {
        this.emitter.emit("audio", { data, mimeType });
      }
    }

    const turnComplete = Boolean(serverContent.turnComplete || serverContent.turn_complete);
    const turnCompleteReason =
      serverContent.turnCompleteReason || serverContent.turn_complete_reason || "";
    if (turnComplete) {
      const finalText = this.#sanitizeText(this.pendingTranscript || this.pendingPartText || "");
      const normalizedFinalText = this.#normalizeText(finalText);

      // Check if this text is substantially different from last delivered.
      // Use substring containment check to catch partial repeats.
      const isDuplicate =
        normalizedFinalText &&
        (normalizedFinalText === this.lastDeliveredNormalized ||
          this.lastDeliveredNormalized.includes(normalizedFinalText) ||
          normalizedFinalText.includes(this.lastDeliveredNormalized));

      const canEmitText =
        turnCompleteReason !== "NEED_MORE_INPUT" && normalizedFinalText.length >= 3 && !isDuplicate;

      if (canEmitText) {
        this.emitter.emit("text", finalText);
        this.lastDeliveredText = finalText;
        this.lastDeliveredNormalized = normalizedFinalText;
      }
      this.pendingTranscript = "";
      this.pendingPartText = "";
    }
  }
}
