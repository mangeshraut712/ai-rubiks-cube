export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];

export const FACE_TO_HEX = {
  U: "#f7f7f5",
  R: "#d54343",
  F: "#2f9f56",
  D: "#f2c94c",
  L: "#f08b35",
  B: "#2c66d6"
};

/**
 * Creates a solved cube matrix (6 x 3 x 3) keyed by face letter.
 * @returns {{U:string[][],R:string[][],F:string[][],D:string[][],L:string[][],B:string[][]}}
 */
export function createSolvedCubeState() {
  return {
    U: [
      ["U", "U", "U"],
      ["U", "U", "U"],
      ["U", "U", "U"]
    ],
    R: [
      ["R", "R", "R"],
      ["R", "R", "R"],
      ["R", "R", "R"]
    ],
    F: [
      ["F", "F", "F"],
      ["F", "F", "F"],
      ["F", "F", "F"]
    ],
    D: [
      ["D", "D", "D"],
      ["D", "D", "D"],
      ["D", "D", "D"]
    ],
    L: [
      ["L", "L", "L"],
      ["L", "L", "L"],
      ["L", "L", "L"]
    ],
    B: [
      ["B", "B", "B"],
      ["B", "B", "B"],
      ["B", "B", "B"]
    ]
  };
}

/**
 * Converts move notation to its face letter.
 * @param {string} move
 * @returns {string | null}
 */
export function faceFromMove(move) {
  if (!move || typeof move !== "string") {
    return null;
  }

  const face = move.trim().toUpperCase()[0];
  return FACE_ORDER.includes(face) ? face : null;
}

/**
 * Maps a face letter to the UI color hex.
 * @param {string} faceLetter
 * @returns {string}
 */
export function colorForFaceLetter(faceLetter) {
  return FACE_TO_HEX[faceLetter] || "#444444";
}
