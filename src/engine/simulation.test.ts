import { describe, it, expect } from 'vitest';
import { tickSimulation } from './simulation';
import { createInitialState } from '@/data/world';
import { GOODS } from '@/data/goods';
import type { GoodId } from '@/types';

const basePrices = Object.fromEntries(
  Object.entries(GOODS).map(([id, g]) => [id, g.basePrice])
) as Record<GoodId, number>;

describe('tickSimulation', () => {
  it('advances tick counter', () => {
    const state = createInitialState();
    const next = tickSimulation(state, basePrices);
    expect(next.tick).toBe(1);
  });

  it('updates supply based on production/consumption', () => {
    const state = createInitialState();
    const portHollow = state.towns['port-hollow'];
    const foodBefore = portHollow.market.food.supply;
    const prod = portHollow.market.food.production;
    const cons = portHollow.market.food.consumption;

    const next = tickSimulation(state, basePrices);
    const foodAfter = next.towns['port-hollow'].market.food.supply;
    expect(foodAfter).toBe(foodBefore + prod - cons);
  });

  it('advances travel when player is traveling', () => {
    const state = createInitialState();
    // Manually set travel state
    state.player.currentTownId = null;
    state.player.travelState = {
      fromTownId: 'port-hollow',
      toTownId: 'dustwatch',
      ticksTotal: 2,
      ticksElapsed: 0,
    };

    const next = tickSimulation(state, basePrices);
    expect(next.player.travelState?.ticksElapsed).toBe(1);

    const next2 = tickSimulation(next, basePrices);
    expect(next2.player.currentTownId).toBe('dustwatch');
    expect(next2.player.travelState).toBeNull();
  });

  it('economy reaches some equilibrium after 100 ticks', () => {
    let state = createInitialState();
    for (let i = 0; i < 100; i++) {
      state = tickSimulation(state, basePrices);
    }
    expect(state.tick).toBe(100);
    // Prices should still be within bounds
    for (const town of Object.values(state.towns)) {
      for (const [goodId, entry] of Object.entries(town.market)) {
        const base = basePrices[goodId as GoodId];
        expect(entry.currentPrice).toBeGreaterThanOrEqual(base * 0.2);
        expect(entry.currentPrice).toBeLessThanOrEqual(base * 5);
      }
    }
  });
});
