/**
 * Right-side tutor pane with latest instruction + transcript stream.
 * @param {{latestInstruction:string,hintText:string,transcript:Array<{speaker:string,text:string,ts:string}>}} props
 */
export default function TutorOverlay({ latestInstruction, hintText, transcript }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/15 bg-slate-950/80 p-4 text-slate-100 shadow-xl backdrop-blur">
      <div className="mb-4 rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4">
        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-cyan-200">Cubey Says</div>
        <p className="text-lg font-semibold leading-snug text-cyan-50">
          {latestInstruction || "Show me your cube and I will guide your next move."}
        </p>
      </div>

      {hintText ? (
        <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          <span className="mr-2 font-semibold uppercase tracking-wide">Hint:</span>
          {hintText}
        </div>
      ) : null}

      <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Transcript</div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {transcript.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-3 text-sm text-slate-400">
            Transcript will appear here once session starts.
          </div>
        ) : null}

        {transcript.map((entry, index) => (
          <div
            key={`${entry.ts}-${index}`}
            className={`rounded-xl p-3 text-sm ${
              entry.speaker === "cubey"
                ? "border border-cyan-300/20 bg-cyan-500/10"
                : "border border-slate-600/40 bg-slate-800/60"
            }`}
          >
            <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-300">{entry.speaker}</div>
            <p className="text-slate-100">{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
