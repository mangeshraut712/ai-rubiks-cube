const FACE = "[UDLRFB]";

/**
 * Pull the first coaching move out of tutor text.
 * Notation such as R' must win over the bare face letter, because an apostrophe
 * is not a word character and a word-boundary pattern would otherwise return R.
 * @param {string} text
 * @returns {string | null}
 */
export function parseMoveFromTutorText(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const pattern = new RegExp(
    `\\b(${FACE})(?:\\s*(2|'|prime|counter[- ]?clockwise|double|twice|clockwise))?(?![A-Za-z])`,
    "i"
  );
  const match = text.match(pattern);
  if (!match) {
    return null;
  }

  const face = match[1].toUpperCase();
  const modifier = String(match[2] || "").toLowerCase();

  if (modifier === "'" || modifier === "prime" || modifier.replace(/\s+/g, "").startsWith("counter")) {
    return `${face}'`;
  }

  if (modifier === "2" || modifier === "double" || modifier === "twice") {
    return `${face}2`;
  }

  return face;
}
