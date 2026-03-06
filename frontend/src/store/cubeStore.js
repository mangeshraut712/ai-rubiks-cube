/**
 * Zustand store for global cube state management
 * Modern state management for 2026
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createSolvedCubeState } from "../utils/cubeColors";

function getInitialDarkMode() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useCubeStore = create(
  immer(
    persist(
      (set, get) => ({
        // Cube state
        cubeState: createSolvedCubeState(),
        moveHistory: [],
        redoStack: [],

        // Session state
        sessionActive: false,
        connectionStatus: "disconnected",
        challengeMode: false,

        // UI state
        isDarkMode: getInitialDarkMode(),
        isAnimating: false,
        activeMove: "",
        hintText: "",
        latestInstruction: "",

        // Statistics
        statistics: {
          totalSessions: 0,
          totalMoves: 0,
          totalTimeSeconds: 0,
          solvedCubes: 0,
          bestTime: null,
          averageTime: null,
          moveAccuracy: 100
        },

        // Tutorial
        tutorialMode: false,
        tutorialStep: 0,
        tutorialCompleted: false,

        // Settings
        settings: {
          autoRotate: false,
          soundEnabled: true,
          voiceEnabled: true,
          hapticsEnabled: true,
          highContrast: false,
          animationSpeed: 420,
          showHints: true
        },

        // Actions
        setCubeState: (state) => set({ cubeState: state }),

        applyMove: (move, source = "user") => {
          set((state) => {
            state.moveHistory.push({
              move,
              source,
              timestamp: Date.now(),
              stateBefore: JSON.parse(JSON.stringify(state.cubeState))
            });
            state.redoStack = []; // Clear redo on new move
            state.statistics.totalMoves++;
          });
        },

        undoMove: () => {
          const { moveHistory } = get();
          if (moveHistory.length === 0) return null;

          const lastMove = moveHistory[moveHistory.length - 1];
          set((state) => {
            state.redoStack.push(lastMove);
            state.moveHistory.pop();
            if (lastMove.stateBefore) {
              state.cubeState = lastMove.stateBefore;
            }
          });
          return lastMove;
        },

        redoMove: () => {
          const { redoStack } = get();
          if (redoStack.length === 0) return null;

          const move = redoStack[redoStack.length - 1];
          set((state) => {
            state.moveHistory.push(move);
            state.redoStack.pop();
          });
          return move;
        },

        resetCube: () =>
          set({
            cubeState: createSolvedCubeState(),
            moveHistory: [],
            redoStack: [],
            activeMove: ""
          }),

        setSessionActive: (active) => set({ sessionActive: active }),
        setConnectionStatus: (status) => set({ connectionStatus: status }),
        setChallengeMode: (enabled) => set({ challengeMode: enabled }),

        toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

        setActiveMove: (move) => set({ activeMove: move, isAnimating: !!move }),
        setHintText: (text) => set({ hintText: text }),
        setLatestInstruction: (text) => set({ latestInstruction: text }),

        updateStatistics: (stats) =>
          set((state) => {
            Object.assign(state.statistics, stats);
          }),

        recordSessionComplete: (timeSeconds) =>
          set((state) => {
            state.statistics.totalSessions++;
            state.statistics.totalTimeSeconds += timeSeconds;
            state.statistics.solvedCubes++;

            if (!state.statistics.bestTime || timeSeconds < state.statistics.bestTime) {
              state.statistics.bestTime = timeSeconds;
            }

            const totalSessions = state.statistics.solvedCubes;
            const currentAvg = state.statistics.averageTime || 0;
            state.statistics.averageTime =
              Math.round(((currentAvg * (totalSessions - 1) + timeSeconds) / totalSessions) * 100) /
              100;
          }),

        // Tutorial actions
        startTutorial: () => set({ tutorialMode: true, tutorialStep: 0 }),
        nextTutorialStep: () =>
          set((state) => {
            state.tutorialStep++;
            if (state.tutorialStep >= 8) {
              state.tutorialCompleted = true;
              state.tutorialMode = false;
            }
          }),
        skipTutorial: () => set({ tutorialMode: false, tutorialCompleted: true }),

        // Settings actions
        updateSettings: (newSettings) =>
          set((state) => {
            Object.assign(state.settings, newSettings);
          }),

        // Import/Export
        exportState: () => {
          const { cubeState, moveHistory, statistics } = get();
          return JSON.stringify({ cubeState, moveHistory, statistics }, null, 2);
        },

        importState: (json) => {
          try {
            const data = JSON.parse(json);
            if (data.cubeState) set({ cubeState: data.cubeState });
            if (data.moveHistory) set({ moveHistory: data.moveHistory });
            if (data.statistics) set({ statistics: data.statistics });
            return true;
          } catch (e) {
            console.error("Failed to import state:", e);
            return false;
          }
        }
      }),
      {
        name: "cube-store",
        partialize: (state) => ({
          statistics: state.statistics,
          isDarkMode: state.isDarkMode,
          settings: state.settings,
          tutorialCompleted: state.tutorialCompleted
        })
      }
    )
  )
);

// Selector hooks for performance
export const useCubeState = () => useCubeStore((state) => state.cubeState);
export const useMoveHistory = () => useCubeStore((state) => state.moveHistory);
export const useSessionStatus = () =>
  useCubeStore((state) => ({
    sessionActive: state.sessionActive,
    connectionStatus: state.connectionStatus
  }));
export const useSettings = () => useCubeStore((state) => state.settings);
export const useStatistics = () => useCubeStore((state) => state.statistics);
