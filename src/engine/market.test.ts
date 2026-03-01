import { describe, it, expect } from 'vitest';
import { calculatePrice, getBuyPrice, getSellPrice } from './market';
import type { MarketEntry } from '@/types';

describe('calculatePrice', () => {
  it('returns base price when supply equals demand', () => {
    const price = calculatePrice(100, 50, 50);
    expect(price).toBe(100);
  });

  it('returns lower price when supply exceeds demand', () => {
    const price = calculatePrice(100, 200, 50);
    expect(price).toBeLessThan(100);
  });

  it('returns higher price when demand exceeds supply', () => {
    const price = calculatePrice(100, 10, 50);
    expect(price).toBeGreaterThan(100);
  });

  it('clamps to floor (basePrice * 0.2)', () => {
    const price = calculatePrice(100, 10000, 1);
    expect(price).toBeGreaterThanOrEqual(20);
  });

  it('clamps to ceiling (basePrice * 5)', () => {
    const price = calculatePrice(100, 1, 10000);
    expect(price).toBeLessThanOrEqual(500);
  });

  it('handles zero demand gracefully', () => {
    const price = calculatePrice(100, 50, 0);
    expect(price).toBeGreaterThan(0);
  });
});

describe('getBuyPrice / getSellPrice', () => {
  const entry: MarketEntry = {
    supply: 50,
    demand: 50,
    production: 5,
    consumption: 5,
    currentPrice: 100,
  };

  it('buy price is higher than current price (5% markup)', () => {
    expect(getBuyPrice(entry)).toBe(105);
  });

  it('sell price is lower than current price (5% discount)', () => {
    expect(getSellPrice(entry)).toBe(95);
  });

  it('buy price is always >= sell price (spread)', () => {
    expect(getBuyPrice(entry)).toBeGreaterThan(getSellPrice(entry));
  });
});
