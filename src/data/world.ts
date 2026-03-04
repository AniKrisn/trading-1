import type { GameState, GoodId, MarketEntry, Route, Town, TownId } from '@/types';
import { GOODS, GOOD_IDS } from './goods';

/* ------------------------------------------------------------------ */
/*  Town configuration                                                 */
/* ------------------------------------------------------------------ */

interface TownConfig {
  id: TownId;
  name: string;
  position: { x: number; y: number };
  production: Partial<Record<GoodId, number>>;
  consumption: Partial<Record<GoodId, number>>;
}

export const TOWNS_CONFIG: TownConfig[] = [
  {
    id: 'port-hollow',
    name: 'Port Hollow',
    position: { x: 200, y: 400 },
    production: { food: 8, textiles: 3 },
    consumption: { ore: 3, tools: 2, spices: 2, luxury: 1 },
  },
  {
    id: 'ironkeep',
    name: 'Ironkeep',
    position: { x: 600, y: 200 },
    production: { ore: 8, tools: 4 },
    consumption: { food: 4, textiles: 2, spices: 1, luxury: 1 },
  },
  {
    id: 'silkmere',
    name: 'Silkmere',
    position: { x: 400, y: 100 },
    production: { textiles: 7, spices: 3 },
    consumption: { food: 3, ore: 2, tools: 2, luxury: 1 },
  },
  {
    id: 'goldcrest',
    name: 'Goldcrest',
    position: { x: 700, y: 450 },
    production: { luxury: 5, spices: 3 },
    consumption: { food: 4, ore: 3, textiles: 3, tools: 3 },
  },
  {
    id: 'dustwatch',
    name: 'Dustwatch',
    position: { x: 100, y: 150 },
    production: { food: 3, ore: 3 },
    consumption: { textiles: 2, tools: 3, spices: 2, luxury: 2 },
  },
];

/* ------------------------------------------------------------------ */
/*  Routes (bidirectional)                                             */
/* ------------------------------------------------------------------ */

export const ROUTES: Route[] = [
  { from: 'port-hollow', to: 'dustwatch',  distance: 8  },
  { from: 'port-hollow', to: 'silkmere',   distance: 10 },
  { from: 'dustwatch',   to: 'ironkeep',   distance: 12 },
  { from: 'dustwatch',   to: 'silkmere',   distance: 10 },
  { from: 'silkmere',    to: 'ironkeep',   distance: 8  },
  { from: 'ironkeep',    to: 'goldcrest',  distance: 10 },
  { from: 'silkmere',    to: 'goldcrest',  distance: 12 },
];

/* ------------------------------------------------------------------ */
/*  Market helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Build an initial MarketEntry for a single good in a single town.
 *
 * Supply  = production * 10 for produced goods,
 *           consumption * 5 for consumed-only goods,
 *           minimum 5 in all cases.
 * Demand  = max(consumption * 10, 5).
 * Price   = basePrice / sqrt(supply / demand), clamped to [0.2x .. 5x] base.
 */
function createMarketEntry(
  goodId: GoodId,
  production: number,
  consumption: number,
): MarketEntry {
  const base = GOODS[goodId].basePrice;

  let supply: number;
  if (production > 0) {
    supply = production * 10;
  } else if (consumption > 0) {
    supply = consumption * 5;
  } else {
    supply = 5;
  }
  supply = Math.max(supply, 5);

  const demand = Math.max(consumption * 10, 5);

  const rawPrice = base / Math.sqrt(supply / demand);
  const minPrice = base * 0.2;
  const maxPrice = base * 5;
  const currentPrice = Math.round(Math.min(maxPrice, Math.max(minPrice, rawPrice)) * 100) / 100;

  return { supply, demand, production, consumption, currentPrice };
}

/* ------------------------------------------------------------------ */
/*  Build a Town from its config                                       */
/* ------------------------------------------------------------------ */

function buildTown(cfg: TownConfig): Town {
  const market = {} as Record<GoodId, MarketEntry>;

  for (const goodId of GOOD_IDS) {
    const prod = cfg.production[goodId] ?? 0;
    const cons = cfg.consumption[goodId] ?? 0;
    market[goodId] = createMarketEntry(goodId, prod, cons);
  }

  return {
    id: cfg.id,
    name: cfg.name,
    position: cfg.position,
    market,
  };
}

/* ------------------------------------------------------------------ */
/*  createInitialState                                                 */
/* ------------------------------------------------------------------ */

export function createInitialState(): GameState {
  const towns = {} as Record<TownId, Town>;
  for (const cfg of TOWNS_CONFIG) {
    towns[cfg.id] = buildTown(cfg);
  }

  return {
    tick: 0,
    isPaused: true,
    speed: 1,
    towns,
    routes: ROUTES,
    player: {
      gold: 500,
      currentTownId: 'port-hollow',
      inventory: [],
      cargoCapacity: 50,
      travelState: null,
    },
    log: [],
  };
}
