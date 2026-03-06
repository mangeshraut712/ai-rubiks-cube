import { useDeferredValue, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiCpu, FiMessageSquare, FiMic, FiVideo } from "react-icons/fi";

function formatMarkdown(text) {
  if (!text) return null;

  return String(text)
    .split(/(\*\*.*?\*\*)/g)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-[#1a73e8]">
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
}

function resolveStatus(connectionStatus, errorText, isLocalEnvironment) {
  if (errorText) {
    return {
      label: "Backend issue",
      tone:
        "border-[color:rgba(234,67,53,0.22)] bg-[rgba(234,67,53,0.12)] text-[#b42318] dark:text-red-200",
      empty: isLocalEnvironment
        ? "Backend is not reachable yet. Start the local backend, then retry the live session."
        : "Tutor backend is not reachable right now. Retry in a moment."
    };
  }

  if (connectionStatus === "connecting") {
    return {
      label: "Connecting",
      tone:
        "border-[color:rgba(251,188,5,0.24)] bg-[rgba(251,188,5,0.14)] text-[#8a6100] dark:text-yellow-200",
      empty: "Connecting to the live tutor. Camera memory and transcript will appear here shortly."
    };
  }

  if (connectionStatus === "permission_denied") {
    return {
      label: "Permissions blocked",
      tone:
        "border-[color:rgba(234,67,53,0.22)] bg-[rgba(234,67,53,0.12)] text-[#b42318] dark:text-red-200",
      empty: "Camera or microphone access is blocked. Allow permissions and restart the session."
    };
  }

  if (connectionStatus === "demo_mode") {
    return {
      label: "Demo mode",
      tone:
        "border-[color:rgba(66,133,244,0.22)] bg-[rgba(66,133,244,0.12)] text-[#1a73e8] dark:text-blue-200",
      empty: "Demo mode is ready. Ask for guidance without needing a live camera feed."
    };
  }

  if (connectionStatus === "connected") {
    return {
      label: "Connected",
      tone:
        "border-[color:rgba(52,168,83,0.22)] bg-[rgba(52,168,83,0.12)] text-[#166534] dark:text-green-200",
      empty: "Connection established. Speak or type to start the coaching loop."
    };
  }

  return {
    label: "Offline",
    tone:
      "border-[color:rgba(148,163,184,0.22)] bg-[rgba(148,163,184,0.14)] text-slate-600 dark:text-slate-300",
    empty: "Start a live session to populate the tutor memory and transcript timeline."
  };
}

export default function TutorOverlay({
  latestInstruction,
  hintText,
  transcript,
  connectionStatus = "disconnected",
  errorText = "",
  isLocalEnvironment = false
}) {
  const scrollRef = useRef(null);
  const deferredTranscript = useDeferredValue(transcript);
  const status = resolveStatus(connectionStatus, errorText, isLocalEnvironment);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [deferredTranscript]);

  return (
    <aside className="surface-panel flex h-full min-h-[720px] flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="surface-kicker">Tutor memory</div>
          <h2 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.07em] text-slate-950 dark:text-white">
            Search-style answers, live transcript, zero context switching.
          </h2>
        </div>

        <span className={`surface-chip ${status.tone}`}>{status.label}</span>
      </div>

      <div className="surface-panel surface-panel--muted mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <FiCpu className="h-4 w-4 text-[#4285F4]" />
            Cubey says
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="surface-chip text-xs">
              <FiMic className="h-4 w-4 text-[#34A853]" />
              Voice loop
            </span>
            <span className="surface-chip text-xs">
              <FiVideo className="h-4 w-4 text-[#4285F4]" />
              Vision memory
            </span>
          </div>
        </div>

        <motion.p
          key={latestInstruction || "empty"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4 text-lg font-medium leading-8 text-slate-900 dark:text-white"
        >
          {formatMarkdown(latestInstruction) || "Show me your cube and I will guide the next move."}
        </motion.p>
      </div>

      <AnimatePresence initial={false}>
        {hintText ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-[26px] border border-[rgba(251,188,5,0.24)] bg-[rgba(251,188,5,0.14)] px-4 py-3 text-sm text-[#8a6100] shadow-[0_12px_28px_rgba(251,188,5,0.08)] dark:text-yellow-200"
          >
            <div className="surface-kicker text-[#8a6100] dark:text-yellow-200">Hint surfaced</div>
            <div className="mt-2 leading-7">{formatMarkdown(hintText)}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <div className="surface-kicker">Transcript timeline</div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Every spoken exchange stays on the same panel as the current instruction.
          </p>
        </div>
        <span className="surface-chip text-xs">
          <FiMessageSquare className="h-4 w-4 text-[#EA4335]" />
          {deferredTranscript.length} entries
        </span>
      </div>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {deferredTranscript.length === 0 ? (
          <div className="modal-card flex h-40 items-center justify-center px-5 text-center text-sm leading-7 text-slate-500 dark:text-slate-300">
            {status.empty}
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {deferredTranscript.map((entry, index) => {
            const isTutor = entry.speaker === "cubey";

            return (
              <motion.article
                key={`${entry.ts}-${index}`}
                initial={{ opacity: 0, x: isTutor ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isTutor ? -10 : 10 }}
                transition={{ duration: 0.18 }}
                className={`rounded-[26px] border px-4 py-3 ${
                  isTutor
                    ? "border-[rgba(66,133,244,0.12)] bg-white/76 text-left shadow-[0_18px_38px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[rgba(8,18,32,0.82)]"
                    : "border-[rgba(52,168,83,0.14)] bg-[rgba(52,168,83,0.08)] text-right dark:bg-[rgba(52,168,83,0.12)]"
                }`}
              >
                <div
                  className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${
                    isTutor ? "text-[#1a73e8]" : "text-[#166534] dark:text-green-200"
                  }`}
                >
                  {isTutor ? "Cubey" : "You"}
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
                  {formatMarkdown(entry.text)}
                </p>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {errorText ? (
        <div className="mt-4 flex items-start gap-3 rounded-[24px] border border-[rgba(234,67,53,0.24)] bg-[rgba(234,67,53,0.12)] px-4 py-3 text-sm text-[#8a2c21] dark:text-red-200">
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorText}</span>
        </div>
      ) : null}
    </aside>
  );
}
