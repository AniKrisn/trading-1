import type { Town, GoodId } from '@/types';

/** Each tick: supply += production - consumption (min 0) */
export function tickTownProduction(town: Town): Town {
  const newMarket = { ...town.market };
  for (const goodId of Object.keys(newMarket) as GoodId[]) {
    const entry = newMarket[goodId];
    const newSupply = Math.max(0, entry.supply + entry.production - entry.consumption);
    newMarket[goodId] = { ...entry, supply: newSupply };
  }
  return { ...town, market: newMarket };
}
