import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, GoodId, TownId, GameSpeed } from '@/types';
import { createInitialState } from '@/data/world';
import { GOODS } from '@/data/goods';
import { tickSimulation } from '@/engine/simulation';
import { buyGood, sellGood } from '@/engine/trade';
import { startTravel } from '@/engine/travel';

const basePrices = Object.fromEntries(
  Object.entries(GOODS).map(([id, g]) => [id, g.basePrice])
) as Record<GoodId, number>;


interface GameActions {
  doTick: () => void;
  togglePause: () => void;
  setSpeed: (speed: GameSpeed) => void;
  buy: (goodId: GoodId, quantity: number) => void;
  sell: (goodId: GoodId, quantity: number) => void;
  travel: (toTownId: TownId) => void;
  addLog: (message: string) => void;
  reset: () => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...createInitialState(),

    doTick: () => {
      set(state => {
        const wasTraveling = state.player.travelState !== null;
        const newState = tickSimulation(state, basePrices);
        state.tick = newState.tick;
        state.towns = newState.towns;
        state.player = newState.player;
        state.log = newState.log;
        if (wasTraveling && !newState.player.travelState) {
          state.isPaused = true;
        }
      });
    },

    togglePause: () => {
      set(state => { state.isPaused = !state.isPaused; });
    },

    setSpeed: (speed: GameSpeed) => {
      set(state => { state.speed = speed; });
    },

    buy: (goodId: GoodId, quantity: number) => {
      const state = get();
      if (!state.player.currentTownId) return;
      const town = state.towns[state.player.currentTownId];
      const result = buyGood(state.player, town, goodId, quantity);
      if ('error' in result) {
        set(s => { s.log.push({ tick: s.tick, message: `Buy failed: ${result.error}` }); });
        return;
      }
      set(s => {
        s.player = result.player;
        s.towns[town.id] = result.town;
        s.log.push({ tick: s.tick, message: `Bought ${quantity} ${GOODS[goodId].name} for ${result.totalCost}g` });
      });
    },

    sell: (goodId: GoodId, quantity: number) => {
      const state = get();
      if (!state.player.currentTownId) return;
      const town = state.towns[state.player.currentTownId];
      const result = sellGood(state.player, town, goodId, quantity);
      if ('error' in result) {
        set(s => { s.log.push({ tick: s.tick, message: `Sell failed: ${result.error}` }); });
        return;
      }
      set(s => {
        s.player = result.player;
        s.towns[town.id] = result.town;
        s.log.push({ tick: s.tick, message: `Sold ${quantity} ${GOODS[goodId].name} for ${result.totalCost}g` });
      });
    },

    travel: (toTownId: TownId) => {
      const state = get();
      const result = startTravel(state.player, state.routes, toTownId);
      if ('error' in result) {
        set(s => { s.log.push({ tick: s.tick, message: `Travel failed: ${result.error}` }); });
        return;
      }
      set(s => {
        s.player = result;
        s.isPaused = false;
        const townName = s.towns[toTownId].name;
        s.log.push({ tick: s.tick, message: `Departed for ${townName}` });
      });
    },

    addLog: (message: string) => {
      set(state => { state.log.push({ tick: state.tick, message }); });
    },

    reset: () => {
      set(() => createInitialState());
    },
  }))
);
