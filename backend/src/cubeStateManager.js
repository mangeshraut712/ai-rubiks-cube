import kociemba from "kociemba";

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
const AXIS_BY_FACE = {
  U: "y",
  D: "y",
  L: "x",
  R: "x",
  F: "z",
  B: "z"
};
const LAYER_VALUE_BY_FACE = {
  U: 1,
  D: -1,
  R: 1,
  L: -1,
  F: 1,
  B: -1
};

// Quarter-turn direction for clockwise face turns from the perspective of each face.
const CLOCKWISE_TURN_BY_FACE = {
  U: -1,
  D: 1,
  R: -1,
  L: 1,
  F: -1,
  B: 1
};

const MOVE_TOKEN_RE = /^([UDLRFB])(2|')?$/;

function createFace(fillValue) {
  return [
    [fillValue, fillValue, fillValue],
    [fillValue, fillValue, fillValue],
    [fillValue, fillValue, fillValue]
  ];
}

function createSolvedState() {
  return {
    U: createFace("U"),
    R: createFace("R"),
    F: createFace("F"),
    D: createFace("D"),
    L: createFace("L"),
    B: createFace("B")
  };
}

function createEmptyState() {
  return {
    U: createFace(null),
    R: createFace(null),
    F: createFace(null),
    D: createFace(null),
    L: createFace(null),
    B: createFace(null)
  };
}

function cloneState(state) {
  return {
    U: state.U.map((row) => [...row]),
    R: state.R.map((row) => [...row]),
    F: state.F.map((row) => [...row]),
    D: state.D.map((row) => [...row]),
    L: state.L.map((row) => [...row]),
    B: state.B.map((row) => [...row])
  };
}

function isLayerSticker(position, face) {
  const axis = AXIS_BY_FACE[face];
  const layerValue = LAYER_VALUE_BY_FACE[face];
  if (axis === "x") {
    return position.x === layerValue;
  }
  if (axis === "y") {
    return position.y === layerValue;
  }
  return position.z === layerValue;
}

function faceCellToSticker(face, row, col, color) {
  switch (face) {
    case "F":
      return {
        face,
        row,
        col,
        color,
        position: { x: col - 1, y: 1 - row, z: 1 },
        normal: { x: 0, y: 0, z: 1 }
      };
    case "B":
      return {
        face,
        row,
        col,
        color,
        position: { x: 1 - col, y: 1 - row, z: -1 },
        normal: { x: 0, y: 0, z: -1 }
      };
    case "U":
      return {
        face,
        row,
        col,
        color,
        position: { x: col - 1, y: 1, z: row - 1 },
        normal: { x: 0, y: 1, z: 0 }
      };
    case "D":
      return {
        face,
        row,
        col,
        color,
        position: { x: col - 1, y: -1, z: 1 - row },
        normal: { x: 0, y: -1, z: 0 }
      };
    case "R":
      return {
        face,
        row,
        col,
        color,
        position: { x: 1, y: 1 - row, z: 1 - col },
        normal: { x: 1, y: 0, z: 0 }
      };
    case "L":
      return {
        face,
        row,
        col,
        color,
        position: { x: -1, y: 1 - row, z: col - 1 },
        normal: { x: -1, y: 0, z: 0 }
      };
    default:
      throw new Error(`Unknown face "${face}".`);
  }
}

function stickerToFaceCell(sticker) {
  const n = sticker.normal;
  const p = sticker.position;

  let face;
  let row;
  let col;

  if (n.y === 1) {
    face = "U";
    row = p.z + 1;
    col = p.x + 1;
  } else if (n.y === -1) {
    face = "D";
    row = 1 - p.z;
    col = p.x + 1;
  } else if (n.z === 1) {
    face = "F";
    row = 1 - p.y;
    col = p.x + 1;
  } else if (n.z === -1) {
    face = "B";
    row = 1 - p.y;
    col = 1 - p.x;
  } else if (n.x === 1) {
    face = "R";
    row = 1 - p.y;
    col = 1 - p.z;
  } else if (n.x === -1) {
    face = "L";
    row = 1 - p.y;
    col = p.z + 1;
  } else {
    throw new Error("Sticker normal does not map to a face.");
  }

  if (row < 0 || row > 2 || col < 0 || col > 2) {
    throw new Error(`Invalid mapped face coordinate row=${row}, col=${col}.`);
  }

  return { face, row, col, color: sticker.color };
}

function rotateVector(vector, axis, quarterTurns) {
  const turns = ((quarterTurns % 4) + 4) % 4;
  let { x, y, z } = vector;

  for (let step = 0; step < turns; step += 1) {
    if (axis === "x") {
      [y, z] = [-z, y];
    } else if (axis === "y") {
      [x, z] = [z, -x];
    } else if (axis === "z") {
      [x, y] = [-y, x];
    } else {
      throw new Error(`Unknown axis "${axis}".`);
    }
  }

  return { x, y, z };
}

function parseMoveToken(moveToken) {
  const normalized = moveToken.trim();
  const match = normalized.match(MOVE_TOKEN_RE);

  if (!match) {
    throw new Error(`Invalid move token "${moveToken}".`);
  }

  const [, face, modifier] = match;
  let quarterTurns = CLOCKWISE_TURN_BY_FACE[face];

  if (modifier === "'") {
    quarterTurns *= -1;
  } else if (modifier === "2") {
    quarterTurns *= 2;
  }

  return { face, quarterTurns };
}

function stateToStickers(state) {
  const stickers = [];

  for (const face of FACE_ORDER) {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        stickers.push(faceCellToSticker(face, row, col, state[face][row][col]));
      }
    }
  }

  return stickers;
}

function stickersToState(stickers) {
  const next = createEmptyState();

  for (const sticker of stickers) {
    const mapped = stickerToFaceCell(sticker);
    next[mapped.face][mapped.row][mapped.col] = mapped.color;
  }

  for (const face of FACE_ORDER) {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        if (!next[face][row][col]) {
          throw new Error(`Incomplete state after move at ${face}[${row}][${col}].`);
        }
      }
    }
  }

  return next;
}

function applySingleMove(state, moveToken) {
  const { face, quarterTurns } = parseMoveToken(moveToken);
  const axis = AXIS_BY_FACE[face];
  const stickers = stateToStickers(state);

  for (const sticker of stickers) {
    if (!isLayerSticker(sticker.position, face)) {
      continue;
    }

    sticker.position = rotateVector(sticker.position, axis, quarterTurns);
    sticker.normal = rotateVector(sticker.normal, axis, quarterTurns);
  }

  return stickersToState(stickers);
}

function toFaceStringFromState(state) {
  let result = "";

  for (const face of FACE_ORDER) {
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        result += state[face][row][col];
      }
    }
  }

  return result;
}

/**
 * Represents a 3x3 Rubik's Cube state as a 6 x 3 x 3 structure.
 */
export class CubeState {
  constructor(initialState) {
    this.state = initialState ? cloneState(initialState) : createSolvedState();
  }

  /**
   * Returns a deep cloned cube state matrix.
   * @returns {{U:string[][],R:string[][],F:string[][],D:string[][],L:string[][],B:string[][]}}
   */
  getSnapshot() {
    return cloneState(this.state);
  }

  /**
   * Applies one or more move tokens (space-separated) to the cube.
   * @param {string} notation Move notation like "R", "U'", "F2", or "R U R'".
   * @returns {CubeState}
   */
  applyMove(notation) {
    const trimmed = (notation ?? "").trim();
    if (!trimmed) {
      return this;
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);
    let nextState = cloneState(this.state);

    for (const token of tokens) {
      nextState = applySingleMove(nextState, token);
    }

    this.state = nextState;
    return this;
  }

  /**
   * Replaces the full cube snapshot with a validated cloned state.
   * @param {{U:string[][],R:string[][],F:string[][],D:string[][],L:string[][],B:string[][]}} nextState
   * @returns {CubeState}
   */
  replaceState(nextState) {
    this.state = cloneState(nextState);
    return this;
  }

  /**
   * Returns the cube in URFDLB face-string format required by kociemba.
   * @returns {string}
   */
  toFaceString() {
    return toFaceStringFromState(this.state);
  }

  /**
   * Checks whether all six faces are solved.
   * @returns {boolean}
   */
  isSolved() {
    for (const face of FACE_ORDER) {
      const center = this.state[face][1][1];
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          if (this.state[face][row][col] !== center) {
            return false;
          }
        }
      }
    }
    return true;
  }

  toJSON() {
    return this.getSnapshot();
  }
}

/**
 * Solves a Rubik's Cube face string using the Kociemba two-phase solver.
 * @param {string} faceString Cube string in URFDLB order with 54 chars.
 * @returns {string[]} Array of move tokens, e.g. ["R", "U", "R'"].
 */
export function solveCube(faceString) {
  if (typeof faceString !== "string" || faceString.length !== 54) {
    throw new Error("solveCube expects a 54-character face string in URFDLB order.");
  }

  const solution = kociemba.solve(faceString);
  if (!solution || typeof solution !== "string") {
    return [];
  }

  return solution.trim().split(/\s+/).filter(Boolean);
}

/**
 * Generates a random scramble sequence for challenge mode.
 * @param {number} length Number of moves in scramble.
 * @returns {string[]}
 */
export function generateScramble(length = 20) {
  const faces = ["U", "D", "L", "R", "F", "B"];
  const modifiers = ["", "'", "2"];
  const scramble = [];

  while (scramble.length < length) {
    const face = faces[Math.floor(Math.random() * faces.length)];
    const previousFace = scramble.length ? scramble[scramble.length - 1][0] : null;

    if (face === previousFace) {
      continue;
    }

    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    scramble.push(`${face}${modifier}`);
  }

  return scramble;
}
