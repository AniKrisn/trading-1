import type { GameState, GoodId, TownId } from '@/types';
import { tickTownProduction } from './production';
import { updateTownPrices } from './market';
import { advanceTravel } from './travel';

/**
 * Advance the entire simulation by one tick.
 * basePrices is passed as a parameter to keep the engine pure (no data imports).
 */
export function tickSimulation(state: GameState, basePrices: Record<GoodId, number>): GameState {
  let newTowns = { ...state.towns };

  // 1. Production & consumption for all towns
  for (const townId of Object.keys(newTowns) as TownId[]) {
    newTowns[townId] = tickTownProduction(newTowns[townId]);
  }

  // 2. Update prices
  for (const townId of Object.keys(newTowns) as TownId[]) {
    newTowns[townId] = updateTownPrices(newTowns[townId], basePrices);
  }

  // 3. Advance player travel
  const newPlayer = advanceTravel(state.player);

  // 4. Check for arrival log
  const newLog = [...state.log];
  if (state.player.travelState && !newPlayer.travelState && newPlayer.currentTownId) {
    newLog.push({
      tick: state.tick + 1,
      message: `Arrived at ${state.towns[newPlayer.currentTownId].name}`,
    });
  }

  return {
    ...state,
    tick: state.tick + 1,
    towns: newTowns,
    player: newPlayer,
    log: newLog,
  };
}
