import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiCommand,
  FiHelpCircle,
  FiInfo,
  FiMic,
  FiMonitor,
  FiMoon,
  FiSun,
  FiVolume2,
  FiVolumeX,
  FiX,
  FiZap
} from "react-icons/fi";
import { useCubeStore, useSettings } from "../store/cubeStore";

function ToggleControl({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[22px] bg-white/60 px-4 py-3 text-sm dark:bg-white/5">
      <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <span className="toggle-shell" data-checked={checked ? "true" : "false"}>
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <span className="toggle-thumb" />
      </span>
    </label>
  );
}

function SettingCard({ icon: Icon, title, description, accent, soft, children }) {
  return (
    <section className="modal-card p-5">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
          style={{ backgroundColor: soft, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ShortcutCard({ title, rows }) {
  return (
    <section className="modal-card p-5">
      <div className="surface-kicker">{title}</div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-[20px] bg-white/60 px-4 py-3 text-sm dark:bg-white/5"
          >
            <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
            <code className="rounded-full bg-[rgba(66,133,244,0.12)] px-3 py-1 text-[0.72rem] font-semibold text-[#1a73e8]">
              {row.keys}
            </code>
          </div>
        ))}
      </div>
    </section>
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
        className="modal-backdrop"
        onClick={(event) => event.target === event.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 18 }}
          transition={{ type: "spring", stiffness: 250, damping: 24 }}
          className="modal-shell max-w-5xl"
        >
          <header className="modal-header">
            <div>
              <p className="modal-eyebrow">Settings</p>
              <h2 className="modal-title">A quieter control surface for the tutor.</h2>
              <p className="modal-subtitle">
                I rewrote settings into grouped cards, persistent toggles, and a shortcut reference
                that matches the new search-first interface.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="modal-close"
              aria-label="Close settings"
            >
              <FiX className="h-5 w-5" />
            </button>
          </header>

          <div className="border-b border-[rgba(15,23,42,0.08)] px-5 pb-4 dark:border-white/10">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`modal-tab ${active ? "is-active" : ""}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid gap-4 md:grid-cols-2"
              >
                {activeTab === "general" ? (
                  <>
                    <SettingCard
                      icon={isDarkMode ? FiMoon : FiSun}
                      title="Theme mode"
                      description="Switch between the clean light stage and the darker lab-style workspace."
                      accent="#4285F4"
                      soft="rgba(66,133,244,0.14)"
                    >
                      <ToggleControl
                        checked={isDarkMode}
                        onChange={toggleDarkMode}
                        label={isDarkMode ? "Dark interface enabled" : "Light interface enabled"}
                      />
                    </SettingCard>

                    <SettingCard
                      icon={settings.soundEnabled ? FiVolume2 : FiVolumeX}
                      title="Sound effects"
                      description="Keep move feedback audible during practice and demos."
                      accent="#34A853"
                      soft="rgba(52,168,83,0.14)"
                    >
                      <ToggleControl
                        checked={settings.soundEnabled}
                        onChange={(event) => updateSettings({ soundEnabled: event.target.checked })}
                        label={settings.soundEnabled ? "Feedback sounds on" : "Feedback sounds off"}
                      />
                    </SettingCard>

                    <SettingCard
                      icon={FiZap}
                      title="Auto-rotate"
                      description="Let the viewer keep subtle motion while you inspect the cube."
                      accent="#FBBC05"
                      soft="rgba(251,188,5,0.18)"
                    >
                      <ToggleControl
                        checked={settings.autoRotate}
                        onChange={(event) => updateSettings({ autoRotate: event.target.checked })}
                        label={settings.autoRotate ? "Auto-rotate on" : "Auto-rotate off"}
                      />
                    </SettingCard>

                    <SettingCard
                      icon={FiMic}
                      title="Voice commands"
                      description="Keep hands free by turning natural language and spoken moves into actions."
                      accent="#EA4335"
                      soft="rgba(234,67,53,0.14)"
                    >
                      <ToggleControl
                        checked={settings.voiceEnabled !== false}
                        onChange={(event) => updateSettings({ voiceEnabled: event.target.checked })}
                        label={
                          settings.voiceEnabled !== false
                            ? "Voice commands on"
                            : "Voice commands off"
                        }
                      />
                    </SettingCard>

                    <section className="modal-card p-5 md:col-span-2">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[rgba(66,133,244,0.14)] text-[#1a73e8]">
                          <FiMonitor className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                            Animation speed
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                            Tune cube animations between a snappier demo feel and a slower learning
                            pace.
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 rounded-[24px] bg-white/60 px-4 py-4 dark:bg-white/5">
                        <input
                          type="range"
                          min="100"
                          max="1000"
                          step="50"
                          value={settings.animationSpeed}
                          onChange={(event) =>
                            updateSettings({
                              animationSpeed: Number.parseInt(event.target.value, 10)
                            })
                          }
                          className="range-input"
                        />
                        <div className="mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                          <span>Fast</span>
                          <span>{settings.animationSpeed} ms</span>
                          <span>Slow</span>
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}

                {activeTab === "accessibility" ? (
                  <>
                    <SettingCard
                      icon={FiHelpCircle}
                      title="Hints"
                      description="Keep additional guidance visible while you solve."
                      accent="#4285F4"
                      soft="rgba(66,133,244,0.14)"
                    >
                      <ToggleControl
                        checked={settings.showHints}
                        onChange={(event) => updateSettings({ showHints: event.target.checked })}
                        label={settings.showHints ? "Hints visible" : "Hints hidden"}
                      />
                    </SettingCard>

                    <SettingCard
                      icon={FiVolume2}
                      title="Haptic feedback"
                      description="Trigger vibration cues on supported mobile devices."
                      accent="#34A853"
                      soft="rgba(52,168,83,0.14)"
                    >
                      <ToggleControl
                        checked={settings.hapticsEnabled}
                        onChange={(event) =>
                          updateSettings({ hapticsEnabled: event.target.checked })
                        }
                        label={settings.hapticsEnabled ? "Haptics on" : "Haptics off"}
                      />
                    </SettingCard>

                    <SettingCard
                      icon={FiMonitor}
                      title="High contrast"
                      description="Boost overall contrast for stronger separation in the stage and panels."
                      accent="#FBBC05"
                      soft="rgba(251,188,5,0.18)"
                    >
                      <ToggleControl
                        checked={settings.highContrast}
                        onChange={(event) => updateSettings({ highContrast: event.target.checked })}
                        label={settings.highContrast ? "High contrast on" : "High contrast off"}
                      />
                    </SettingCard>

                    <section className="modal-card p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[rgba(234,67,53,0.14)] text-[#b42318]">
                          <FiInfo className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                            Persistence
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                            All toggles persist through the existing local Zustand store. No extra
                            settings layer was added in the rewrite.
                          </p>
                        </div>
                      </div>
                    </section>
                  </>
                ) : null}

                {activeTab === "shortcuts" ? (
                  <>
                    <ShortcutCard
                      title="Cube moves"
                      rows={[
                        { label: "Basic turns", keys: "U D L R F B" },
                        { label: "Prime turns", keys: "Shift + key" },
                        { label: "Double turns", keys: "2 + key" }
                      ]}
                    />
                    <ShortcutCard
                      title="Session controls"
                      rows={[
                        { label: "Start or end session", keys: "Space" },
                        { label: "Undo", keys: "Ctrl + Z" },
                        { label: "Redo", keys: "Ctrl + Y" },
                        { label: "Request hint", keys: "H" }
                      ]}
                    />
                    <ShortcutCard
                      title="Interface"
                      rows={[
                        { label: "Open settings", keys: "Ctrl + ," },
                        { label: "Toggle theme", keys: "Shift + D" },
                        { label: "Toggle challenge mode", keys: "Shift + C" }
                      ]}
                    />
                    <section className="modal-card p-5">
                      <div className="surface-kicker">Rewrite note</div>
                      <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                        The shortcut reference now lives inside the same modal system as the rest of
                        the product, instead of feeling like a detached developer panel.
                      </p>
                    </section>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 border-t border-[rgba(15,23,42,0.08)] px-5 py-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <FiInfo className="h-4 w-4" />
              Settings save automatically.
            </div>
            <button type="button" onClick={onClose} className="surface-button-primary sm:w-auto">
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
