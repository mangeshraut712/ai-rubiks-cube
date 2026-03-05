/**
 * Interactive Tutorial/Walkthrough Component
 * 2026: Comprehensive learning mode for beginners
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiPlay,
  FiRotateCcw,
  FiTarget,
  FiLayers,
  FiZap,
  FiAward
} from "react-icons/fi";
import { useCubeStore } from "../store/cubeStore";

const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to Gemini Rubik's Tutor!",
    content:
      "Let's learn how to solve a Rubik's Cube together. I'll guide you through the basics and get you ready to solve your first cube.",
    icon: FiAward,
    action: null
  },
  {
    id: "cube-structure",
    title: "Understanding the Cube",
    content:
      "A 3x3 Rubik's Cube has 6 faces: Up (U), Down (D), Left (L), Right (R), Front (F), and Back (B). Each face has 9 stickers and a center piece that never moves.",
    icon: FiLayers,
    action: "highlight-centers"
  },
  {
    id: "move-notation",
    title: "Move Notation",
    content:
      "We use letters to represent moves:\n• R = Right face clockwise\n• R' = Right face counter-clockwise (prime)\n• R2 = Right face 180 degrees\n\nTry clicking the on-screen buttons or use your keyboard!",
    icon: FiZap,
    action: "show-notation"
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    content:
      "Speed up your solving with keyboard shortcuts:\n• U, D, L, R, F, B = Basic moves\n• Shift + Letter = Prime moves (counter-clockwise)\n• Space = Start/End session\n• Ctrl+Z = Undo, Ctrl+Y = Redo",
    icon: FiTarget,
    action: "highlight-keyboard"
  },
  {
    id: "solving-method",
    title: "The CFOP Method",
    content:
      "We'll use the CFOP method to solve the cube:\n1. Cross - Make a cross on one face\n2. F2L - Solve first two layers\n3. OLL - Orient last layer\n4. PLL - Permute last layer\n\nDon't worry, Cubey will guide you through each step!",
    icon: FiLayers,
    action: null
  },
  {
    id: "voice-commands",
    title: "Voice Commands",
    content:
      "You can also control the cube with your voice!\n• Say 'turn right' for R\n• Say 'up prime' for U'\n• Say 'front twice' for F2\n\nEnable voice commands in the settings.",
    icon: FiZap,
    action: "show-voice"
  },
  {
    id: "challenge-mode",
    title: "Challenge Mode",
    content:
      "Ready for a challenge? Race against Cubey to solve a scrambled cube! Enable Challenge Mode to test your skills and track your improvement over time.",
    icon: FiAward,
    action: "highlight-challenge"
  },
  {
    id: "ready",
    title: "You're Ready!",
    content:
      "Great job completing the tutorial! Start a session with Cubey and begin your Rubik's Cube journey. Remember, practice makes perfect!",
    icon: FiPlay,
    action: "enable-session"
  }
];

export default function Tutorial({ onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showHints, setShowHints] = useState(true);
  const store = useCubeStore();

  const step = TUTORIAL_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  const handleNext = useCallback(() => {
    if (isLast) {
      store.skipTutorial();
      onComplete?.();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLast, onComplete, store]);

  const handlePrev = useCallback(() => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [isFirst]);

  const handleSkip = useCallback(() => {
    store.skipTutorial();
    onClose?.();
  }, [onClose, store]);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleSkip()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800 dark:text-white"
        >
          {/* Header with progress */}
          <div className="relative h-2 bg-gray-200 dark:bg-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Skip tutorial"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-8">
            <motion.div
              key={step.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <Icon className="h-10 w-10" />
              </div>

              {/* Title */}
              <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                {step.title}
              </h2>

              {/* Content */}
              <p className="mb-6 whitespace-pre-line text-gray-600 dark:text-gray-300 leading-relaxed">
                {step.content}
              </p>

              {/* Step indicator */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </p>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrev}
                disabled={isFirst}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <FiChevronLeft className="w-5 h-5" />
                Back
              </button>

              <div className="flex gap-2">
                {!isFirst && (
                  <button
                    onClick={handleRestart}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:bg-slate-700"
                    title="Restart tutorial"
                  >
                    <FiRotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md transition-all hover:shadow-lg"
                >
                  {isLast ? (
                    <>
                      Finish
                      <FiAward className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Next
                      <FiChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-slate-900/50 px-8 py-4 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showHints}
                onChange={(e) => setShowHints(e.target.checked)}
                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              Show hints during solving
            </label>

            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
