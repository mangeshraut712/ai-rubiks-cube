function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * Bottom status strip with connection, mic activity, timer, and move count.
 * @param {{connectionStatus:string,micLevel:number,timerSeconds:number,moveCount:number,isTutorSpeaking:boolean}} props
 */
export default function StatusBar({
  connectionStatus,
  micLevel,
  timerSeconds,
  moveCount,
  isTutorSpeaking
}) {
  const levelPct = Math.min(100, Math.max(0, Math.round(micLevel * 250)));
  const connectionColor =
    connectionStatus === "connected"
      ? "bg-emerald-500"
      : connectionStatus === "demo_mode"
        ? "bg-cyan-400"
      : connectionStatus === "connecting"
        ? "bg-amber-400"
        : "bg-red-500";

  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/85 p-4 text-sm text-slate-100 shadow-lg backdrop-blur">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${connectionColor}`} />
          <span className="uppercase tracking-wider text-slate-300">{connectionStatus}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-300">Mic</span>
          <div className="h-2 w-20 rounded bg-slate-700">
            <div className="h-full rounded bg-cyan-400 transition-all" style={{ width: `${levelPct}%` }} />
          </div>
        </div>

        <div className="text-slate-300">Timer: {formatDuration(timerSeconds)}</div>
        <div className="text-slate-300">Moves: {moveCount}</div>
        <div className="text-slate-300">Tutor: {isTutorSpeaking ? "Speaking" : "Listening"}</div>
      </div>
    </div>
  );
}
