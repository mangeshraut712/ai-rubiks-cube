/**
 * Settings Panel Component
 * 2026: Comprehensive settings with persistence
 */
import { motion, AnimatePresence } from "framer-motion";
import {
    FiX,
    FiMoon,
    FiSun,
    FiVolume2,
    FiVolumeX,
    FiMonitor,
    FiZap,
    FiInfo,
    FiCommand,
    FiMic,
    FiHelpCircle
} from "react-icons/fi";
import { useCubeStore, useSettings } from "../store/cubeStore";
import { useState } from "react";

function SettingItem({ icon: Icon, title, description, children }) {
    return (
        <div className="flex items-start gap-4 py-4 border-b border-gray-100 dark:border-slate-700 last:border-0">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                {children && <div className="mt-3">{children}</div>}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
                <div
                    className={`h-6 w-11 rounded-full transition-colors ${checked ? "bg-blue-500" : "bg-gray-300 dark:bg-slate-600"
                        }`}
                >
                    <div
                        className={`h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0.5"
                            } mt-0.5`}
                    />
                </div>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </label>
    );
}

export default function Settings({ onClose }) {
    const settings = useSettings();
    const updateSettings = useCubeStore((state) => state.updateSettings);
    const toggleDarkMode = useCubeStore((state) => state.toggleDarkMode);
    const isDarkMode = useCubeStore((state) => state.isDarkMode);

    const [activeTab, setActiveTab] = useState("general");

    const tabs = [
        { id: "general", label: "General", icon: FiMonitor },
        { id: "accessibility", label: "Accessibility", icon: FiHelpCircle },
        { id: "shortcuts", label: "Shortcuts", icon: FiCommand }
    ];

    return (
        <AnimatePresence>
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
                    className="relative w-full max-w-2xl overflow-hidden rounded-3xl glass-effect shadow-2xl dark:text-white"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200/50 p-6 dark:border-white/10">
                        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
                        >
                            <FiX className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200/50 dark:border-white/10 px-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${activeTab === tab.id
                                            ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="max-h-[60vh] overflow-y-auto p-6">
                        {activeTab === "general" && (
                            <div className="space-y-2">
                                <SettingItem
                                    icon={isDarkMode ? FiMoon : FiSun}
                                    title="Dark Mode"
                                    description="Switch between light and dark themes"
                                >
                                    <Toggle
                                        checked={isDarkMode}
                                        onChange={toggleDarkMode}
                                        label={isDarkMode ? "Dark mode enabled" : "Light mode enabled"}
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={settings.soundEnabled ? FiVolume2 : FiVolumeX}
                                    title="Sound Effects"
                                    description="Play sounds for moves and events"
                                >
                                    <Toggle
                                        checked={settings.soundEnabled}
                                        onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                                        label={settings.soundEnabled ? "Sounds enabled" : "Sounds disabled"}
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={FiZap}
                                    title="Auto-Rotate"
                                    description="Automatically rotate the cube for better viewing angles"
                                >
                                    <Toggle
                                        checked={settings.autoRotate}
                                        onChange={(e) => updateSettings({ autoRotate: e.target.checked })}
                                        label={settings.autoRotate ? "Auto-rotation on" : "Auto-rotation off"}
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={FiMic}
                                    title="Voice Commands"
                                    description="Enable voice control for hands-free solving"
                                >
                                    <Toggle
                                        checked={settings.voiceEnabled !== false}
                                        onChange={(e) => updateSettings({ voiceEnabled: e.target.checked })}
                                        label={settings.voiceEnabled !== false ? "Voice commands on" : "Voice commands off"}
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={FiMonitor}
                                    title="Animation Speed"
                                    description="Adjust the speed of cube animations"
                                >
                                    <input
                                        type="range"
                                        min="100"
                                        max="1000"
                                        step="50"
                                        value={settings.animationSpeed}
                                        onChange={(e) => updateSettings({ animationSpeed: parseInt(e.target.value) })}
                                        className="w-full accent-blue-500"
                                    />
                                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                                        <span>Fast</span>
                                        <span>{settings.animationSpeed}ms</span>
                                        <span>Slow</span>
                                    </div>
                                </SettingItem>
                            </div>
                        )}

                        {activeTab === "accessibility" && (
                            <div className="space-y-2">
                                <SettingItem
                                    icon={FiHelpCircle}
                                    title="Show Hints"
                                    description="Display helpful hints during solving"
                                >
                                    <Toggle
                                        checked={settings.showHints}
                                        onChange={(e) => updateSettings({ showHints: e.target.checked })}
                                        label={settings.showHints ? "Hints enabled" : "Hints disabled"}
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={FiVolume2}
                                    title="Haptic Feedback"
                                    description="Vibrate on mobile devices for tactile feedback"
                                >
                                    <Toggle
                                        checked={settings.hapticsEnabled}
                                        onChange={(e) => updateSettings({ hapticsEnabled: e.target.checked })}
                                        label={settings.hapticsEnabled ? "Haptics on" : "Haptics off"}
                                    />
                                </SettingItem>

                                <SettingItem
                                    icon={FiMonitor}
                                    title="High Contrast Mode"
                                    description="Increase contrast for better visibility"
                                >
                                    <Toggle
                                        checked={settings.highContrast}
                                        onChange={(e) => updateSettings({ highContrast: e.target.checked })}
                                        label={settings.highContrast ? "High contrast on" : "High contrast off"}
                                    />
                                </SettingItem>
                            </div>
                        )}

                        {activeTab === "shortcuts" && (
                            <div className="space-y-4">
                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
                                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">Cube Moves</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Basic Moves</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">
                                                U, D, L, R, F, B
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Prime (Counter-clockwise)
                                            </span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">
                                                Shift + Letter
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Double Turn</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">2 + Letter</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-gray-50 p-4 dark:bg-slate-700">
                                    <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
                                        Session Control
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Start/End Session</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">Space</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Undo</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">Ctrl + Z</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Redo</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">Ctrl + Y</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Hint</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">H</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Dark Mode</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">Shift + D</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Challenge Mode</span>
                                            <span className="font-mono text-blue-600 dark:text-blue-400">Shift + C</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <FiInfo className="h-4 w-4" />
                                <span>Settings are automatically saved</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
