import type { GoodDef, GoodId } from '@/types';

export const GOODS: Record<GoodId, GoodDef> = {
  food:     { id: 'food',     name: 'Food',     basePrice: 10,  weight: 2 },
  ore:      { id: 'ore',      name: 'Ore',      basePrice: 20,  weight: 5 },
  textiles: { id: 'textiles', name: 'Textiles', basePrice: 25,  weight: 1 },
  tools:    { id: 'tools',    name: 'Tools',    basePrice: 40,  weight: 3 },
  spices:   { id: 'spices',   name: 'Spices',   basePrice: 50,  weight: 1 },
  luxury:   { id: 'luxury',   name: 'Luxury',   basePrice: 100, weight: 2 },
};

export const GOOD_IDS = Object.keys(GOODS) as GoodId[];
