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

// Quarter-turn direction for clockwise turns from each face perspective.
const CLOCKWISE_TURN_BY_FACE = {
  U: -1,
  D: 1,
  R: -1,
  L: 1,
  F: -1,
  B: 1
};

const MOVE_TOKEN_RE = /^([UDLRFB])(2|')?$/;

function createEmptyState() {
  return {
    U: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    R: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    F: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    D: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    L: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ],
    B: [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ]
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
  if (axis === "x") return position.x === layerValue;
  if (axis === "y") return position.y === layerValue;
  return position.z === layerValue;
}

function faceCellToSticker(face, row, col, color) {
  switch (face) {
    case "F":
      return {
        position: { x: col - 1, y: 1 - row, z: 1 },
        normal: { x: 0, y: 0, z: 1 },
        color
      };
    case "B":
      return {
        position: { x: 1 - col, y: 1 - row, z: -1 },
        normal: { x: 0, y: 0, z: -1 },
        color
      };
    case "U":
      return {
        position: { x: col - 1, y: 1, z: row - 1 },
        normal: { x: 0, y: 1, z: 0 },
        color
      };
    case "D":
      return {
        position: { x: col - 1, y: -1, z: 1 - row },
        normal: { x: 0, y: -1, z: 0 },
        color
      };
    case "R":
      return {
        position: { x: 1, y: 1 - row, z: 1 - col },
        normal: { x: 1, y: 0, z: 0 },
        color
      };
    case "L":
      return {
        position: { x: -1, y: 1 - row, z: col - 1 },
        normal: { x: -1, y: 0, z: 0 },
        color
      };
    default:
      throw new Error(`Unknown face "${face}"`);
  }
}

function stickerToFaceCell(sticker) {
  const n = sticker.normal;
  const p = sticker.position;

  if (n.y === 1) return { face: "U", row: p.z + 1, col: p.x + 1, color: sticker.color };
  if (n.y === -1) return { face: "D", row: 1 - p.z, col: p.x + 1, color: sticker.color };
  if (n.z === 1) return { face: "F", row: 1 - p.y, col: p.x + 1, color: sticker.color };
  if (n.z === -1) return { face: "B", row: 1 - p.y, col: 1 - p.x, color: sticker.color };
  if (n.x === 1) return { face: "R", row: 1 - p.y, col: 1 - p.z, color: sticker.color };
  if (n.x === -1) return { face: "L", row: 1 - p.y, col: p.z + 1, color: sticker.color };

  throw new Error("Invalid sticker normal");
}

function rotateVector(vector, axis, quarterTurns) {
  const turns = ((quarterTurns % 4) + 4) % 4;
  let { x, y, z } = vector;

  for (let i = 0; i < turns; i += 1) {
    if (axis === "x") [y, z] = [-z, y];
    else if (axis === "y") [x, z] = [z, -x];
    else if (axis === "z") [x, y] = [-y, x];
    else throw new Error(`Unknown axis "${axis}"`);
  }

  return { x, y, z };
}

function parseMoveToken(moveToken) {
  const normalized = moveToken.trim().toUpperCase();
  const match = normalized.match(MOVE_TOKEN_RE);

  if (!match) {
    throw new Error(`Invalid move token "${moveToken}"`);
  }

  const [, face, modifier] = match;
  let quarterTurns = CLOCKWISE_TURN_BY_FACE[face];
  if (modifier === "'") quarterTurns *= -1;
  if (modifier === "2") quarterTurns *= 2;

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
          throw new Error(`Incomplete state at ${face}[${row}][${col}]`);
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
    if (!isLayerSticker(sticker.position, face)) continue;
    sticker.position = rotateVector(sticker.position, axis, quarterTurns);
    sticker.normal = rotateVector(sticker.normal, axis, quarterTurns);
  }

  return stickersToState(stickers);
}

export function applyMoveToState(state, notation) {
  const trimmed = String(notation || "").trim();
  if (!trimmed) {
    return cloneState(state);
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  let nextState = cloneState(state);
  for (const token of tokens) {
    nextState = applySingleMove(nextState, token);
  }

  return nextState;
}

export function applyMovesToState(state, moves) {
  if (!Array.isArray(moves)) {
    return cloneState(state);
  }
  return applyMoveToState(state, moves.join(" "));
}
