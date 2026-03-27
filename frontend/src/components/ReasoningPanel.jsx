import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ReasoningPanel — Visualizes reasoning engine output (CoT/ToT/Verify).
 *
 * Props:
 *   reasoning — result object from /api/reasoning/* endpoints
 *   loading   — boolean, true while fetching
 *   error     — string | null
 */
export default function ReasoningPanel({ reasoning, loading, error }) {
  const [expandedStep, setExpandedStep] = useState(null);

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
        <p className="font-semibold">Reasoning Error</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <LoadingSpinner />
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          Reasoning in progress…
        </span>
      </div>
    );
  }

  if (!reasoning) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
        No reasoning data yet. Use the reasoning controls above to analyze the cube.
      </div>
    );
  }

  const { strategy, steps, moves, explanation, treeOfThought, verification, reasoningType } = reasoning;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ReasoningTypeBadge type={reasoningType || "chain-of-thought"} />
          {strategy && (
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {strategy}
            </span>
          )}
        </div>
        {verification && (
          <ConfidenceBar confidence={verification.confidence} />
        )}
      </div>

      {/* Moves */}
      {moves && moves.length > 0 && (
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Suggested Moves
          </p>
          <div className="flex flex-wrap gap-1.5">
            {moves.map((move, i) => (
              <span
                key={`${move}-${i}`}
                className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md bg-indigo-600 px-2 font-mono text-sm font-bold text-white"
              >
                {move}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tree of Thought branches */}
      {treeOfThought && treeOfThought.branches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Strategy Exploration
          </p>
          {treeOfThought.branches.map((branch) => (
            <motion.div
              key={branch.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: branch.id * 0.1 }}
              className={`rounded-lg border p-3 ${
                branch.selected
                  ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {branch.selected && "✓ "}
                  {branch.description}
                </span>
                {branch.score > 0 && (
                  <span className="text-xs text-zinc-400">Score: {branch.score}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reasoning Steps */}
      {steps && steps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Reasoning Steps
          </p>
          <div className="relative ml-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
            {steps.map((step, i) => (
              <StepNode
                key={step.step || i}
                step={step}
                isExpanded={expandedStep === (step.step || i)}
                onToggle={() =>
                  setExpandedStep(expandedStep === (step.step || i) ? null : (step.step || i))
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Explanation fallback */}
      {(!steps || steps.length === 0) && explanation && (
        <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/60">
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {explanation}
          </p>
        </div>
      )}

      {/* Verification summary */}
      {verification && verification.totalSteps > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Verification
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {verification.verifiedSteps}/{verification.totalSteps} steps verified
            ({Math.round(verification.confidence * 100)}% confidence)
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ReasoningTypeBadge({ type }) {
  const labels = {
    "chain-of-thought": { label: "CoT", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    "tree-of-thought": { label: "ToT", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
    "guided-solve": { label: "Guided", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    "self-verification": { label: "Verify", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    "algorithm-explanation": { label: "Algo", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  };

  const config = labels[type] || labels["chain-of-thought"];

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

function ConfidenceBar({ confidence }) {
  const percent = Math.round(confidence * 100);
  const color =
    percent >= 80 ? "bg-green-500" : percent >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-zinc-400">{percent}%</span>
    </div>
  );
}

function StepNode({ step, isExpanded, onToggle }) {
  const hasVerification = step.verification && step.verification.length > 0;

  return (
    <div className="relative pb-4 last:pb-0">
      {/* Timeline dot */}
      <div
        className={`absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 ${
          step.verified
            ? "border-green-500 bg-green-500"
            : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
        }`}
      />

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Step {step.step}: {step.thought}
        </p>
        {step.action && (
          <p className="mt-0.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
            → {step.action}
          </p>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasVerification && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {step.verified ? "✓" : "⚠"} {step.verification}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-indigo-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
