/**
 * Requests webcam + microphone stream for live tutoring.
 * Optimized for Gemini Live API with balanced quality/bandwidth.
 * Enhanced with better error handling and permissions handling.
 * @returns {Promise<MediaStream>}
 */
export async function requestMediaStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: "user",
        frameRate: { ideal: 15, max: 30 }
      },
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        latency: 0
      }
    });
  } catch (error) {
    console.error("[webrtcHelpers] Media stream request failed:", error);

    // Try with reduced requirements if full request fails
    if (error.name === "NotAllowedError") {
      throw new Error("Camera/microphone permission denied. Please allow access and try again.");
    }

    // Fallback: try audio only
    try {
      console.log("[webrtcHelpers] Trying audio-only fallback");
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch (audioError) {
      console.error("[webrtcHelpers] Audio fallback also failed:", audioError);
      throw new Error("Could not access microphone. Please check permissions.");
    }
  }
}

// Frame comparison for motion detection - avoids sending duplicate frames
let lastFrameHash = null;

/**
 * Simple frame difference detection using average color
 * Returns true if frame is significantly different from last frame
 */
function isFrameDifferent(canvasEl, threshold = 0.02) {
  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
  const data = imageData.data;

  // Sample every 16th pixel for performance
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 16) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    count++;
  }

  const avg = sum / count / 255;

  if (lastFrameHash === null) {
    lastFrameHash = avg;
    return true;
  }

  const diff = Math.abs(avg - lastFrameHash);
  lastFrameHash = avg;
  return diff > threshold;
}

/**
 * Captures the latest webcam frame as base64 JPEG.
 * Now includes motion detection to reduce bandwidth.
 * Enhanced with better error handling.
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLCanvasElement} canvasEl
 * @param {number} [quality]
 * @param {boolean} [checkMotion]
 * @returns {string | null}
 */
export function captureVideoFrame(videoEl, canvasEl, quality = 0.7, checkMotion = true) {
  if (!videoEl || !canvasEl || videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
    return null;
  }

  // Downscale for bandwidth efficiency (Gemini doesn't need 4K)
  const maxWidth = 640;
  const maxHeight = 480;

  let width = videoEl.videoWidth;
  let height = videoEl.videoHeight;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  canvasEl.width = width;
  canvasEl.height = height;

  const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return null;
  }

  ctx.drawImage(videoEl, 0, 0, width, height);

  // Skip frame if not enough motion (for bandwidth savings)
  if (checkMotion && !isFrameDifferent(canvasEl)) {
    return null;
  }

  try {
    const dataUrl = canvasEl.toDataURL("image/jpeg", quality);
    return dataUrl.split(",")[1] || null;
  } catch (error) {
    console.warn("[webrtcHelpers] Frame capture failed:", error);
    return null;
  }
}

function downsampleBuffer(float32Data, inputSampleRate, outputSampleRate) {
  if (outputSampleRate >= inputSampleRate) {
    return float32Data;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const resultLength = Math.round(float32Data.length / ratio);
  const result = new Float32Array(resultLength);

  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < resultLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let i = offsetBuffer; i < nextOffsetBuffer && i < float32Data.length; i += 1) {
      accum += float32Data[i];
      count += 1;
    }

    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult += 1;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function floatTo16BitPcm(float32Data) {
  const pcm = new Int16Array(float32Data.length);

  for (let i = 0; i < float32Data.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32Data[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return pcm;
}

/**
 * Starts ScriptProcessor-based PCM capture (16kHz mono Int16) from a media stream.
 * Enhanced with better audio level detection.
 * @param {MediaStream} stream
 * @param {(chunk: Uint8Array) => void} onChunk
 * @param {(level: number) => void} [onMicLevel]
 * @returns {{stop: () => Promise<void>}}
 */
export function startPcmCapture(stream, onChunk, onMicLevel = () => {}) {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextCtor();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  const sink = audioContext.createMediaStreamDestination();

  let noiseFloor = 0.01;
  let noiseFloorInitialized = false;
  source.connect(processor);
  processor.connect(sink);

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);

    let rms = 0;
    for (let i = 0; i < input.length; i += 1) {
      rms += input[i] * input[i];
    }
    rms = Math.sqrt(rms / input.length);

    if (!noiseFloorInitialized) {
      noiseFloor = rms;
      noiseFloorInitialized = true;
    } else if (rms < noiseFloor * 1.8) {
      noiseFloor = noiseFloor * 0.95 + rms * 0.05;
    }

    const adaptedLevel = Math.max(0, (rms - noiseFloor) / Math.max(0.0001, 1 - noiseFloor));
    onMicLevel(Math.min(1, adaptedLevel * 2));

    const resampled = downsampleBuffer(input, audioContext.sampleRate, 16000);
    const pcm16 = floatTo16BitPcm(resampled);

    // Only send if there's actual audio (not silence)
    const maxAmplitude = Math.max(...pcm16.map(Math.abs));
    if (maxAmplitude > 100) {
      onChunk(new Uint8Array(pcm16.buffer));
    }
  };

  return {
    async stop() {
      try {
        processor.onaudioprocess = null;
        processor.disconnect();
        source.disconnect();
        sink.disconnect();
      } catch (error) {
        console.warn("[webrtcHelpers] audio graph cleanup warning", error);
      }

      try {
        await audioContext.close();
      } catch (error) {
        console.warn("[webrtcHelpers] audioContext close warning", error);
      }
    }
  };
}

/**
 * Encodes an object header + binary payload into a single ws binary frame.
 * Format: [4-byte big-endian header length][header JSON][binary payload]
 * @param {Record<string, unknown>} header
 * @param {Uint8Array} payload
 * @returns {ArrayBuffer}
 */
export function encodeBinaryEnvelope(header, payload) {
  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const totalLength = 4 + headerBytes.byteLength + payload.byteLength;
  const output = new Uint8Array(totalLength);
  const view = new DataView(output.buffer);

  view.setUint32(0, headerBytes.byteLength);
  output.set(headerBytes, 4);
  output.set(payload, 4 + headerBytes.byteLength);

  return output.buffer;
}

/**
 * Checks if the browser supports the required media APIs
 * @returns {{supported: boolean, missing: string[]}}
 */
export function checkMediaSupport() {
  const missing = [];

  if (!navigator.mediaDevices) {
    missing.push("MediaDevices API");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push("getUserMedia");
  }

  if (!window.AudioContext && !window.webkitAudioContext) {
    missing.push("Web Audio API");
  }

  if (!window.WebSocket) {
    missing.push("WebSocket");
  }

  return {
    supported: missing.length === 0,
    missing
  };
}
