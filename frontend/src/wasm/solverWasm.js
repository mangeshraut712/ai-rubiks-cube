/**
 * WebAssembly Solver Interface
 * 2026: High-performance Rust/WASM solver for 2x2 and 3x3 cubes
 */

// WASM module cache
let solverInstance = null;

/**
 * Initialize the WASM solver
 * @returns {Promise<boolean>} Success status
 */
export async function initWasmSolver() {
  try {
    // Check for WASM support
    if (typeof WebAssembly !== "object") {
      console.warn("[WASM] WebAssembly not supported, falling back to JS solver");
      return false;
    }

    // Dynamic import of WASM module
    const wasmLoader = await import("./rubiks-solver.wasm?init");

    if (wasmLoader && wasmLoader.default) {
      solverInstance = await wasmLoader.default();
      console.log("[WASM] Solver initialized successfully");
      return true;
    }

    return false;
  } catch (error) {
    console.warn("[WASM] Failed to initialize:", error);
    return false;
  }
}

/**
 * Solve 2x2 cube using WASM
 * @param {string} state - 24-character state string
 * @returns {Promise<string[] | null>} Solution moves or null
 */
export async function solve2x2Wasm(state) {
  if (!solverInstance) {
    const initialized = await initWasmSolver();
    if (!initialized) return null;
  }

  try {
    const startTime = performance.now();

    // Call WASM function (would be exported from Rust)
    const result = solverInstance.exports.solve_2x2(state);

    const endTime = performance.now();
    console.log(`[WASM] 2x2 solved in ${(endTime - startTime).toFixed(2)}ms`);

    return parseWasmResult(result);
  } catch (error) {
    console.error("[WASM] 2x2 solve failed:", error);
    return null;
  }
}

/**
 * Solve 3x3 cube using WASM (Kociemba algorithm)
 * @param {string} faceString - 54-character face string
 * @returns {Promise<string[] | null>} Solution moves or null
 */
export async function solve3x3Wasm(faceString) {
  if (!solverInstance) {
    const initialized = await initWasmSolver();
    if (!initialized) return null;
  }

  try {
    const startTime = performance.now();

    // Call WASM function for 3x3 solving
    const result = solverInstance.exports.solve_3x3(faceString);

    const endTime = performance.now();
    console.log(`[WASM] 3x3 solved in ${(endTime - startTime).toFixed(2)}ms`);

    return parseWasmResult(result);
  } catch (error) {
    console.error("[WASM] 3x3 solve failed:", error);
    return null;
  }
}

/**
 * Generate scramble sequence using WASM
 * @param {number} length - Number of moves
 * @returns {Promise<string[] | null>} Scramble moves
 */
export async function generateScrambleWasm(length = 20) {
  if (!solverInstance) {
    const initialized = await initWasmSolver();
    if (!initialized) return null;
  }

  try {
    const result = solverInstance.exports.generate_scramble(length);
    return parseWasmResult(result);
  } catch (error) {
    console.error("[WASM] Scramble generation failed:", error);
    return null;
  }
}

/**
 * Check if cube is solvable using WASM
 * @param {string} state - Cube state
 * @returns {Promise<boolean>} Is solvable
 */
export async function isValidStateWasm(state) {
  if (!solverInstance) {
    return false;
  }

  try {
    return solverInstance.exports.is_valid_state(state) === 1;
  } catch {
    return false;
  }
}

/**
 * Parse WASM result (pointer to string array)
 * @param {number} ptr - WASM memory pointer
 * @returns {string[]} Parsed moves
 */
function parseWasmResult(ptr) {
  if (!solverInstance || ptr === 0) return null;

  try {
    // Read length from first 4 bytes
    const memory = new Uint32Array(solverInstance.exports.memory.buffer);
    const length = memory[ptr / 4];

    // Read string pointers
    const moves = [];
    const dataView = new DataView(solverInstance.exports.memory.buffer);

    for (let i = 0; i < length; i++) {
      const strPtr = memory[ptr / 4 + 1 + i];
      const str = readWasmString(strPtr, dataView);
      moves.push(str);
    }

    // Free WASM memory
    solverInstance.exports.free_result(ptr);

    return moves;
  } catch (error) {
    console.error("[WASM] Failed to parse result:", error);
    return null;
  }
}

/**
 * Read null-terminated string from WASM memory
 * @param {number} ptr - String pointer
 * @param {DataView} dataView - Memory data view
 * @returns {string} JavaScript string
 */
function readWasmString(ptr, dataView) {
  const bytes = [];
  let offset = ptr;

  while (true) {
    const byte = dataView.getUint8(offset);
    if (byte === 0) break;
    bytes.push(byte);
    offset++;
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Fallback JS solver (used when WASM unavailable)
 */
export function solve2x2JS(state) {
  return import("/legacy-2x2-solver/cube-core.js")
    .then(() => import("/legacy-2x2-solver/solver.js"))
    .then(() => {
      if (!globalThis.Legacy2x2Solver?.solveBFS) {
        throw new Error("Classic 2x2 solver fallback failed to initialize");
      }

      return globalThis.Legacy2x2Solver.solveBFS(state);
    });
}

/**
 * Auto-select best solver (WASM preferred, JS fallback)
 */
export async function solveCube(cubeSize, state) {
  // Try WASM first
  if (cubeSize === 2) {
    const wasmResult = await solve2x2Wasm(state);
    if (wasmResult) return wasmResult;

    // Fallback to JS
    return solve2x2JS(state);
  } else if (cubeSize === 3) {
    const wasmResult = await solve3x3Wasm(state);
    if (wasmResult) return wasmResult;

    // Fallback to kociemba
    return import("kociemba").then((kociemba) => {
      const solution = kociemba.solve(state);
      return solution.split(" ").filter(Boolean);
    });
  }

  throw new Error(`Unsupported cube size: ${cubeSize}`);
}

export default {
  initWasmSolver,
  solve2x2Wasm,
  solve3x3Wasm,
  generateScrambleWasm,
  isValidStateWasm,
  solveCube
};
