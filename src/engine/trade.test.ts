import { describe, it, expect } from 'vitest';
import { buyGood, sellGood, getCargoUsed } from './trade';
import type { Player, Town, GoodId, MarketEntry } from '@/types';

const weights: Record<GoodId, number> = {
  food: 2, ore: 5, textiles: 1, tools: 3, spices: 1, luxury: 2,
};

function makeMarket(overrides?: Partial<Record<GoodId, Partial<MarketEntry>>>): Record<GoodId, MarketEntry> {
  const defaults: MarketEntry = { supply: 50, demand: 50, production: 5, consumption: 5, currentPrice: 100 };
  const market = {} as Record<GoodId, MarketEntry>;
  for (const id of ['food', 'ore', 'textiles', 'tools', 'spices', 'luxury'] as GoodId[]) {
    market[id] = { ...defaults, ...(overrides?.[id] ?? {}) };
  }
  return market;
}

function makeTown(overrides?: Partial<Record<GoodId, Partial<MarketEntry>>>): Town {
  return {
    id: 'port-hollow',
    name: 'Port Hollow',
    position: { x: 0, y: 0 },
    market: makeMarket(overrides),
  };
}

function makePlayer(overrides?: Partial<Player>): Player {
  return {
    gold: 500,
    currentTownId: 'port-hollow',
    inventory: [],
    cargoCapacity: 50,
    travelState: null,
    ...overrides,
  };
}

describe('getCargoUsed', () => {
  it('returns 0 for empty inventory', () => {
    expect(getCargoUsed([], weights)).toBe(0);
  });

  it('sums weights correctly', () => {
    const inv = [
      { goodId: 'food' as GoodId, quantity: 5, avgPurchasePrice: 10 },
      { goodId: 'ore' as GoodId, quantity: 2, avgPurchasePrice: 20 },
    ];
    expect(getCargoUsed(inv, weights)).toBe(5 * 2 + 2 * 5); // 20
  });
});

describe('buyGood', () => {
  it('successfully buys goods', () => {
    const player = makePlayer();
    const town = makeTown({ food: { currentPrice: 10 } });
    const result = buyGood(player, town, 'food', 5, weights);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.player.inventory).toHaveLength(1);
      expect(result.player.inventory[0].quantity).toBe(5);
      expect(result.player.gold).toBeLessThan(500);
      expect(result.town.market.food.supply).toBe(45);
    }
  });

  it('rejects when not enough gold', () => {
    const player = makePlayer({ gold: 1 });
    const town = makeTown({ food: { currentPrice: 100 } });
    const result = buyGood(player, town, 'food', 5, weights);
    expect('error' in result).toBe(true);
  });

  it('rejects when not enough supply', () => {
    const player = makePlayer();
    const town = makeTown({ food: { supply: 2, currentPrice: 10 } });
    const result = buyGood(player, town, 'food', 5, weights);
    expect('error' in result).toBe(true);
  });

  it('rejects when not enough cargo space', () => {
    const player = makePlayer({ cargoCapacity: 1 });
    const town = makeTown({ food: { currentPrice: 1 } });
    const result = buyGood(player, town, 'food', 5, weights);
    expect('error' in result).toBe(true);
  });

  it('merges with existing inventory and updates avg price', () => {
    const player = makePlayer({
      inventory: [{ goodId: 'food', quantity: 5, avgPurchasePrice: 10 }],
    });
    const town = makeTown({ food: { currentPrice: 20 } });
    const result = buyGood(player, town, 'food', 5, weights);
    if (!('error' in result)) {
      expect(result.player.inventory[0].quantity).toBe(10);
      expect(result.player.inventory[0].avgPurchasePrice).toBeGreaterThan(10);
    }
  });
});

describe('sellGood', () => {
  it('successfully sells goods', () => {
    const player = makePlayer({
      inventory: [{ goodId: 'food', quantity: 10, avgPurchasePrice: 10 }],
    });
    const town = makeTown({ food: { currentPrice: 20 } });
    const result = sellGood(player, town, 'food', 5);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.player.inventory[0].quantity).toBe(5);
      expect(result.player.gold).toBeGreaterThan(500);
      expect(result.town.market.food.supply).toBe(55);
    }
  });

  it('removes item from inventory when selling all', () => {
    const player = makePlayer({
      inventory: [{ goodId: 'food', quantity: 5, avgPurchasePrice: 10 }],
    });
    const town = makeTown();
    const result = sellGood(player, town, 'food', 5);
    if (!('error' in result)) {
      expect(result.player.inventory).toHaveLength(0);
    }
  });

  it('rejects when not enough in inventory', () => {
    const player = makePlayer();
    const result = sellGood(player, makeTown(), 'food', 5);
    expect('error' in result).toBe(true);
  });
});
