import type { GameStore } from './gameStore';
import type { GoodId, TownId } from '@/types';
import { GOODS, GOOD_IDS } from '@/data/goods';
import { getBuyPrice, getSellPrice } from '@/engine/market';
import { getCargoUsed, getCargoFree } from '@/engine/trade';
import { findRoute } from '@/engine/travel';

const weights: Record<GoodId, number> = Object.fromEntries(
  Object.entries(GOODS).map(([id, g]) => [id, g.weight])
) as Record<GoodId, number>;

export const selectCurrentTown = (state: GameStore) =>
  state.player.currentTownId ? state.towns[state.player.currentTownId] : null;

export const selectCargoUsed = (state: GameStore) =>
  getCargoUsed(state.player.inventory, weights);

export const selectCargoFree = (state: GameStore) =>
  getCargoFree(state.player, weights);

export interface MarketRow {
  goodId: GoodId;
  name: string;
  supply: number;
  buyPrice: number;
  sellPrice: number;
  playerQty: number;
  avgPurchasePrice: number;
  maxAffordable: number;
  maxFittable: number;
}

export const selectMarketRows = (state: GameStore): MarketRow[] => {
  const town = selectCurrentTown(state);
  if (!town) return [];

  return GOOD_IDS.map(goodId => {
    const entry = town.market[goodId];
    const buyPrice = getBuyPrice(entry);
    const sellPrice = getSellPrice(entry);
    const inv = state.player.inventory.find(i => i.goodId === goodId);
    const freeSpace = getCargoFree(state.player, weights);

    return {
      goodId,
      name: GOODS[goodId].name,
      supply: entry.supply,
      buyPrice,
      sellPrice,
      playerQty: inv?.quantity ?? 0,
      avgPurchasePrice: inv?.avgPurchasePrice ?? 0,
      maxAffordable: Math.floor(state.player.gold / buyPrice),
      maxFittable: Math.floor(freeSpace / GOODS[goodId].weight),
    };
  });
};

export const selectReachableTowns = (state: GameStore): TownId[] => {
  if (!state.player.currentTownId) return [];
  return state.routes
    .filter(r => r.from === state.player.currentTownId || r.to === state.player.currentTownId)
    .map(r => r.from === state.player.currentTownId ? r.to : r.from);
};

export const selectRouteDistance = (state: GameStore, toTownId: TownId): number | null => {
  if (!state.player.currentTownId) return null;
  const route = findRoute(state.routes, state.player.currentTownId, toTownId);
  return route?.distance ?? null;
};
