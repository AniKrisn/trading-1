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
          {/* Clip shadow to bottom-right only */}
          <clipPath id="shadow-clip">
            <rect x="-30" y="130" width="470" height="140" />
            <rect x="200" y="0" width="240" height="270" />
          </clipPath>
        </defs>

        {/* Map background fill — sea color inside rough border */}
        <path d={MAP_BORDER} className="chart-bg" />

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

        {/* Islands — fill + stroke */}
        {allIslands.map((d, i) => (
          <path key={`land-${i}`} className="chart-land" d={d} />
        ))}
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
        <g transform="translate(392, 38) scale(0.9)">
          {children}
        </g>
      </svg>
    </div>
  );
}
