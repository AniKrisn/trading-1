import type { TownId, Town, Route, TravelState } from '@/types';

interface WorldMapProps {
  towns: Record<TownId, Town>;
  routes: Route[];
  currentTownId: TownId | null;
  travelState: TravelState | null;
  reachable: { townId: TownId; distance: number }[];
  onTravel: (townId: TownId) => void;
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
  'ironkeep':     { x: 306, y: 92  },
  'goldcrest':    { x: 360, y: 196 },
};

const LABEL_OFFSET: Record<TownId, { dx: number; dy: number; anchor: string }> = {
  'dustwatch':    { dx: 0,   dy: -12, anchor: 'middle' },
  'port-hollow':  { dx: -12, dy: 4,   anchor: 'end' },
  'silkmere':     { dx: 0,   dy: -12, anchor: 'middle' },
  'ironkeep':     { dx: 0,   dy: -12, anchor: 'middle' },
  'goldcrest':    { dx: -12, dy: 4,   anchor: 'end' },
};

// --- Archipelago islands ---

// Dustwatch — small, remote island (upper-left)
const ISLAND_DUSTWATCH =
  'M 44 72' +
  ' C 48 60, 62 56, 76 60' +
  ' C 84 62, 88 70, 84 78' +
  ' C 82 82, 76 82, 74 80' +
  ' C 70 82, 64 88, 56 92' +
  ' C 46 96, 36 86, 36 78' +
  ' C 36 74, 40 72, 44 72 Z';

// Port Hollow — mid-sized coastal island with harbor bay (center-left)
const ISLAND_PORT_HOLLOW =
  'M 80 178' +
  ' C 86 168, 96 160, 110 158' +
  ' C 122 156, 134 160, 142 168' +
  ' C 150 176, 152 186, 148 196' +
  ' C 144 204, 136 210, 126 214' +
  ' C 116 218, 104 216, 94 210' +
  // Harbor indent on the west side
  ' C 88 206, 82 200, 80 196' +
  ' C 76 192, 74 186, 80 178 Z';

// Silkmere — elongated island with ruins feel (center-top)
const ISLAND_SILKMERE =
  'M 172 58' +
  ' C 178 46, 192 40, 208 42' +
  ' C 220 44, 232 50, 238 58' +
  ' C 244 66, 240 76, 232 82' +
  ' C 224 88, 212 88, 200 84' +
  ' C 190 80, 180 72, 174 66' +
  ' C 170 62, 170 60, 172 58 Z';

// Ironkeep — rugged island with fjord indent (right)
const ISLAND_IRONKEEP =
  'M 274 82' +
  ' C 280 72, 294 66, 308 68' +
  ' C 320 70, 330 76, 334 86' +
  ' C 338 96, 336 108, 328 116' +
  ' C 320 124, 308 128, 296 126' +
  // Fjord indent on the south side
  ' C 290 124, 296 116, 300 108' +
  ' C 302 102, 298 98, 292 100' +
  ' C 286 102, 280 106, 276 110' +
  ' C 270 106, 268 96, 274 82 Z';

// Goldcrest — sheltered island with bay (lower-right)
const ISLAND_GOLDCREST =
  'M 332 182' +
  ' C 338 172, 350 166, 364 168' +
  ' C 376 170, 386 178, 388 190' +
  ' C 390 200, 386 210, 378 218' +
  ' C 370 224, 358 226, 348 222' +
  ' C 340 218, 334 210, 332 200' +
  ' C 330 194, 330 188, 332 182 Z';

// Small rocky islets for atmosphere
const ISLETS = [
  'M 30 128 C 34 124, 40 124, 42 128 C 44 132, 38 136, 32 134 C 28 132, 28 130, 30 128 Z',
  'M 148 130 C 152 126, 158 126, 160 130 C 162 134, 156 138, 150 136 C 146 134, 146 132, 148 130 Z',
  'M 252 140 C 255 136, 262 136, 264 140 C 266 144, 260 148, 254 146 C 250 144, 250 142, 252 140 Z',
  'M 118 108 C 120 104, 126 104, 128 108 C 130 112, 126 114, 120 112 C 116 110, 116 108, 118 108 Z',
];

const ALL_ISLANDS = [
  ISLAND_DUSTWATCH,
  ISLAND_PORT_HOLLOW,
  ISLAND_SILKMERE,
  ISLAND_IRONKEEP,
  ISLAND_GOLDCREST,
  ...ISLETS,
];

// Depth soundings — clustered along channels, denser near shores
const DEPTHS = [
  // Cluster near Dustwatch approach
  { x: 18,  y: 108, v: 7 },
  { x: 28,  y: 120, v: 9 },
  { x: 12,  y: 130, v: 11 },
  // Channel: Dustwatch — Silkmere
  { x: 108, y: 42,  v: 14 },
  { x: 122, y: 48,  v: 16 },
  { x: 138, y: 44,  v: 18 },
  // Near Port Hollow harbor
  { x: 58,  y: 178, v: 4 },
  { x: 64,  y: 168, v: 6 },
  { x: 54,  y: 156, v: 5 },
  // Channel: Port Hollow — Silkmere
  { x: 152, y: 118, v: 12 },
  { x: 160, y: 126, v: 14 },
  { x: 168, y: 112, v: 15 },
  // Near Ironkeep
  { x: 252, y: 72,  v: 8 },
  { x: 248, y: 84,  v: 10 },
  // Channel: Ironkeep — Goldcrest
  { x: 332, y: 130, v: 11 },
  { x: 340, y: 140, v: 9 },
  { x: 348, y: 148, v: 7 },
];

const TOWN_IDS = Object.keys(CHART_POS) as TownId[];

export function WorldMap({
  towns,
  routes,
  currentTownId,
  travelState,
  reachable,
  onTravel,
}: WorldMapProps) {
  return (
    <div className="chart">
      <svg viewBox="0 0 400 236" className="chart-svg">
        {/* Islands — fill + stroke */}
        {ALL_ISLANDS.map((d, i) => (
          <path key={`land-${i}`} className="chart-land" d={d} />
        ))}
        {ALL_ISLANDS.map((d, i) => (
          <path key={`coast-${i}`} className="chart-coast" d={d} />
        ))}

        {/* Depth soundings */}
        {DEPTHS.map((d, i) => (
          <text key={i} className="chart-depth" x={d.x} y={d.y}>
            {d.v}
          </text>
        ))}

        {/* Compass rose */}
        <g className="chart-compass" transform="translate(380, 210)">
          <line x1="0" y1="-10" x2="0" y2="10" />
          <line x1="-10" y1="0" x2="10" y2="0" />
          <circle r="1.5" />
          <text x="0" y="-14" textAnchor="middle">N</text>
        </g>

        {/* Trade routes (dashed) */}
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

        {/* Town markers + labels */}
        {TOWN_IDS.map(id => {
          const pos = CHART_POS[id];
          const label = LABEL_OFFSET[id];
          const isCurrent = currentTownId === id;
          const isReachable = reachable.some(r => r.townId === id);
          const dest = reachable.find(r => r.townId === id);

          return (
            <g key={id}>
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
                onClick={isReachable ? () => onTravel(id) : undefined}
                style={isReachable ? { cursor: 'pointer' } : undefined}
              />
              <text
                x={pos.x + label.dx}
                y={pos.y + label.dy}
                textAnchor={label.anchor}
                className={
                  'chart-label' +
                  (isCurrent ? ' chart-label-current' : '') +
                  (!isCurrent && !isReachable ? ' chart-label-dim' : '')
                }
              >
                {towns[id].name}
                {dest && <tspan className="chart-label-dist"> {dest.distance}t</tspan>}
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
          return <circle cx={cx} cy={cy} r={3.5} className="chart-player" />;
        })()}
      </svg>
    </div>
  );
}
