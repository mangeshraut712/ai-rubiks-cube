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
      ? "bg-[#34a853]"
      : connectionStatus === "demo_mode"
        ? "bg-[#4285f4]"
      : connectionStatus === "connecting"
        ? "bg-[#fbbc04]"
        : "bg-[#ea4335]";

  return (
    <div className="rounded-2xl border border-[#d2d8e3] bg-white/96 p-4 text-sm text-[#202124] shadow-[0_12px_28px_rgba(24,39,75,0.12)] backdrop-blur">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${connectionColor}`} />
          <span className="uppercase tracking-wider text-[#5f6368]">{connectionStatus}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#5f6368]">Mic</span>
          <div className="h-2 w-20 rounded bg-[#e6ebf4]">
            <div className="h-full rounded bg-[#4285f4] transition-all" style={{ width: `${levelPct}%` }} />
          </div>
        </div>

        <div className="text-[#5f6368]">Timer: {formatDuration(timerSeconds)}</div>
        <div className="text-[#5f6368]">Moves: {moveCount}</div>
        <div className="text-[#5f6368]">Tutor: {isTutorSpeaking ? "Speaking" : "Listening"}</div>
      </div>
    </div>
  );
}
