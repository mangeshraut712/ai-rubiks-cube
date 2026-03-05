/**
 * Comprehensive keyboard shortcuts hook
 * 2026: Modern keyboard handling with better accessibility
 */
import { useEffect, useCallback } from "react";
import { useCubeStore } from "../store/cubeStore";

const MOVE_KEYS = {
  u: "U",
  "Shift+u": "U'",
  r: "R",
  "Shift+r": "R'",
  f: "F",
  "Shift+f": "F'",
  d: "D",
  "Shift+d": "D'",
  l: "L",
  "Shift+l": "L'",
  b: "B",
  "Shift+b": "B'"
};

export function useKeyboardShortcuts({
  onMove,
  onScramble,
  onSolve,
  onReset,
  onUndo,
  onRedo,
  onHint,
  onToggleChallenge,
  onToggleDarkMode,
  onToggleSettings,
  onStartSession,
  onEndSession
}) {
  const store = useCubeStore();

  const handleKeyDown = useCallback(
    (event) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const modifier = event.shiftKey ? "Shift+" : "";
      const combo = modifier + key;

      // Number keys for double moves (2+key)
      if (event.key === "2") {
        // Wait for next key
        return;
      }

      // Check for non-move shortcuts first (they take priority)
      // Dark mode toggle with Shift+D
      if (key === "d" && event.shiftKey && onToggleDarkMode) {
        event.preventDefault();
        onToggleDarkMode();
        return;
      }

      // Cube moves
      if (MOVE_KEYS[combo] && onMove) {
        event.preventDefault();
        onMove(MOVE_KEYS[combo]);
        return;
      }

      // Handle other shortcuts
      switch (key) {
        // Session control
        case " ":
          event.preventDefault();
          if (store.sessionActive) {
            onEndSession?.();
          } else {
            onStartSession?.();
          }
          break;

        // Scramble and solve
        case "s":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              onScramble?.();
            } else {
              onSolve?.();
            }
          }
          break;

        // Reset
        case "escape":
          if (!store.sessionActive) {
            event.preventDefault();
            onReset?.();
          }
          break;

        // Undo/Redo
        case "z":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
          }
          break;

        case "y":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onRedo?.();
          }
          break;

        // Hint
        case "h":
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            onHint?.();
          }
          break;

        // Challenge mode
        case "c":
          if (event.shiftKey) {
            event.preventDefault();
            onToggleChallenge?.();
          }
          break;

        // Settings
        case ",":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onToggleSettings?.();
          }
          break;

        // Help
        case "?":
          event.preventDefault();
          // Could open help modal
          break;

        // Camera angles
        case "arrowup":
          if (event.shiftKey) {
            event.preventDefault();
            // Rotate camera up
          }
          break;

        case "arrowdown":
          if (event.shiftKey) {
            event.preventDefault();
            // Rotate camera down
          }
          break;

        case "arrowleft":
          if (event.shiftKey) {
            event.preventDefault();
            // Rotate camera left
          }
          break;

        case "arrowright":
          if (event.shiftKey) {
            event.preventDefault();
            // Rotate camera right
          }
          break;

        default:
          break;
      }
    },
    [
      onMove,
      onScramble,
      onSolve,
      onReset,
      onUndo,
      onRedo,
      onHint,
      onToggleChallenge,
      onToggleDarkMode,
      onToggleSettings,
      onStartSession,
      onEndSession,
      store.sessionActive
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: {
      moves: MOVE_KEYS,
      session: {
        Space: "Start/End session",
        Esc: "Reset cube"
      },
      edit: {
        "Ctrl+Z": "Undo",
        "Ctrl+Shift+Z": "Redo",
        "Ctrl+Y": "Redo"
      },
      features: {
        "Shift+C": "Toggle challenge mode",
        "Shift+D": "Toggle dark mode",
        H: "Request hint",
        "Ctrl+,": "Settings"
      }
    }
  };
}

export default useKeyboardShortcuts;
