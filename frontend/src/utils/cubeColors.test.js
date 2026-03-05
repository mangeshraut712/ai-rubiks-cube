/**
 * Cube Colors Utility Tests
 * 2026: Unit tests for cube color utilities
 */
import { describe, it, expect } from "vitest";
import {
  FACE_ORDER,
  FACE_TO_HEX,
  createSolvedCubeState,
  faceFromMove,
  colorForFaceLetter
} from "./cubeColors";

describe("cubeColors", () => {
  describe("FACE_ORDER", () => {
    it("should have correct face order", () => {
      expect(FACE_ORDER).toEqual(["U", "R", "F", "D", "L", "B"]);
    });
  });

  describe("FACE_TO_HEX", () => {
    it("should have valid hex colors for all faces", () => {
      FACE_ORDER.forEach((face) => {
        expect(FACE_TO_HEX[face]).toBeDefined();
        expect(FACE_TO_HEX[face]).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it("should have standard Rubik's colors", () => {
      expect(FACE_TO_HEX.U).toBe("#FFFFFF"); // White
      expect(FACE_TO_HEX.R).toBe("#B71234"); // Red
      expect(FACE_TO_HEX.F).toBe("#009B48"); // Green
      expect(FACE_TO_HEX.D).toBe("#FFD500"); // Yellow
      expect(FACE_TO_HEX.L).toBe("#FF5800"); // Orange
      expect(FACE_TO_HEX.B).toBe("#0046AD"); // Blue
    });
  });

  describe("createSolvedCubeState", () => {
    it("should create a 6x3x3 cube structure", () => {
      const state = createSolvedCubeState();

      expect(Object.keys(state)).toHaveLength(6);
      FACE_ORDER.forEach((face) => {
        expect(state[face]).toBeDefined();
        expect(state[face]).toHaveLength(3);
        state[face].forEach((row) => {
          expect(row).toHaveLength(3);
          row.forEach((sticker) => {
            expect(sticker).toBe(face);
          });
        });
      });
    });

    it("should create a solved state where all stickers match their face", () => {
      const state = createSolvedCubeState();

      FACE_ORDER.forEach((face) => {
        state[face].forEach((row) => {
          row.forEach((sticker) => {
            expect(sticker).toBe(face);
          });
        });
      });
    });
  });

  describe("faceFromMove", () => {
    it("should extract face from basic moves", () => {
      expect(faceFromMove("U")).toBe("U");
      expect(faceFromMove("R")).toBe("R");
      expect(faceFromMove("F")).toBe("F");
      expect(faceFromMove("D")).toBe("D");
      expect(faceFromMove("L")).toBe("L");
      expect(faceFromMove("B")).toBe("B");
    });

    it("should extract face from prime moves", () => {
      expect(faceFromMove("U'")).toBe("U");
      expect(faceFromMove("R'")).toBe("R");
      expect(faceFromMove("F'")).toBe("F");
    });

    it("should extract face from double moves", () => {
      expect(faceFromMove("U2")).toBe("U");
      expect(faceFromMove("R2")).toBe("R");
      expect(faceFromMove("F2")).toBe("F");
    });

    it("should handle lowercase input", () => {
      expect(faceFromMove("u")).toBe("U");
      expect(faceFromMove("r'")).toBe("R");
      expect(faceFromMove("f2")).toBe("F");
    });

    it("should return null for invalid moves", () => {
      expect(faceFromMove("")).toBeNull();
      expect(faceFromMove(null)).toBeNull();
      expect(faceFromMove(undefined)).toBeNull();
      expect(faceFromMove("X")).toBeNull();
      expect(faceFromMove("invalid")).toBeNull();
    });
  });

  describe("colorForFaceLetter", () => {
    it("should return correct hex color for each face", () => {
      FACE_ORDER.forEach((face) => {
        expect(colorForFaceLetter(face)).toBe(FACE_TO_HEX[face]);
      });
    });

    it("should return default color for invalid face", () => {
      expect(colorForFaceLetter("X")).toBe("#444444");
      expect(colorForFaceLetter("")).toBe("#444444");
      expect(colorForFaceLetter(null)).toBe("#444444");
    });
  });
});
