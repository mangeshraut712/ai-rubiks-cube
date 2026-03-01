import { EventEmitter } from "events";
import { GoogleGenAI, Modality } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_PRIMARY_MODEL =
  process.env.GEMINI_LIVE_MODEL || "gemini-2.0-flash-live-preview-04-09";
const DEFAULT_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash-exp";

/**
 * Wraps Gemini Live API bidirectional streaming for audio + video tutoring.
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
    this.fallbackModel = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: DEFAULT_FALLBACK_MODEL
    });

    this.session = null;
    this.emitter = new EventEmitter();
    this.isOpen = false;
    this.frameInputMode = "auto";
  }

  /**
   * Starts the live session with model fallback logic.
   * Enhanced with better error handling for challenge reliability.
   * @returns {Promise<void>}
   */
  async startSession() {
    const candidateModels = [this.model, DEFAULT_FALLBACK_MODEL].filter(Boolean);
    let lastError = null;

    for (const candidateModel of candidateModels) {
      try {
        console.log(`[gemini-live] Attempting to connect with model: ${candidateModel}`);

        this.session = await this.ai.live.connect({
          model: candidateModel,
          config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            systemInstruction: {
              role: "system",
              parts: [{ text: this.systemPrompt }]
            },
            // Set generation controls directly on LiveConnectConfig.
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 256
          },
          callbacks: {
            onopen: () => {
              this.isOpen = true;
              this.activeModel = candidateModel;
              console.log(`[gemini-live] Connected successfully with model: ${candidateModel}`);
              this.emitter.emit("open", { model: candidateModel });
            },
            onclose: () => {
              this.isOpen = false;
              console.log("[gemini-live] Connection closed");
              this.emitter.emit("close");
            },
            onerror: (errorEvent) => {
              console.error("[gemini-live] Connection error:", errorEvent?.error ?? errorEvent);
              this.emitter.emit("error", errorEvent?.error ?? errorEvent);
            },
            onmessage: (message) => {
              this.#handleServerMessage(message);
            }
          }
        });

        return;
      } catch (error) {
        lastError = error;
        console.error("[gemini-live] connect failed", {
          model: candidateModel,
          error: error?.message ?? String(error)
        });
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

    const encoded = Buffer.from(pcmBuffer).toString("base64");
    this.session.sendRealtimeInput({
      audio: {
        data: encoded,
        mimeType: "audio/pcm;rate=16000"
      }
    });
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
    } catch (_mediaError) {
      this.session.sendRealtimeInput({ video: framePayload });
      this.frameInputMode = "video";
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

    this.session.sendClientContent({
      turns: [
        {
          role: "user",
          parts: [{ text: text.trim() }]
        }
      ],
      turnComplete
    });
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
      const response = await this.fallbackModel.generateContent([
        {
          text: "You are Cubey. From this Rubik's Cube frame, identify the most likely recent move mistake and provide one corrective move instruction. Keep it short."
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64jpeg
          }
        }
      ]);

      return response?.response?.text?.() || "I could not detect the mistake clearly. Please rotate the cube and ask again.";
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
    this.emitter.removeAllListeners();
  }

  #handleServerMessage(message) {
    const serverContent = message?.serverContent;
    if (!serverContent) {
      return;
    }

    // Emit thinking state based on whether model is generating
    const isThinking = !serverContent.interrupted && (
      serverContent.modelTurn ||
      serverContent.model_turn ||
      serverContent.outputAudioTranscription ||
      serverContent.output_audio_transcription
    );
    this.emitter.emit("thinking", !!isThinking);

    if (serverContent.interrupted) {
      this.emitter.emit("interruption", "model_interrupted");
    }

    const outputTranscript =
      serverContent.outputAudioTranscription?.text ||
      serverContent.output_audio_transcription?.text ||
      serverContent.outputTranscription?.text ||
      serverContent.output_transcription?.text;

    if (outputTranscript?.trim()) {
      this.emitter.emit("text", outputTranscript.trim());
    }

    const parts = serverContent.modelTurn?.parts || serverContent.model_turn?.parts || [];
    for (const part of parts) {
      const text = part?.text;
      if (text?.trim()) {
        this.emitter.emit("text", text.trim());
      }

      const inlineData = part?.inlineData || part?.inline_data;
      const mimeType = inlineData?.mimeType || inlineData?.mime_type;
      const data = inlineData?.data;

      if (data && mimeType?.startsWith("audio/")) {
        this.emitter.emit("audio", { data, mimeType });
      }
    }
  }
}
