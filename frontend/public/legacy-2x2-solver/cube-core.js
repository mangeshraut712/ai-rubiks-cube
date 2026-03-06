(function (root, factory) {
  const api = factory();

  root.CubeCore2x2 = api;

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
  const FACE_COLORS = {
    U: "W",
    R: "R",
    F: "G",
    D: "Y",
    L: "O",
    B: "B"
  };
  const ALL_MOVES = ["U", "U'", "R", "R'", "F", "F'", "D", "D'", "L", "L'", "B", "B'"];
  const INVERSE_MOVES = {
    U: "U'",
    "U'": "U",
    R: "R'",
    "R'": "R",
    F: "F'",
    "F'": "F",
    D: "D'",
    "D'": "D",
    L: "L'",
    "L'": "L",
    B: "B'",
    "B'": "B"
  };
  const SOLVED_STATE = FACE_ORDER.map((face) => FACE_COLORS[face].repeat(4)).join("");

  function faceIndex(face, row, col) {
    return FACE_ORDER.indexOf(face) * 4 + row * 2 + col;
  }

  function stickerDescriptor(face, row, col) {
    switch (face) {
      case "U":
        return {
          face,
          row,
          col,
          position: [col === 0 ? -1 : 1, 1, row === 0 ? -1 : 1],
          normal: [0, 1, 0]
        };
      case "D":
        return {
          face,
          row,
          col,
          position: [col === 0 ? -1 : 1, -1, row === 0 ? 1 : -1],
          normal: [0, -1, 0]
        };
      case "F":
        return {
          face,
          row,
          col,
          position: [col === 0 ? -1 : 1, row === 0 ? 1 : -1, 1],
          normal: [0, 0, 1]
        };
      case "B":
        return {
          face,
          row,
          col,
          position: [col === 0 ? 1 : -1, row === 0 ? 1 : -1, -1],
          normal: [0, 0, -1]
        };
      case "R":
        return {
          face,
          row,
          col,
          position: [1, row === 0 ? 1 : -1, col === 0 ? 1 : -1],
          normal: [1, 0, 0]
        };
      case "L":
        return {
          face,
          row,
          col,
          position: [-1, row === 0 ? 1 : -1, col === 0 ? -1 : 1],
          normal: [-1, 0, 0]
        };
      default:
        throw new Error(`Unknown face "${face}"`);
    }
  }

  const STICKER_LAYOUT = FACE_ORDER.flatMap((face) =>
    [0, 1].flatMap((row) =>
      [0, 1].map((col) => ({
        index: faceIndex(face, row, col),
        ...stickerDescriptor(face, row, col)
      }))
    )
  );

  const STICKER_KEY_TO_INDEX = new Map(
    STICKER_LAYOUT.map((descriptor) => [descriptorKey(descriptor.position, descriptor.normal), descriptor.index])
  );

  const MOVE_SPECS = {
    U: { axis: "y", direction: 1, matches: (position) => position[1] === 1 },
    "U'": { axis: "y", direction: -1, matches: (position) => position[1] === 1 },
    D: { axis: "y", direction: -1, matches: (position) => position[1] === -1 },
    "D'": { axis: "y", direction: 1, matches: (position) => position[1] === -1 },
    R: { axis: "x", direction: 1, matches: (position) => position[0] === 1 },
    "R'": { axis: "x", direction: -1, matches: (position) => position[0] === 1 },
    L: { axis: "x", direction: -1, matches: (position) => position[0] === -1 },
    "L'": { axis: "x", direction: 1, matches: (position) => position[0] === -1 },
    F: { axis: "z", direction: 1, matches: (position) => position[2] === 1 },
    "F'": { axis: "z", direction: -1, matches: (position) => position[2] === 1 },
    B: { axis: "z", direction: -1, matches: (position) => position[2] === -1 },
    "B'": { axis: "z", direction: 1, matches: (position) => position[2] === -1 }
  };

  const MOVE_PERMUTATIONS = Object.fromEntries(
    Object.entries(MOVE_SPECS).map(([move, spec]) => [move, deriveMovePermutation(spec)])
  );

  function descriptorKey(position, normal) {
    return `${position.join(",")}|${normal.join(",")}`;
  }

  function rotateVector([x, y, z], axis, direction) {
    switch (axis) {
      case "x":
        return direction === 1 ? [x, -z, y] : [x, z, -y];
      case "y":
        return direction === 1 ? [z, y, -x] : [-z, y, x];
      case "z":
        return direction === 1 ? [-y, x, z] : [y, -x, z];
      default:
        throw new Error(`Unsupported rotation axis "${axis}"`);
    }
  }

  function deriveMovePermutation(spec) {
    const transition = new Array(STICKER_LAYOUT.length);

    STICKER_LAYOUT.forEach((descriptor) => {
      if (!spec.matches(descriptor.position)) {
        transition[descriptor.index] = descriptor.index;
        return;
      }

      const nextPosition = rotateVector(descriptor.position, spec.axis, spec.direction);
      const nextNormal = rotateVector(descriptor.normal, spec.axis, spec.direction);
      const targetIndex = STICKER_KEY_TO_INDEX.get(descriptorKey(nextPosition, nextNormal));

      if (typeof targetIndex !== "number") {
        throw new Error(`Failed to derive permutation for move "${spec.axis}"`);
      }

      transition[descriptor.index] = targetIndex;
    });

    const permutation = new Array(transition.length);
    transition.forEach((targetIndex, sourceIndex) => {
      permutation[targetIndex] = sourceIndex;
    });

    return permutation;
  }

  function validateState(state) {
    if (typeof state !== "string" || state.length !== SOLVED_STATE.length) {
      return false;
    }

    const counts = {
      W: 0,
      R: 0,
      G: 0,
      Y: 0,
      O: 0,
      B: 0
    };

    for (const sticker of state) {
      if (!(sticker in counts)) {
        return false;
      }
      counts[sticker] += 1;
    }

    return Object.values(counts).every((count) => count === 4);
  }

  function applyMove(move, state) {
    const permutation = MOVE_PERMUTATIONS[move];

    if (!permutation) {
      throw new Error(`Unsupported move "${move}"`);
    }

    if (!validateState(state)) {
      throw new Error("Invalid 2x2 cube state");
    }

    return permutation.map((sourceIndex) => state[sourceIndex]).join("");
  }

  function isSolved(state) {
    return state === SOLVED_STATE;
  }

  function resetState() {
    return SOLVED_STATE;
  }

  function generateScramble(length = 10) {
    const scramble = [];
    let lastMove = "";

    for (let index = 0; index < length; index += 1) {
      let nextMove;

      do {
        nextMove = ALL_MOVES[Math.floor(Math.random() * ALL_MOVES.length)];
      } while (
        lastMove &&
        (nextMove[0] === lastMove[0] || INVERSE_MOVES[nextMove] === lastMove)
      );

      scramble.push(nextMove);
      lastMove = nextMove;
    }

    return scramble;
  }

  function stateToFaces(state) {
    const normalized = validateState(state) ? state : SOLVED_STATE;

    return FACE_ORDER.reduce((faces, face) => {
      const baseIndex = FACE_ORDER.indexOf(face) * 4;
      faces[face] = [
        [normalized[baseIndex], normalized[baseIndex + 1]],
        [normalized[baseIndex + 2], normalized[baseIndex + 3]]
      ];
      return faces;
    }, {});
  }

  function getStickerColor(state, face, row, col) {
    const normalized = validateState(state) ? state : SOLVED_STATE;
    return normalized[faceIndex(face, row, col)];
  }

  return {
    ALL_MOVES,
    FACE_COLORS,
    FACE_ORDER,
    INVERSE_MOVES,
    MOVE_PERMUTATIONS,
    SOLVED_STATE,
    STICKER_LAYOUT,
    applyMove,
    generateScramble,
    getStickerColor,
    isSolved,
    resetState,
    stateToFaces,
    validateState
  };
});
