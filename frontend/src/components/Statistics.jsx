import { motion } from "framer-motion";
import {
  FiActivity,
  FiAward,
  FiBarChart2,
  FiClock,
  FiRotateCcw,
  FiTarget,
  FiTrendingUp,
  FiX
} from "react-icons/fi";
import { useCubeStore } from "../store/cubeStore";

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "--:--";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function SummaryCard({ icon: Icon, title, value, subtitle, accent, soft }) {
  return (
    <div className="modal-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="surface-kicker">{title}</div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.07em] text-slate-950 dark:text-white">
            {value}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</div>
        </div>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-[18px]"
          style={{ backgroundColor: soft, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ProgressLane({ label, current, target, accent }) {
  const percentage = Math.max(0, Math.min(100, Math.round((current / target) * 100)));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          {Math.min(current, target)}/{target}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percentage}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

export default function Statistics({ onClose }) {
  const statistics = useCubeStore((state) => state.statistics);
  const updateStatistics = useCubeStore((state) => state.updateStatistics);

  const totalSessions = statistics.totalSessions;
  const avgMovesPerSession =
    totalSessions > 0 ? Math.round(statistics.totalMoves / totalSessions) : 0;
  const avgTimePerSession =
    totalSessions > 0 ? Math.round(statistics.totalTimeSeconds / totalSessions) : 0;

  const masteryBand =
    statistics.solvedCubes >= 100
      ? "Advanced"
      : statistics.solvedCubes >= 50
        ? "Intermediate"
        : statistics.solvedCubes >= 10
          ? "Beginner+"
          : "Starter";

  function handleReset() {
    if (
      !window.confirm("Reset all local statistics? This cannot be undone.")
    ) {
      return;
    }

    updateStatistics({
      totalSessions: 0,
      totalMoves: 0,
      totalTimeSeconds: 0,
      solvedCubes: 0,
      bestTime: null,
      averageTime: null,
      moveAccuracy: 100
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop"
      onClick={(event) => event.target === event.currentTarget && onClose()}
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
            <p className="modal-eyebrow">Statistics</p>
            <h2 className="modal-title">Practice metrics with a cleaner signal.</h2>
            <p className="modal-subtitle">
              The redesign turns the old analytics screen into a compact dashboard with progress,
              efficiency, and session volume visible at a glance.
            </p>
          </div>

          <button type="button" onClick={onClose} className="modal-close" aria-label="Close statistics">
            <FiX className="h-5 w-5" />
          </button>
        </header>

        <div className="modal-body space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={FiAward}
              title="Solved cubes"
              value={statistics.solvedCubes}
              subtitle={`${totalSessions} recorded sessions`}
              accent="#4285F4"
              soft="rgba(66,133,244,0.14)"
            />
            <SummaryCard
              icon={FiClock}
              title="Best time"
              value={formatTime(statistics.bestTime)}
              subtitle={
                statistics.averageTime
                  ? `Average ${formatTime(statistics.averageTime)}`
                  : "Average time appears after completed solves"
              }
              accent="#34A853"
              soft="rgba(52,168,83,0.14)"
            />
            <SummaryCard
              icon={FiActivity}
              title="Total moves"
              value={statistics.totalMoves.toLocaleString()}
              subtitle={`${avgMovesPerSession} average moves per session`}
              accent="#FBBC05"
              soft="rgba(251,188,5,0.18)"
            />
            <SummaryCard
              icon={FiTrendingUp}
              title="Accuracy"
              value={`${statistics.moveAccuracy}%`}
              subtitle={`${masteryBand} coaching profile`}
              accent="#EA4335"
              soft="rgba(234,67,53,0.14)"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <section className="modal-card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[rgba(66,133,244,0.14)] text-[#1a73e8]">
                  <FiTarget className="h-5 w-5" />
                </div>
                <div>
                  <div className="surface-kicker">Mastery path</div>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                    Solves translate directly into progression.
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <ProgressLane label="Beginner" current={statistics.solvedCubes} target={10} accent="#4285F4" />
                <ProgressLane label="Intermediate" current={statistics.solvedCubes} target={50} accent="#34A853" />
                <ProgressLane label="Advanced" current={statistics.solvedCubes} target={100} accent="#FBBC05" />
                <ProgressLane label="Expert" current={statistics.solvedCubes} target={500} accent="#EA4335" />
              </div>
            </section>

            <div className="space-y-4">
              <section className="modal-card p-5">
                <div className="surface-kicker">Session signal</div>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                  What the data says right now.
                </h3>
                <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white/60 px-4 py-3 dark:bg-white/5">
                    <span>Total sessions</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{totalSessions}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white/60 px-4 py-3 dark:bg-white/5">
                    <span>Total practice time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatTime(statistics.totalTimeSeconds)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white/60 px-4 py-3 dark:bg-white/5">
                    <span>Average session time</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatTime(avgTimePerSession)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white/60 px-4 py-3 dark:bg-white/5">
                    <span>Average moves</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{avgMovesPerSession}</span>
                  </div>
                </div>
              </section>

              <section className="modal-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[rgba(52,168,83,0.14)] text-[#19733c]">
                    <FiBarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="surface-kicker">Design note</div>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.05em] text-slate-950 dark:text-white">
                      Analytics now fit the product language.
                    </h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  This panel now reads like a Google Labs experiment: fewer heavy cards, stronger hierarchy,
                  and clearer separation between progress, efficiency, and totals.
                </p>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(15,23,42,0.08)] pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Statistics are stored locally in the browser through the existing Zustand store.
            </p>
            <button type="button" onClick={handleReset} className="surface-button-danger">
              <FiRotateCcw className="h-4 w-4" />
              Reset local statistics
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
