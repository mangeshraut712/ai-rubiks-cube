import { useEffect, useRef } from "react";

/**
 * Parses basic markdown like **bold** into span elements.
 */
function formatMarkdown(text) {
  if (!text) return null;
  const parts = String(text).split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-[#1a73e8]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * Right-side tutor pane with latest instruction + transcript stream.
 * Auto-scrolls to show newest messages.
 * @param {{latestInstruction:string,hintText:string,transcript:Array<{speaker:string,text:string,ts:string}>}} props
 */
export default function TutorOverlay({ latestInstruction, hintText, transcript }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/60 bg-white/70 p-5 text-[#202124] shadow-[0_8px_32px_rgba(32,33,36,0.08)] backdrop-blur-xl">
      {/* CUBEY SAYS HEADER */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-white p-[2px] shadow-sm">
        {/* Animated Gradient Border Layer */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] opacity-80" />

        {/* Inner Content Layer */}
        <div className="relative z-10 flex h-full flex-col rounded-[14px] bg-white p-4">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#5f6368]">
            <span className="gemini-text-gradient">✦</span>
            Cubey Says
          </div>
          <p className="text-[1.1rem] font-medium leading-relaxed text-[#202124]">
            {formatMarkdown(latestInstruction) ||
              "Show me your cube and I will guide your next move."}
          </p>
        </div>
      </div>

      {hintText ? (
        <div className="mb-5 rounded-2xl border border-[#fbbc04]/30 bg-[#fbbc04]/10 p-3.5 text-sm text-[#8f6a00] shadow-sm">
          <span className="mr-2 font-bold uppercase tracking-widest">💡 Hint:</span>
          {formatMarkdown(hintText)}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#5f6368]">
          Transcript
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto pr-1 scroll-smooth">
        {transcript.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-[#d2d8e3] bg-white/50 p-4 text-center text-sm text-[#5f6368]">
            Connection established.
            <br />
            Speak to start the session.
          </div>
        ) : null}

        {transcript.map((entry, index) => (
          <div
            key={`${entry.ts}-${index}`}
            className={`rounded-2xl p-3.5 text-sm transition-all duration-300 ${
              entry.speaker === "cubey"
                ? "border border-[#e8eaed] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                : "border border-transparent bg-[#f1f3f4] text-right"
            }`}
          >
            <div
              className={`mb-1.5 text-[10px] font-bold uppercase tracking-widest ${entry.speaker === "cubey" ? "gemini-text-gradient" : "text-[#5f6368]"}`}
            >
              {entry.speaker === "cubey" ? "✦ Cubey" : "You"}
            </div>
            <p className="text-[13px] leading-relaxed text-[#202124]">
              {formatMarkdown(entry.text)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
