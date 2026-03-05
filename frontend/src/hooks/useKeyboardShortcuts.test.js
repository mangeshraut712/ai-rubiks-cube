/**
 * Keyboard Shortcuts Hook Tests
 * 2026: Testing keyboard event handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts", () => {
  const mockHandlers = {
    onMove: vi.fn(),
    onScramble: vi.fn(),
    onSolve: vi.fn(),
    onReset: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onHint: vi.fn(),
    onToggleChallenge: vi.fn(),
    onToggleDarkMode: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup any remaining event listeners
    window.removeEventListener("keydown", () => {});
  });

  it("should return shortcuts object", () => {
    const { result } = renderHook(() => useKeyboardShortcuts(mockHandlers));

    expect(result.current.shortcuts).toBeDefined();
    expect(result.current.shortcuts.moves).toBeDefined();
    expect(result.current.shortcuts.session).toBeDefined();
    expect(result.current.shortcuts.edit).toBeDefined();
    expect(result.current.shortcuts.features).toBeDefined();
  });

  it("should handle basic cube moves", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const moves = [
      { key: "u", expected: "U" },
      { key: "r", expected: "R" },
      { key: "f", expected: "F" },
      { key: "d", expected: "D" },
      { key: "l", expected: "L" },
      { key: "b", expected: "B" }
    ];

    moves.forEach(({ key, expected }) => {
      const event = new KeyboardEvent("keydown", { key });
      window.dispatchEvent(event);
      expect(mockHandlers.onMove).toHaveBeenCalledWith(expected);
    });
  });

  it("should handle prime moves with shift", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const moves = [
      { key: "U", shiftKey: true, expected: "U'" },
      { key: "R", shiftKey: true, expected: "R'" },
      { key: "F", shiftKey: true, expected: "F'" }
    ];

    moves.forEach(({ key, shiftKey, expected }) => {
      const event = new KeyboardEvent("keydown", { key, shiftKey });
      window.dispatchEvent(event);
      expect(mockHandlers.onMove).toHaveBeenCalledWith(expected);
    });
  });

  it("should handle undo with Ctrl+Z", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onUndo).toHaveBeenCalled();
  });

  it("should handle redo with Ctrl+Y", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", { key: "y", ctrlKey: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onRedo).toHaveBeenCalled();
  });

  it("should handle redo with Ctrl+Shift+Z", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", { key: "Z", ctrlKey: true, shiftKey: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onRedo).toHaveBeenCalled();
  });

  it("should handle hint with H key", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", { key: "h" });
    window.dispatchEvent(event);

    expect(mockHandlers.onHint).toHaveBeenCalled();
  });

  it("should handle challenge mode toggle", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", { key: "C", shiftKey: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onToggleChallenge).toHaveBeenCalled();
  });

  it("should handle dark mode toggle", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const event = new KeyboardEvent("keydown", { key: "D", shiftKey: true });
    window.dispatchEvent(event);

    expect(mockHandlers.onToggleDarkMode).toHaveBeenCalled();
  });

  it("should not trigger shortcuts when typing in input", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", { key: "u", bubbles: true });
    input.dispatchEvent(event);

    expect(mockHandlers.onMove).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("should not trigger shortcuts when typing in textarea", () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent("keydown", { key: "u", bubbles: true });
    textarea.dispatchEvent(event);

    expect(mockHandlers.onMove).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });
});
