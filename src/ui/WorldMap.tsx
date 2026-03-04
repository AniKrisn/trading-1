import type { TownId, Town, Route, TravelState } from '@/types';

interface WorldMapProps {
  towns: Record<TownId, Town>;
  routes: Route[];
  currentTownId: TownId | null;
  travelState: TravelState | null;
  reachable: { townId: TownId; distance: number }[];
  onTravel?: (townId: TownId) => void;
  tick: number;
  mapTheme: 'dawn' | 'day' | 'dusk' | 'dark';
}

const TOWN_COLORS: Record<TownId, string> = {
  'port-hollow': 'var(--town-port-hollow)',
  'ironkeep': 'var(--town-ironkeep)',
  'silkmere': 'var(--town-silkmere)',
  'goldcrest': 'var(--town-goldcrest)',
  'dustwatch': 'var(--town-dustwatch)',
};

const CHART_POS: Record<TownId, { x: number; y: number }> = {
  'dustwatch':    { x: 62,  y: 76  },
  'port-hollow':  { x: 116, y: 188 },
  'silkmere':     { x: 206, y: 64  },
  'ironkeep':     { x: 306, y: 102 },
  'goldcrest':    { x: 360, y: 196 },
};

const LABEL_OFFSET: Record<TownId, { dx: number; dy: number; anchor: string }> = {
  'dustwatch':    { dx: 0,   dy: -20, anchor: 'middle' },
  'port-hollow':  { dx: 3,   dy: 14,  anchor: 'end' },
  'silkmere':     { dx: 0,   dy: -26, anchor: 'middle' },
  'ironkeep':     { dx: 0,   dy: -8,  anchor: 'middle' },
  'goldcrest':    { dx: 0,   dy: 16,  anchor: 'middle' },
};

// --- Map border path ---

const MAP_BORDER =
  'M -22 6 C 60 0, 180 10, 396 5' +
  ' L 424 30' +
  ' C 430 100, 420 180, 424 254' +
  ' C 340 260, 200 250, 80 258' +
  ' L 68 248 L 74 258' +
  ' C 30 256, -20 252, -24 256' +
  ' C -30 190, -22 120, -26 60' +
  ' L -18 52 L -26 44' +
  ' C -24 28, -22 12, -22 6 Z';

// --- Archipelago islands ---

const ISLAND_DUSTWATCH =
  'M 44 72' +
  ' C 48 60, 62 56, 76 60' +
  ' C 84 62, 88 70, 84 78' +
  ' C 82 82, 76 82, 74 80' +
  ' C 70 82, 64 88, 56 92' +
  ' C 46 96, 36 86, 36 78' +
  ' C 36 74, 40 72, 44 72 Z';

const ISLAND_PORT_HOLLOW =
  'M 80 178' +
  ' C 86 168, 96 160, 110 158' +
  ' C 122 156, 134 160, 142 168' +
  ' C 150 176, 152 186, 148 196' +
  ' C 144 204, 136 210, 126 214' +
  ' C 116 218, 104 216, 94 210' +
  ' C 88 206, 82 200, 80 196' +
  ' C 76 192, 74 186, 80 178 Z';

const ISLAND_SILKMERE =
  'M 172 58' +
  ' C 178 46, 192 40, 208 42' +
  ' C 220 44, 232 50, 238 58' +
  ' C 244 66, 240 76, 232 82' +
  ' C 224 88, 212 88, 200 84' +
  ' C 190 80, 180 72, 174 66' +
  ' C 170 62, 170 60, 172 58 Z';

const ISLAND_IRONKEEP =
  'M 274 82' +
  ' C 280 72, 294 66, 308 68' +
  ' C 320 70, 330 76, 334 86' +
  ' C 338 96, 336 108, 328 116' +
  ' C 320 124, 308 128, 296 126' +
  ' C 290 124, 296 116, 300 108' +
  ' C 302 102, 298 98, 292 100' +
  ' C 286 102, 280 106, 276 110' +
  ' C 270 106, 268 96, 274 82 Z';

const ISLAND_GOLDCREST =
  'M 326 182' +
  ' C 332 172, 346 168, 364 170' +
  ' C 380 172, 392 178, 394 188' +
  ' C 396 198, 392 212, 382 220' +
  ' C 372 226, 358 228, 346 224' +
  ' C 336 220, 328 212, 326 200' +
  ' C 324 194, 324 188, 326 182 Z';

const ISLET_GOLDCREST_SOUTH =
  'M 314 228 C 318 222, 326 222, 328 228 C 330 234, 324 240, 316 238 C 310 236, 310 232, 314 228 Z';

const ISLETS = [
  'M 30 128 C 34 124, 40 124, 42 128 C 44 132, 38 136, 32 134 C 28 132, 28 130, 30 128 Z',
  'M 148 130 C 152 126, 158 126, 160 130 C 162 134, 156 138, 150 136 C 146 134, 146 132, 148 130 Z',
  'M 252 140 C 255 136, 262 136, 264 140 C 266 144, 260 148, 254 146 C 250 144, 250 142, 252 140 Z',
  'M 118 108 C 120 104, 126 104, 128 108 C 130 112, 126 114, 120 112 C 116 110, 116 108, 118 108 Z',
];

// Phantom islet — appears and disappears
const PHANTOM_ISLET =
  'M 188 158 C 192 154, 198 154, 200 158 C 202 162, 196 166, 190 164 C 186 162, 186 160, 188 158 Z';

const BASE_ISLANDS = [
  ISLAND_DUSTWATCH,
  ISLAND_PORT_HOLLOW,
  ISLAND_SILKMERE,
  ISLAND_IRONKEEP,
  ISLAND_GOLDCREST,
  ISLET_GOLDCREST_SOUTH,
  ...ISLETS,
];

// --- Contour lines (inset paths per main island) ---

const CONTOURS: string[][] = [
  // Dustwatch — 2 contours
  [
    'M 50 74 C 52 66, 62 62, 72 64 C 78 66, 80 72, 78 76 C 76 78, 72 78, 68 78 C 64 80, 60 84, 54 86 C 48 88, 42 82, 42 78 C 42 76, 46 74, 50 74 Z',
    'M 56 72 C 58 68, 64 66, 68 68 C 72 70, 72 74, 70 76 C 66 78, 60 78, 56 76 C 52 74, 54 72, 56 72 Z',
  ],
  // Port Hollow — 2 contours
  [
    'M 88 182 C 92 174, 100 168, 112 166 C 122 164, 132 166, 138 172 C 144 178, 146 186, 142 194 C 138 200, 132 204, 124 206 C 116 208, 108 206, 100 202 C 94 198, 90 194, 88 190 C 84 188, 84 184, 88 182 Z',
    'M 98 186 C 100 180, 106 176, 114 174 C 120 174, 126 176, 130 180 C 134 184, 134 190, 130 196 C 126 200, 120 200, 114 200 C 108 198, 102 194, 100 192 C 96 190, 96 188, 98 186 Z',
  ],
  // Silkmere — 2 contours
  [
    'M 180 60 C 184 52, 194 48, 206 48 C 216 50, 228 54, 232 62 C 236 68, 234 74, 228 78 C 222 82, 214 82, 204 80 C 196 76, 186 70, 182 66 C 178 64, 178 62, 180 60 Z',
    'M 190 62 C 192 58, 200 54, 208 56 C 214 58, 220 62, 222 66 C 224 70, 222 74, 218 76 C 212 78, 206 76, 200 74 C 196 72, 192 68, 190 64 C 188 64, 188 62, 190 62 Z',
  ],
  // Ironkeep — 2 contours
  [
    'M 280 86 C 284 78, 296 72, 308 74 C 318 76, 326 80, 330 88 C 332 94, 330 104, 324 110 C 318 116, 310 120, 300 118 C 294 116, 298 110, 302 104 C 304 98, 300 94, 294 96 C 288 98, 284 100, 280 104 C 276 100, 276 92, 280 86 Z',
    'M 290 88 C 294 82, 302 78, 310 80 C 316 82, 322 86, 324 92 C 326 98, 322 104, 318 108 C 312 112, 306 112, 302 110 C 300 108, 302 104, 306 98 C 308 94, 304 90, 298 92 C 294 94, 290 94, 290 88 Z',
  ],
  // Goldcrest — 2 contours
  [
    'M 332 186 C 336 178, 348 174, 362 176 C 376 178, 386 182, 388 190 C 390 198, 386 208, 378 214 C 370 220, 358 220, 348 218 C 340 214, 334 208, 332 200 C 330 196, 330 190, 332 186 Z',
    'M 340 192 C 342 186, 352 182, 362 184 C 372 186, 378 190, 380 196 C 380 202, 376 208, 370 212 C 364 214, 356 214, 350 210 C 344 206, 340 200, 340 196 C 338 194, 338 194, 340 192 Z',
  ],
];

// Main islands that get contours + ink pooling (indices 0-4)
const MAIN_ISLAND_PATHS = [
  ISLAND_DUSTWATCH,
  ISLAND_PORT_HOLLOW,
  ISLAND_SILKMERE,
  ISLAND_IRONKEEP,
  ISLAND_GOLDCREST,
];

// CSS variable per island coast tint (0–4 = main islands, rest = default)
function coastVar(i: number): string {
  return i < 5 ? `var(--coast-${i})` : 'var(--coast-default)';
}

// Base depth soundings
const DEPTHS = [
  { x: 18,  y: 108, v: 7 },
  { x: 28,  y: 120, v: 9 },
  { x: 12,  y: 130, v: 11 },
  { x: 108, y: 42,  v: 14 },
  { x: 122, y: 48,  v: 16 },
  { x: 138, y: 44,  v: 18 },
  { x: 58,  y: 178, v: 4 },
  { x: 64,  y: 168, v: 6 },
  { x: 54,  y: 156, v: 5 },
  { x: 152, y: 118, v: 12 },
  { x: 160, y: 126, v: 14 },
  { x: 168, y: 112, v: 15 },
  { x: 252, y: 72,  v: 8 },
  { x: 248, y: 84,  v: 10 },
  { x: 332, y: 130, v: 11 },
  { x: 340, y: 140, v: 9 },
  { x: 348, y: 148, v: 7 },
];

// Deterministic hash for drift
function hash(a: number, b: number): number {
  return ((a * 2654435761 + b * 1597334677) >>> 0) % 1000;
}

// Drift a depth value by -2..+2 based on tick, changes every ~20 ticks
function driftDepth(base: number, index: number, tick: number): number {
  const epoch = Math.floor(tick / 20);
  const h = hash(epoch, index);
  const offset = (h % 5) - 2; // -2 to +2
  return Math.max(1, base + offset);
}

const TOWN_IDS = Object.keys(CHART_POS) as TownId[];

export function WorldMap({
  towns,
  routes,
  currentTownId,
  travelState,
  reachable,
  onTravel,
  tick,
  mapTheme,
  children,
}: WorldMapProps & { children?: React.ReactNode }) {
  // Phantom islet appears roughly 15% of the time
  const showPhantom = hash(Math.floor(tick / 30), 42) < 150;
  const allIslands = showPhantom ? [...BASE_ISLANDS, PHANTOM_ISLET] : BASE_ISLANDS;

  return (
    <div className="chart" data-map-theme={mapTheme}>
      <svg viewBox="-30 0 460 260" className="chart-svg">
        <defs>
          {/* Coastline roughness */}
          <filter id="ink-rough" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="5" seed={7} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Compass roughness — subtle */}
          <filter id="ink-rough-compass" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="3" seed={9} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Route roughness — higher frequency, heavier displacement */}
          <filter id="ink-rough-route" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="3" seed={13} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* Ink pooling — inner shadow along coast */}
          <filter id="ink-pool" x="-10%" y="-10%" width="120%" height="120%">
            <feMorphology in="SourceGraphic" operator="erode" radius="2" result="eroded" />
            <feGaussianBlur in="eroded" stdDeviation="2.5" result="blurred" />
            <feComposite in="SourceGraphic" in2="blurred" operator="out" result="edge" />
            <feColorMatrix type="matrix" in="edge" result="dark"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
            <feComposite in="dark" in2="SourceGraphic" operator="in" />
          </filter>
          {/* Clip shadow to bottom-right only */}
          <clipPath id="shadow-clip">
            <rect x="-30" y="130" width="470" height="140" />
            <rect x="200" y="0" width="240" height="270" />
          </clipPath>
          {/* Sea clip — map border minus islands */}
          <clipPath id="sea-clip">
            <path d={MAP_BORDER} />
          </clipPath>
          <mask id="sea-mask">
            <rect x="-30" y="0" width="460" height="260" fill="white" />
            {allIslands.map((d, i) => (
              <path key={`mask-${i}`} d={d} fill="black" />
            ))}
          </mask>
        </defs>

        {/* Map background fill — sea color inside rough border */}
        <path d={MAP_BORDER} className="chart-bg" />

        {/* Sea hatching — wavy crosshatch lines */}
        <g clipPath="url(#sea-clip)" mask="url(#sea-mask)" filter="url(#ink-rough-compass)" className="chart-waves">
          {/* Horizontal */}
          {Array.from({ length: 9 }, (_, i) => {
            const y = 10 + i * 28;
            const amp = 1.2;
            const freq = 0.015 + (i % 3) * 0.003;
            let d = `M -30 ${y}`;
            for (let x = -30; x <= 430; x += 8) {
              const dy = Math.sin(x * freq + i * 1.7) * amp;
              d += ` L ${x} ${y + dy}`;
            }
            return <path key={`wh-${i}`} d={d} />;
          })}
          {/* Vertical */}
          {Array.from({ length: 16 }, (_, i) => {
            const x = -20 + i * 28;
            const amp = 1.2;
            const freq = 0.018 + (i % 3) * 0.003;
            let d = `M ${x} 0`;
            for (let y = 0; y <= 260; y += 8) {
              const dx = Math.sin(y * freq + i * 2.1) * amp;
              d += ` L ${x + dx} ${y}`;
            }
            return <path key={`wv-${i}`} d={d} />;
          })}
        </g>

        {/* Scraggly map border */}
        <g filter="url(#ink-rough-route)">
          {/* Drop shadow — offset right & down, uneven */}
          <g transform="translate(2.5, 3)" className="chart-shadow" clipPath="url(#shadow-clip)">
            <path d={MAP_BORDER} />
          </g>
          {/* Border with notched corner, nicks, and slight warp */}
          <path d={MAP_BORDER} className="chart-border" />
          <path d="M 396 5 L 424 4 L 424 30 Z" className="chart-dog-ear" />
        </g>

        {/* Islands — fill */}
        {allIslands.map((d, i) => (
          <path key={`land-${i}`} className="chart-land" d={d} />
        ))}
        {/* Ink pooling — dark inner edge on main islands */}
        {MAIN_ISLAND_PATHS.map((d, i) => (
          <g key={`pool-${i}`} filter="url(#ink-pool)" className="chart-ink-pool">
            <path d={d} fill={coastVar(i)} />
          </g>
        ))}
        {/* Contour lines */}
        <g filter="url(#ink-rough)" className="chart-contours">
          {CONTOURS.map((rings, i) =>
            rings.map((d, j) => (
              <path key={`contour-${i}-${j}`} d={d} stroke={coastVar(i)} />
            ))
          )}
        </g>
        {/* Coastline stroke */}
        <g filter="url(#ink-rough)">
          {allIslands.map((d, i) => (
            <path key={`coast-${i}`} className="chart-coast" d={d} stroke={coastVar(i)} />
          ))}
        </g>

        {/* Depth soundings (drifting) */}
        {DEPTHS.map((d, i) => (
          <text key={i} className="chart-depth" x={d.x} y={d.y}>
            {driftDepth(d.v, i, tick)}
          </text>
        ))}

        {/* Compass rose */}
        <g className="chart-compass" transform="translate(0, 235)">
          <g filter="url(#ink-rough-compass)">
            <line x1="0" y1="-13" x2="0" y2="13" />
            <line x1="-13" y1="0" x2="13" y2="0" />
            <circle r="4" className="compass-ring" />
            <circle r="1" />
          </g>
          <text x="0" y="-17" textAnchor="middle">N</text>
        </g>

        {/* Trade routes (dashed) */}
        <g filter="url(#ink-rough-route)">
          {routes.map((r, i) => {
            const a = CHART_POS[r.from as TownId];
            const b = CHART_POS[r.to as TownId];
            return (
              <line
                key={i}
                x1={a.x} y1={a.y}
                x2={b.x} y2={b.y}
                className="chart-route"
              />
            );
          })}
        </g>

        {/* Town markers + labels */}
        {TOWN_IDS.map(id => {
          const pos = CHART_POS[id];
          const label = LABEL_OFFSET[id];
          const isCurrent = currentTownId === id;
          const isReachable = reachable.some(r => r.townId === id);
          const dest = reachable.find(r => r.townId === id);

          return (
            <g key={id}>
              {/* Rough circles */}
              <g filter="url(#ink-rough)">
                {isCurrent && (
                  <circle
                    cx={pos.x} cy={pos.y} r={9}
                    className="chart-ring"
                    stroke={TOWN_COLORS[id]}
                  />
                )}
                <circle
                  cx={pos.x} cy={pos.y} r={4}
                  fill={TOWN_COLORS[id]}
                  className={
                    isReachable ? 'chart-dot chart-dot-reachable' :
                    isCurrent ? 'chart-dot' : 'chart-dot chart-dot-dim'
                  }
                  onClick={isReachable && onTravel ? () => onTravel(id) : undefined}
                  style={isReachable && onTravel ? { cursor: 'pointer' } : undefined}
                />
              </g>
              <text
                x={pos.x + label.dx}
                y={pos.y + label.dy}
                textAnchor={label.anchor as 'start' | 'middle' | 'end'}
                className={
                  'chart-label' +
                  (isCurrent ? ' chart-label-current' : '') +
                  (!isCurrent && !isReachable ? ' chart-label-dim' : '')
                }
              >
                {towns[id].name}
              </text>
            </g>
          );
        })}

        {/* Player dot (traveling) */}
        {travelState && (() => {
          const from = CHART_POS[travelState.fromTownId];
          const to = CHART_POS[travelState.toTownId];
          const t = travelState.ticksElapsed / travelState.ticksTotal;
          const cx = from.x + (to.x - from.x) * t;
          const cy = from.y + (to.y - from.y) * t;
          return (
            <g filter="url(#ink-rough)">
              <circle cx={cx} cy={cy} r={3.5} className="chart-player" />
            </g>
          );
        })()}
        {/* Clock — scales with map like compass */}
        <g transform="translate(392, 38) scale(0.99)">
          {children}
        </g>

      </svg>
    </div>
  );
}
