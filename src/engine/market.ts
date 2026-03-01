import type { MarketEntry, Town, GoodId } from '@/types';

/**
 * Price formula: basePrice / (supplyRatio ^ 0.5)
 * supplyRatio = supply / demand (clamped to [0.1, 10])
 * Final price clamped to [basePrice * 0.2, basePrice * 5]
 */
export function calculatePrice(basePrice: number, supply: number, demand: number): number {
  const ratio = Math.max(0.1, Math.min(10, supply / Math.max(1, demand)));
  const price = basePrice / Math.sqrt(ratio);
  return Math.round(Math.max(basePrice * 0.2, Math.min(basePrice * 5, price)) * 100) / 100;
}

/** Buy price = currentPrice * 1.05 (5% markup) */
export function getBuyPrice(entry: MarketEntry): number {
  return Math.ceil(entry.currentPrice * 1.05);
}

/** Sell price = currentPrice * 0.95 (5% discount) */
export function getSellPrice(entry: MarketEntry): number {
  return Math.floor(entry.currentPrice * 0.95);
}

/** Recalculate all prices in a town's market */
export function updateTownPrices(town: Town, basePrices: Record<GoodId, number>): Town {
  const newMarket = { ...town.market };
  for (const goodId of Object.keys(newMarket) as GoodId[]) {
    const entry = newMarket[goodId];
    newMarket[goodId] = {
      ...entry,
      currentPrice: calculatePrice(basePrices[goodId], entry.supply, entry.demand),
    };
  }
  return { ...town, market: newMarket };
}
