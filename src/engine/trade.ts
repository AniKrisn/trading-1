import type { Player, Town, GoodId, InventoryItem } from '@/types';
import { getBuyPrice, getSellPrice } from './market';

export interface TradeResult {
  player: Player;
  town: Town;
  totalCost: number;
}


/** Buy a quantity of a good from a town's market */
export function buyGood(
  player: Player,
  town: Town,
  goodId: GoodId,
  quantity: number,
): TradeResult | { error: string } {
  const entry = town.market[goodId];
  const unitPrice = getBuyPrice(entry);
  const totalCost = unitPrice * quantity;

  if (quantity <= 0) return { error: 'Invalid quantity' };
  if (quantity > entry.supply) return { error: 'Not enough supply' };
  if (totalCost > player.gold) return { error: 'Not enough obols' };

  // Update player inventory
  const newInventory = [...player.inventory];
  const existing = newInventory.find(i => i.goodId === goodId);
  if (existing) {
    const newQty = existing.quantity + quantity;
    const newAvg = (existing.avgPurchasePrice * existing.quantity + unitPrice * quantity) / newQty;
    newInventory[newInventory.indexOf(existing)] = {
      ...existing,
      quantity: newQty,
      avgPurchasePrice: Math.round(newAvg * 100) / 100,
    };
  } else {
    newInventory.push({ goodId, quantity, avgPurchasePrice: unitPrice });
  }

  return {
    player: { ...player, gold: player.gold - totalCost, inventory: newInventory },
    town: {
      ...town,
      market: {
        ...town.market,
        [goodId]: { ...entry, supply: entry.supply - quantity },
      },
    },
    totalCost,
  };
}

/** Sell a quantity of a good to a town's market */
export function sellGood(
  player: Player,
  town: Town,
  goodId: GoodId,
  quantity: number,
): TradeResult | { error: string } {
  const entry = town.market[goodId];
  const unitPrice = getSellPrice(entry);
  const totalCost = unitPrice * quantity;

  if (quantity <= 0) return { error: 'Invalid quantity' };

  const existing = player.inventory.find(i => i.goodId === goodId);
  if (!existing || existing.quantity < quantity) return { error: 'Not enough in inventory' };

  const newInventory = player.inventory
    .map(i => i.goodId === goodId ? { ...i, quantity: i.quantity - quantity } : i)
    .filter(i => i.quantity > 0);

  return {
    player: { ...player, gold: player.gold + totalCost, inventory: newInventory },
    town: {
      ...town,
      market: {
        ...town.market,
        [goodId]: { ...entry, supply: entry.supply + quantity },
      },
    },
    totalCost,
  };
}
