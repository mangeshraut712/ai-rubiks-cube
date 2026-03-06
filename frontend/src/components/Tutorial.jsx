import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiCommand,
  FiLayers,
  FiMic,
  FiPlay,
  FiRotateCcw,
  FiTarget,
  FiX,
  FiZap
} from "react-icons/fi";
import { useCubeStore, useSettings } from "../store/cubeStore";

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Meet Cubey",
    summary: "The redesigned product behaves like a live search page for cube coaching.",
    bullets: [
      "One stage holds the cube, camera, transcript, and commands together.",
      "The goal is less menu-diving and more direct coaching flow.",
      "You can start with voice, text, or manual turns."
    ],
    icon: FiAward,
    accent: "#4285F4",
    soft: "rgba(66,133,244,0.14)"
  },
  {
    id: "cube-structure",
    title: "Understand the cube",
    summary: "Six faces, fixed centers, and repeatable notation still anchor the entire tutor flow.",
    bullets: [
      "Each center defines its face color permanently.",
      "Cubey reasons about the current state from those face positions.",
      "The stage highlights the active move while the transcript explains it."
    ],
    icon: FiLayers,
    accent: "#34A853",
    soft: "rgba(52,168,83,0.14)"
  },
  {
    id: "notation",
    title: "Read the move language",
    summary: "The interface accepts standard cube notation directly.",
    bullets: [
      "R means rotate the right face clockwise.",
      "R' means counter-clockwise and R2 means a 180-degree turn.",
      "Manual buttons, keyboard input, voice, and tutor prompts all use the same language."
    ],
    icon: FiZap,
    accent: "#FBBC05",
    soft: "rgba(251,188,5,0.18)"
  },
  {
    id: "shortcuts",
    title: "Drive it fast",
    summary: "Shortcuts keep the session moving once you know the basics.",
    bullets: [
      "Use U D L R F B for direct turns.",
      "Use Space to start or end the live session quickly.",
      "Undo, redo, theme, and challenge mode all have keyboard access."
    ],
    icon: FiCommand,
    accent: "#EA4335",
    soft: "rgba(234,67,53,0.14)"
  },
  {
    id: "coaching",
    title: "How the coach responds",
    summary: "Cubey mixes voice, vision, move previews, and hints inside one conversation loop.",
    bullets: [
      "Show the cube to seed the current state.",
      "Ask for the next move, a simpler explanation, or a faster algorithm.",
      "Use solve preview or auto-solve when you want a demonstration instead of a hint."
    ],
    icon: FiTarget,
    accent: "#4285F4",
    soft: "rgba(66,133,244,0.14)"
  },
  {
    id: "voice",
    title: "Use voice naturally",
    summary: "The redesigned command bar and transcript assume speech is a first-class input.",
    bullets: [
      "Speak move commands or coaching questions out loud.",
      "The tutor transcript stays visible next to the current instruction.",
      "If you prefer typing, the search-style composer does the same job."
    ],
    icon: FiMic,
    accent: "#34A853",
    soft: "rgba(52,168,83,0.14)"
  },
  {
    id: "challenge",
    title: "Turn practice into a challenge",
    summary: "Challenge mode and multiplayer now feel like extensions of the main stage, not separate tools.",
    bullets: [
      "Enable challenge mode to race the tutor.",
      "Open multiplayer to create or join a WebRTC room.",
      "Keep the same cube workflow while adding competitive pressure."
    ],
    icon: FiZap,
    accent: "#FBBC05",
    soft: "rgba(251,188,5,0.18)"
  },
  {
    id: "ready",
    title: "Start the session",
    summary: "You have the full path: inspect, ask, move, review, and repeat.",
    bullets: [
      "Launch live coaching from the landing page.",
      "Use the workspace layout to keep the cube, tutor, and controls in view.",
      "Come back here anytime if you want the flow explained again."
    ],
    icon: FiPlay,
    accent: "#EA4335",
    soft: "rgba(234,67,53,0.14)"
  }
];

export default function Tutorial({ onClose, onComplete }) {
  const settings = useSettings();
  const updateSettings = useCubeStore((state) => state.updateSettings);
  const skipTutorial = useCubeStore((state) => state.skipTutorial);

  const [currentStep, setCurrentStep] = useState(0);

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = useCallback(() => {
    if (isLast) {
      skipTutorial();
      onComplete?.();
      return;
    }

    setCurrentStep((prev) => prev + 1);
  }, [isLast, onComplete, skipTutorial]);

  const handlePrev = useCallback(() => {
    if (isFirst) {
      return;
    }

    setCurrentStep((prev) => prev - 1);
  }, [isFirst]);

  const handleSkip = useCallback(() => {
    skipTutorial();
    onClose?.();
  }, [onClose, skipTutorial]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop"
        onClick={(event) => event.target === event.currentTarget && handleSkip()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 18 }}
          transition={{ type: "spring", stiffness: 250, damping: 24 }}
          className="modal-shell max-w-6xl"
        >
          <header className="modal-header">
            <div>
              <p className="modal-eyebrow">Tutorial</p>
              <h2 className="modal-title">A cleaner onboarding flow for the new stage.</h2>
              <p className="modal-subtitle">
                I replaced the old slideshow with a guided control-room walkthrough so the interface reads
                like one product from the first screen onward.
              </p>
            </div>

            <button type="button" onClick={handleSkip} className="modal-close" aria-label="Close tutorial">
              <FiX className="h-5 w-5" />
            </button>
          </header>

          <div className="px-5 pt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#4285F4,#34A853,#FBBC05,#EA4335)] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="modal-body">
            <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
              <aside className="modal-card p-4">
                <div className="surface-kicker">Steps</div>
                <div className="mt-4 space-y-2">
                  {TUTORIAL_STEPS.map((item, index) => {
                    const active = index === currentStep;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCurrentStep(index)}
                        className={`flex w-full items-center gap-3 rounded-[22px] px-4 py-3 text-left transition ${
                          active
                            ? "bg-[rgba(66,133,244,0.12)] text-[#1a73e8]"
                            : "bg-white/50 text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white"
                        }`}
                      >
                        <span className="font-['IBM_Plex_Mono'] text-xs font-semibold tracking-[0.2em]">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                        <span className="text-sm font-medium">{item.title}</span>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <section className="modal-card p-6 sm:p-7">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex h-full flex-col"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="surface-kicker">
                          Step {(currentStep + 1).toString().padStart(2, "0")} of {TUTORIAL_STEPS.length}
                        </div>
                        <h3 className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-slate-950 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
                          {step.summary}
                        </p>
                      </div>

                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-[24px]"
                        style={{ backgroundColor: step.soft, color: step.accent }}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="mt-8 grid gap-3">
                      {step.bullets.map((bullet) => (
                        <div
                          key={bullet}
                          className="flex items-start gap-3 rounded-[24px] bg-white/60 px-4 py-4 text-sm leading-7 text-slate-600 dark:bg-white/5 dark:text-slate-300"
                        >
                          <span
                            className="mt-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: step.accent }}
                          />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-[rgba(15,23,42,0.08)] px-5 py-4 dark:border-white/10 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-center gap-3 rounded-full bg-white/60 px-4 py-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <span>Show hints during solving</span>
              <span className="toggle-shell" data-checked={settings.showHints ? "true" : "false"}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={settings.showHints}
                  onChange={(event) => updateSettings({ showHints: event.target.checked })}
                />
                <span className="toggle-thumb" />
              </span>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              {!isFirst ? (
                <button type="button" onClick={handleRestart} className="surface-button-secondary sm:w-auto">
                  <FiRotateCcw className="h-4 w-4" />
                  Restart
                </button>
              ) : null}

              <button type="button" onClick={handlePrev} disabled={isFirst} className="surface-button-secondary sm:w-auto">
                <FiChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button type="button" onClick={handleNext} className="surface-button-primary sm:w-auto">
                {isLast ? (
                  <>
                    Get started
                    <FiPlay className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <FiChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
