import { BRAND_COLORS } from "../content/appContent";

export function BrandWordmark({ word = "Cubey", className = "" }) {
  return (
    <span className={`brand-wordmark ${className}`.trim()}>
      {word.split("").map((letter, index) => (
        <span key={`${letter}-${index}`} style={{ color: BRAND_COLORS[index % BRAND_COLORS.length] }}>
          {letter}
        </span>
      ))}
    </span>
  );
}

export function CapabilityCard({ icon: Icon, eyebrow, title, detail, accent, soft }) {
  return (
    <article className="surface-panel surface-panel--muted relative overflow-hidden p-5">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: soft, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="surface-kicker">{eyebrow}</span>
      </div>
      <h3 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{detail}</p>
    </article>
  );
}

export function DetailMetric({ label, value, eyebrow }) {
  return (
    <div className="surface-panel surface-panel--muted p-4">
      <div className="surface-kicker">{eyebrow}</div>
      <div className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
        {value}
      </div>
    </div>
  );
}

export function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  tone = "default",
  disabled = false
}) {
  const toneStyles = {
    default:
      "border-[color:rgba(15,23,42,0.08)] bg-white/80 text-slate-700 hover:border-[color:rgba(66,133,244,0.24)] hover:text-slate-950 dark:border-white/10 dark:bg-slate-950/30 dark:text-slate-200 dark:hover:text-white",
    blue:
      "border-[color:rgba(66,133,244,0.25)] bg-[rgba(66,133,244,0.12)] text-[#1a73e8] hover:bg-[rgba(66,133,244,0.18)] dark:text-blue-300",
    green:
      "border-[color:rgba(52,168,83,0.28)] bg-[rgba(52,168,83,0.12)] text-[#19733c] hover:bg-[rgba(52,168,83,0.18)] dark:text-green-300",
    yellow:
      "border-[color:rgba(251,188,5,0.28)] bg-[rgba(251,188,5,0.14)] text-[#9a6800] hover:bg-[rgba(251,188,5,0.2)] dark:text-yellow-200",
    red:
      "border-[color:rgba(234,67,53,0.28)] bg-[rgba(234,67,53,0.12)] text-[#b3261e] hover:bg-[rgba(234,67,53,0.18)] dark:text-red-300"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-start gap-3 rounded-[24px] border p-4 text-left transition duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${toneStyles[tone]}`}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
        <Icon className="h-[1.125rem] w-[1.125rem]" />
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-1 text-xs leading-5 opacity-80">{description}</div>
      </div>
    </button>
  );
}

export function ClockMarker() {
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#FBBC05]" />;
}
