import { useId } from "react";

/**
 * X Bot: a round little helper with a screen for a face and an X-shaped spark on its
 * antenna. Its eyes follow --xb-look-x and --xb-look-y (set by XBot), and it blinks.
 * Decorative: the button around it carries the name.
 */
export function XBotMascot({ size = 56, mood = "happy", className = "" }: { size?: number; mood?: "happy" | "talking" | "wave"; className?: string }) {
  const id = `xb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false" className={`xbot ${className}`} data-mood={mood}>
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.55" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.3" cy="0.2" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Antenna with its X spark. */}
      <path d="M32 15V8" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
      <g className="xbot-spark" style={{ transformOrigin: "32px 6px" }}>
        <path d="M28.6 2.6 35.4 9.4M35.4 2.6 28.6 9.4" stroke="#f59e0b" strokeWidth="3.2" strokeLinecap="round" />
      </g>
      {/* Ears. */}
      <rect x="5" y="27" width="6" height="12" rx="3" fill="#0d9488" />
      <rect x="53" y="27" width="6" height="12" rx="3" fill="#7c3aed" />
      {/* Waving arm. */}
      <g className="xbot-arm" style={{ transformOrigin: "55px 44px" }}>
        <path d="M55 44q6-2 6.5-9" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </g>
      {/* Head. */}
      <rect x="9" y="14" width="46" height="38" rx="17" fill={`url(#${id}b)`} />
      <rect x="9" y="14" width="46" height="38" rx="17" fill={`url(#${id}s)`} />
      {/* Face screen. */}
      <rect x="15.5" y="21.5" width="33" height="23" rx="11" fill="#0b1220" />
      <g className="xbot-eyes">
        <ellipse className="xbot-eye" cx="26" cy="31.5" rx="3.3" ry="4.2" fill="#ecfeff" />
        <ellipse className="xbot-eye" cx="38" cy="31.5" rx="3.3" ry="4.2" fill="#ecfeff" />
        <circle cx="27.2" cy="30" r="1.1" fill="#0b1220" />
        <circle cx="39.2" cy="30" r="1.1" fill="#0b1220" />
      </g>
      <path className="xbot-mouth" d="M28.5 38.2q3.5 3 7 0" stroke="#5eead4" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cheeks. */}
      <circle cx="19.5" cy="40" r="2.2" fill="#f472b6" opacity="0.55" />
      <circle cx="44.5" cy="40" r="2.2" fill="#f472b6" opacity="0.55" />
    </svg>
  );
}
