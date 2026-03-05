export const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];

// Improved color palette with more vibrant, standard Rubik's cube colors
export const FACE_TO_HEX = {
  U: "#FFFFFF", // White - Up (clean white)
  R: "#B71234", // Red - Right (standard Rubik's red)
  F: "#009B48", // Green - Front (vibrant green)
  D: "#FFD500", // Yellow - Down (bright yellow)
  L: "#FF5800", // Orange - Left (vibrant orange)
  B: "#0046AD" // Blue - Back (standard blue)
};

// Alternative dark theme colors
export const FACE_TO_HEX_DARK = {
  U: "#F0F0F0", // Off-white
  R: "#D32F2F", // Material Red
  F: "#388E3C", // Material Green
  D: "#FBC02D", // Material Yellow
  L: "#F57C00", // Material Orange
  B: "#1976D2" // Material Blue
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
