/**
 * Right-side tutor pane with latest instruction + transcript stream.
 * @param {{latestInstruction:string,hintText:string,transcript:Array<{speaker:string,text:string,ts:string}>}} props
 */
export default function TutorOverlay({ latestInstruction, hintText, transcript }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#d2d8e3] bg-white/96 p-4 text-[#202124] shadow-[0_14px_30px_rgba(24,39,75,0.12)] backdrop-blur">
      <div className="mb-4 rounded-2xl border border-[#b8cdfa] bg-[#edf4ff] p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6368]">Cubey Says</div>
        <p className="text-lg font-semibold leading-snug text-[#1f3a68]">
          {latestInstruction || "Show me your cube and I will guide your next move."}
        </p>
      </div>

      {hintText ? (
        <div className="mb-4 rounded-xl border border-[#f4ca64] bg-[#fff7df] p-3 text-sm text-[#6a5413]">
          <span className="mr-2 font-semibold uppercase tracking-wide">Hint:</span>
          {hintText}
        </div>
      ) : null}

      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6368]">Transcript</div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {transcript.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d2d8e3] bg-[#f8faff] p-3 text-sm text-[#5f6368]">
            Transcript will appear here once session starts.
          </div>
        ) : null}

        {transcript.map((entry, index) => (
          <div
            key={`${entry.ts}-${index}`}
            className={`rounded-xl p-3 text-sm ${
              entry.speaker === "cubey"
                ? "border border-[#b8cdfa] bg-[#edf4ff]"
                : "border border-[#d2d8e3] bg-[#f8faff]"
            }`}
          >
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#5f6368]">{entry.speaker}</div>
            <p className="text-[#202124]">{entry.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
