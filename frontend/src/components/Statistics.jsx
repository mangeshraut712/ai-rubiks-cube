/**
 * Statistics Dashboard Component
 * 2026: Comprehensive analytics for tracking progress
 */
import { motion } from "framer-motion";
import {
  FiClock,
  FiActivity,
  FiTrendingUp,
  FiAward,
  FiTarget,
  FiCalendar,
  FiBarChart2,
  FiRotateCcw
} from "react-icons/fi";
import { useCubeStore } from "../store/cubeStore";

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function StatCard({ icon: Icon, title, value, subtitle, trend, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:text-white"
    >
      <div
        className={`absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-10`}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg bg-gradient-to-br ${colorClasses[color]} p-3 text-white`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-sm font-medium ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}

function ProgressBar({ current, total, label, color = "blue" }) {
  const percentage = Math.round((current / total) * 100);

  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500"
  };

  return (
    <div className="mb-4">
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`h-full rounded-full ${colorClasses[color]} transition-all duration-500`}
        />
      </div>
    </div>
  );
}

export default function Statistics({ onClose }) {
  const statistics = useCubeStore((state) => state.statistics);
  const resetStats = useCubeStore((state) => state.updateStatistics);

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all statistics? This cannot be undone.")) {
      resetStats({
        totalSessions: 0,
        totalMoves: 0,
        totalTimeSeconds: 0,
        solvedCubes: 0,
        bestTime: null,
        averageTime: null,
        moveAccuracy: 100
      });
    }
  };

  const avgMovesPerSession =
    statistics.totalSessions > 0 ? Math.round(statistics.totalMoves / statistics.totalSessions) : 0;

  const avgTimePerSession =
    statistics.totalSessions > 0
      ? Math.round(statistics.totalTimeSeconds / statistics.totalSessions)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-gray-50 shadow-2xl dark:bg-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2 text-white">
              <FiBarChart2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track your Rubik&apos;s Cube journey
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700"
          >
            <FiActivity className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FiAward}
              title="Solved Cubes"
              value={statistics.solvedCubes}
              subtitle={`${statistics.totalSessions} sessions`}
              color="purple"
            />

            <StatCard
              icon={FiClock}
              title="Best Time"
              value={statistics.bestTime ? formatTime(statistics.bestTime) : "--:--"}
              subtitle={
                statistics.averageTime
                  ? `Avg: ${formatTime(statistics.averageTime)}`
                  : "No times recorded"
              }
              color="green"
            />

            <StatCard
              icon={FiActivity}
              title="Total Moves"
              value={statistics.totalMoves.toLocaleString()}
              subtitle={`${avgMovesPerSession} avg per session`}
              color="blue"
            />

            <StatCard
              icon={FiTrendingUp}
              title="Accuracy"
              value={`${statistics.moveAccuracy}%`}
              subtitle="Based on correct moves"
              color="orange"
            />
          </div>

          {/* Progress Section */}
          <div className="mb-8 rounded-xl bg-white p-6 shadow-md dark:bg-slate-800">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <FiTarget className="h-5 w-5 text-blue-500" />
              Progress Towards Mastery
            </h3>

            <ProgressBar
              current={Math.min(statistics.solvedCubes, 10)}
              total={10}
              label="Beginner (10 solves)"
              color="blue"
            />

            <ProgressBar
              current={Math.min(statistics.solvedCubes, 50)}
              total={50}
              label="Intermediate (50 solves)"
              color="green"
            />

            <ProgressBar
              current={Math.min(statistics.solvedCubes, 100)}
              total={100}
              label="Advanced (100 solves)"
              color="purple"
            />

            <ProgressBar
              current={Math.min(statistics.solvedCubes, 500)}
              total={500}
              label="Expert (500 solves)"
              color="orange"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-slate-800">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <FiCalendar className="h-5 w-5 text-purple-500" />
                Session History
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                  <span className="font-semibold">{statistics.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Time</span>
                  <span className="font-semibold">{formatTime(statistics.totalTimeSeconds)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Time/Session</span>
                  <span className="font-semibold">{formatTime(avgTimePerSession)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg Moves/Session</span>
                  <span className="font-semibold">{avgMovesPerSession}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-md dark:bg-slate-800">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <FiTrendingUp className="h-5 w-5 text-green-500" />
                Achievements
              </h3>
              <div className="space-y-2">
                {statistics.solvedCubes >= 1 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <FiAward className="h-5 w-5" />
                    <span>First Solve!</span>
                  </div>
                )}
                {statistics.solvedCubes >= 10 && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <FiTarget className="h-5 w-5" />
                    <span>Getting Started (10 solves)</span>
                  </div>
                )}
                {statistics.solvedCubes >= 50 && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <FiActivity className="h-5 w-5" />
                    <span>Intermediate Solver (50 solves)</span>
                  </div>
                )}
                {statistics.solvedCubes >= 100 && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <FiTrendingUp className="h-5 w-5" />
                    <span>Speed Cuber (100 solves)</span>
                  </div>
                )}
                {statistics.bestTime && statistics.bestTime < 60 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <FiClock className="h-5 w-5" />
                    <span>Sub-1 Minute Solve!</span>
                  </div>
                )}
                {statistics.solvedCubes < 1 && (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    Complete your first solve to earn achievements!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <FiRotateCcw className="h-4 w-4" />
            Reset Statistics
          </button>

          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-6 py-2 font-medium text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
