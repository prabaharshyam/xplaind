/**
 * UX-7: the loading screen. The Xplaind X, drawn as three blades that fly in, lock together and
 * catch a sweep of light while a teal bar fills beneath, the way the favicon is built. It is
 * server-rendered markup, so it is on screen from the first paint, before any script runs;
 * PageLoaderControl then hides it once the page is ready and brings it back when the visitor
 * moves to another page or language. It never takes taps (pointer-events: none), and under
 * reduced motion the X stays still and only fades.
 */
export function PageLoader() {
  return (
    <>
      <div id="xp-splash" className="xp-splash" data-state="boot" aria-hidden="true">
        <svg className="xp-mark" viewBox="80 110 350 310" width="140" height="124" focusable="false">
          <defs>
            <clipPath id="xp-mark-clip">
              <path d={BLADES.long} />
              <path d={BLADES.top} />
              <path d={BLADES.bottom} />
            </clipPath>
            <linearGradient id="xp-mark-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7fd1c7" stopOpacity="0" />
              <stop offset="0.5" stopColor="#7fd1c7" stopOpacity="0.95" />
              <stop offset="1" stopColor="#7fd1c7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="xp-blades">
            <path className="xp-blade xp-blade-long" d={BLADES.long} />
            <path className="xp-blade xp-blade-top" d={BLADES.top} />
            <path className="xp-blade xp-blade-bottom" d={BLADES.bottom} />
          </g>
          <g clipPath="url(#xp-mark-clip)">
            <rect className="xp-sheen" x="60" y="110" width="150" height="250" fill="url(#xp-mark-sheen)" />
          </g>
          <rect className="xp-bar-track" x="163" y="386" width="186" height="28" rx="14" />
          <rect className="xp-bar-fill" x="163" y="386" width="186" height="28" rx="14" />
        </svg>
      </div>
      {/* Without scripts nothing would ever hide it. */}
      <noscript>
        <style>{".xp-splash{display:none}"}</style>
      </noscript>
      <span id="xp-splash-status" role="status" aria-live="polite" className="sr-only" />
    </>
  );
}

/** The X from the favicon in three pieces, in a 512-unit drawing: the long blade, and the two short tips. */
const BLADES = {
  long: "M95 126 H178 Q190 126 199 136 L258 205 Q276 228 300 255 L420 335 H336 Q324 335 314 326 L214 222 Q203 211 190 200 Z",
  top: "M335 126 H422 L310 222 Q303 227 297 221 L268 193 Q262 188 266 183 Z",
  bottom: "M178 335 H88 L200 239 Q207 234 213 239 L244 266 Q250 272 245 277 Z",
} as const;
