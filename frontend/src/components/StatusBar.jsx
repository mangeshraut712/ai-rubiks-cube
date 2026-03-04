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
 * @param {{connectionStatus:string,micLevel:number,timerSeconds:number,moveCount:number,isTutorSpeaking:boolean,isThinking?:boolean}} props
 */
export default function StatusBar({
  connectionStatus,
  micLevel,
  timerSeconds,
  moveCount,
  isTutorSpeaking,
  isThinking = false
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

  // Thinking indicator animation
  const thinkingIndicator = isThinking ? (
    <span className="flex gap-0.5">
      <span className="h-2 w-1 animate-bounce rounded-full bg-[#9c27b0]" style={{ animationDelay: "0ms" }} />
      <span className="h-2 w-1 animate-bounce rounded-full bg-[#9c27b0]" style={{ animationDelay: "150ms" }} />
      <span className="h-2 w-1 animate-bounce rounded-full bg-[#9c27b0]" style={{ animationDelay: "300ms" }} />
    </span>
  ) : null;

  return (
    <div className="flex h-14 items-center justify-between overflow-hidden rounded-[20px] border border-white/60 bg-white/70 px-6 text-sm text-[#202124] shadow-[0_8px_32px_rgba(32,33,36,0.06)] backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-4">

        {/* Connection Status */}
        <div className="flex items-center gap-2.5">
          <span className={`relative flex h-2.5 w-2.5 items-center justify-center`}>
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${connectionColor}`}></span>
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${connectionColor}`}></span>
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#5f6368]">{connectionStatus}</span>
        </div>

        {/* Mic Level */}
        <div className="hidden items-center gap-2.5 sm:flex">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#5f6368]">Mic</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e6ebf4] shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-[#4285f4] to-[#9b72cb] transition-all duration-100 ease-out" style={{ width: `${levelPct}%` }} />
          </div>
        </div>

        {/* Timer */}
        <div className="text-[12px] font-medium text-[#5f6368]"><span className="text-[#a8aeb7]">Timer:</span> {formatDuration(timerSeconds)}</div>

        {/* Moves */}
        <div className="text-[12px] font-medium text-[#5f6368]"><span className="text-[#a8aeb7]">Moves:</span> {moveCount}</div>

        {/* Tutor Status */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#5f6368]">Tutor:</span>
          {isTutorSpeaking ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#34a853]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34a853] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#34a853]"></span>
              </span>
              Speaking
            </span>
          ) : isThinking ? (
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#9b72cb]">
              {thinkingIndicator} Thinking
            </span>
          ) : (
            <span className="text-[12px] font-medium text-[#4285f4]">Listening</span>
          )}
        </div>

      </div>
    </div>
  );
}
