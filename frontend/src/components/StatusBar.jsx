import { FiActivity, FiClock, FiCpu, FiMic, FiWifi } from "react-icons/fi";

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function Segment({ icon: Icon, label, value, children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-[rgba(15,23,42,0.08)] bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{value}</div>
        {children}
      </div>
    </div>
  );
}

export default function StatusBar({
  connectionStatus,
  micLevel,
  timerSeconds,
  moveCount,
  isTutorSpeaking,
  isThinking = false
}) {
  const levelPct = Math.min(100, Math.max(0, Math.round(micLevel * 250)));
  const connectionTone =
    connectionStatus === "connected"
      ? { label: "Connected", dot: "is-green" }
      : connectionStatus === "demo_mode"
        ? { label: "Demo mode", dot: "is-blue" }
        : connectionStatus === "connecting"
          ? { label: "Connecting", dot: "is-yellow" }
          : connectionStatus === "permission_denied"
            ? { label: "Permissions blocked", dot: "is-red" }
            : { label: "Offline", dot: "is-red" };

  const tutorLabel = isTutorSpeaking ? "Speaking" : isThinking ? "Thinking" : "Listening";

  return (
    <div className="surface-panel surface-panel--muted px-3 py-3 sm:px-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Segment icon={FiWifi} label="Connection" value={connectionTone.label} className="sm:col-span-2">
          <span className={`status-dot ${connectionTone.dot}`} />
        </Segment>

        <Segment icon={FiMic} label="Mic level" value={`${levelPct}%`}>
          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4285F4,#34A853)] transition-[width] duration-150"
              style={{ width: `${levelPct}%` }}
            />
          </div>
        </Segment>

        <Segment icon={FiClock} label="Timer" value={formatDuration(timerSeconds)}>
          <span className="status-dot is-yellow" />
        </Segment>

        <Segment icon={FiActivity} label="Moves" value={`${moveCount}`}>
          <span className="status-dot is-blue" />
        </Segment>

        <Segment icon={FiCpu} label="Tutor" value={tutorLabel} className="sm:col-span-2">
          <span className="flex items-center gap-1">
            <span
              className={`status-dot ${isTutorSpeaking ? "is-green" : isThinking ? "is-yellow" : "is-blue"}`}
            />
            {isThinking ? (
              <span className="flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#FBBC05] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#FBBC05] animate-bounce"
                  style={{ animationDelay: "120ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#FBBC05] animate-bounce"
                  style={{ animationDelay: "240ms" }}
                />
              </span>
            ) : null}
          </span>
        </Segment>
      </div>
    </div>
  );
}
