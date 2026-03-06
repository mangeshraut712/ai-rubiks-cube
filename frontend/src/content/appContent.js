import { FiCamera, FiMic, FiUsers, FiZap } from "react-icons/fi";

export const BRAND_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853"];

export const SCRAMBLE_MOVES = ["U", "U'", "D", "D'", "L", "L'", "R", "R'", "F", "F'", "B", "B'"];

export const VOICE_MOVE_COMMANDS = new Set([
  "U",
  "U'",
  "U2",
  "D",
  "D'",
  "D2",
  "L",
  "L'",
  "L2",
  "R",
  "R'",
  "R2",
  "F",
  "F'",
  "F2",
  "B",
  "B'",
  "B2"
]);

export const HERO_CAPABILITIES = [
  {
    icon: FiCamera,
    eyebrow: "Vision",
    title: "Watch the physical cube in real time.",
    detail: "A floating camera lens keeps the session grounded in the object on your desk.",
    accent: "#4285F4",
    soft: "rgba(66, 133, 244, 0.14)"
  },
  {
    icon: FiMic,
    eyebrow: "Voice",
    title: "Speak naturally. Cubey replies instantly.",
    detail: "The interface is built around live conversation, not a pile of tutorial text.",
    accent: "#EA4335",
    soft: "rgba(234, 67, 53, 0.14)"
  },
  {
    icon: FiZap,
    eyebrow: "Solve",
    title: "See the next move before you make it.",
    detail: "Move highlights, transcript memory, hinting, and auto-solve all live on the same stage.",
    accent: "#FBBC05",
    soft: "rgba(251, 188, 5, 0.18)"
  },
  {
    icon: FiUsers,
    eyebrow: "Labs",
    title: "Turn training into a multiplayer event.",
    detail: "WebRTC race mode sits beside the tutor instead of feeling like a separate mini-app.",
    accent: "#34A853",
    soft: "rgba(52, 168, 83, 0.16)"
  }
];

export const SESSION_PROMPTS = [
  "What move should I do next?",
  "Explain the current step like I'm a beginner.",
  "Give me a faster move sequence.",
  "What mistake am I making?"
];

export const HERO_FACTS = [
  { label: "Gemini Live", value: "Voice + vision tutoring" },
  { label: "WebRTC Lab", value: "Peer multiplayer mode" },
  { label: "Keyboard Deck", value: "Full shortcut support" }
];
