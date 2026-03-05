/**
 * Voice command recognition hook
 * 2026: Using Web Speech API with advanced command parsing
 */
import { useEffect, useRef, useCallback, useState } from "react";

const VOICE_COMMANDS = {
  // Moves
  "turn up": "U",
  "turn you": "U",
  up: "U",
  "turn down": "D",
  down: "D",
  "turn left": "L",
  left: "L",
  "turn right": "R",
  right: "R",
  "turn front": "F",
  front: "F",
  "turn back": "B",
  back: "B",

  // Prime moves
  "turn up prime": "U'",
  "turn you prime": "U'",
  "up prime": "U'",
  "up counterclockwise": "U'",
  "turn down prime": "D'",
  "down prime": "D'",
  "down counterclockwise": "D'",
  "turn left prime": "L'",
  "left prime": "L'",
  "left counterclockwise": "L'",
  "turn right prime": "R'",
  "right prime": "R'",
  "right counterclockwise": "R'",
  "turn front prime": "F'",
  "front prime": "F'",
  "front counterclockwise": "F'",
  "turn back prime": "B'",
  "back prime": "B'",
  "back counterclockwise": "B'",

  // Double moves
  "turn up twice": "U2",
  "up twice": "U2",
  "turn down twice": "D2",
  "down twice": "D2",
  "turn left twice": "L2",
  "left twice": "L2",
  "turn right twice": "R2",
  "right twice": "R2",
  "turn front twice": "F2",
  "front twice": "F2",
  "turn back twice": "B2",
  "back twice": "B2",

  // Control commands
  reset: "RESET",
  scramble: "SCRAMBLE",
  solve: "SOLVE",
  hint: "HINT",
  undo: "UNDO",
  redo: "REDO",
  start: "START",
  stop: "STOP",
  pause: "PAUSE",
  resume: "RESUME"
};

export function useVoiceCommands({ onCommand, enabled = true }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const commandBufferRef = useRef([]);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  useEffect(() => {
    if (!isSupported || !enabled) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if still enabled
      if (enabled) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Already started
          }
        }, 100);
      }
    };

    recognition.onerror = (event) => {
      console.error("[VoiceCommands] Error:", event.error);
      setError(event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const results = event.results;
      const latestResult = results[results.length - 1];

      // Get all alternatives for better matching
      const alternatives = [];
      for (let i = 0; i < latestResult.length; i++) {
        alternatives.push(latestResult[i].transcript.toLowerCase().trim());
      }

      setTranscript(alternatives[0]);

      // Check for commands
      if (latestResult.isFinal) {
        for (const alt of alternatives) {
          const command = parseCommand(alt);
          if (command) {
            onCommand?.(command);
            commandBufferRef.current.push({
              command,
              transcript: alt,
              timestamp: Date.now()
            });
            break;
          }
        }
      }
    };

    recognitionRef.current = recognition;

    if (enabled) {
      try {
        recognition.start();
      } catch (e) {
        console.warn("[VoiceCommands] Failed to start:", e);
      }
    }

    return () => {
      try {
        recognition.stop();
      } catch {
        // Not running
      }
    };
  }, [isSupported, enabled, onCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("[VoiceCommands] Start failed:", e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("[VoiceCommands] Stop failed:", e);
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    commandHistory: commandBufferRef.current
  };
}

function parseCommand(transcript) {
  const normalized = transcript.toLowerCase().trim();

  // Direct match
  if (VOICE_COMMANDS[normalized]) {
    return VOICE_COMMANDS[normalized];
  }

  // Fuzzy matching - check if any command is contained in transcript
  for (const [phrase, command] of Object.entries(VOICE_COMMANDS)) {
    if (normalized.includes(phrase)) {
      return command;
    }
  }

  // Parse single letters
  const moveMatch = normalized.match(/\b([udlrfb])\b/i);
  if (moveMatch) {
    const move = moveMatch[1].toUpperCase();
    if (normalized.includes("prime") || normalized.includes("counter")) {
      return move + "'";
    }
    if (
      normalized.includes("twice") ||
      normalized.includes("double") ||
      normalized.includes("two")
    ) {
      return move + "2";
    }
    return move;
  }

  return null;
}

export default useVoiceCommands;
