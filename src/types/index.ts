export type GoodId = 'food' | 'ore' | 'textiles' | 'tools' | 'spices' | 'luxury';

export type TownId = 'port-hollow' | 'ironkeep' | 'silkmere' | 'goldcrest' | 'dustwatch';

export interface GoodDef {
  id: GoodId;
  name: string;
  basePrice: number;
  weight: number; // cargo units per item
}

export interface MarketEntry {
  supply: number;
  demand: number;
  production: number; // per tick
  consumption: number; // per tick
  currentPrice: number;
}

export interface Town {
  id: TownId;
  name: string;
  position: { x: number; y: number }; // canvas coords
  market: Record<GoodId, MarketEntry>;
}

export interface InventoryItem {
  goodId: GoodId;
  quantity: number;
  avgPurchasePrice: number;
}

export interface TravelState {
  fromTownId: TownId;
  toTownId: TownId;
  ticksTotal: number;
  ticksElapsed: number;
}

export interface Player {
  gold: number;
  currentTownId: TownId | null; // null when traveling
  inventory: InventoryItem[];
  cargoCapacity: number;
  travelState: TravelState | null;
}

export interface Route {
  from: TownId;
  to: TownId;
  distance: number; // in ticks
}

export interface LogEntry {
  tick: number;
  message: string;
}

export type GameSpeed = 1 | 2 | 5;

export interface GameState {
  tick: number;
  isPaused: boolean;
  speed: GameSpeed;
  towns: Record<TownId, Town>;
  routes: Route[];
  player: Player;
  log: LogEntry[];
}
