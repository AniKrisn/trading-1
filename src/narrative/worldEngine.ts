import type { TownId } from '../types/index';
import type {
  WorldState,
  CharacterDef,
  CharacterState,
  TownNarrativeState,
  DevelopmentResult,
  Seed,
} from '../types/narrative';
import { MAX_SEEDS, MAX_FACTS, DEVELOPMENT_CYCLE_INTERVAL } from '../types/narrative';

/* ------------------------------------------------------------------ */
/*  Town IDs (used for initial state construction)                     */
/* ------------------------------------------------------------------ */

const ALL_TOWN_IDS: TownId[] = [
  'port-hollow',
  'ironkeep',
  'silkmere',
  'goldcrest',
  'dustwatch',
];

/* ------------------------------------------------------------------ */
/*  createInitialWorldState                                            */
/* ------------------------------------------------------------------ */

export function createInitialWorldState(characters: CharacterDef[]): WorldState {
  const characterStates: Record<string, CharacterState> = {};
  for (const def of characters) {
    characterStates[def.id] = {
      id: def.id,
      disposition: def.initialDisposition,
      lastInteractionTick: null,
      memories: [],
    };
  }

  const towns: Record<TownId, TownNarrativeState> = {} as Record<TownId, TownNarrativeState>;
  for (const townId of ALL_TOWN_IDS) {
    towns[townId] = {
      townId,
      atmosphere: '',
      rumors: [],
      recentEvents: [],
    };
  }

  return {
    characters: characterStates,
    seeds: [],
    facts: [],
    playerMemories: [],
    towns,
    discoveredObjects: [],
    activity: {
      townVisits: [],
      trades: [],
      dialogues: [],
    },
    dialogue: null,
    lastDevelopmentTick: 0,
    developmentCycleCount: 0,
  };
}

/* ------------------------------------------------------------------ */
/*  applyDevelopmentResult                                              */
/* ------------------------------------------------------------------ */

export function applyDevelopmentResult(
  state: WorldState,
  result: DevelopmentResult,
  tick: number,
): WorldState {
  let next: WorldState = { ...state };

  // --- Update town atmospheres ---
  if (result.updatedAtmospheres) {
    const towns = { ...next.towns };
    for (const { townId, atmosphere } of result.updatedAtmospheres) {
      if (towns[townId]) {
        towns[townId] = { ...towns[townId], atmosphere };
      }
    }
    next = { ...next, towns };
  }

  // --- Add rumors (keep last 3 per town) ---
  if (result.newRumors) {
    const towns = { ...next.towns };
    for (const { townId, rumor } of result.newRumors) {
      if (towns[townId]) {
        const existing = [...towns[townId].rumors, rumor];
        towns[townId] = {
          ...towns[townId],
          rumors: existing.slice(-3),
        };
      }
    }
    next = { ...next, towns };
  }

  // --- Add events (keep last 5 per town) ---
  if (result.newEvents) {
    const towns = { ...next.towns };
    for (const { townId, event } of result.newEvents) {
      if (towns[townId]) {
        const existing = [...towns[townId].recentEvents, event];
        towns[townId] = {
          ...towns[townId],
          recentEvents: existing.slice(-5),
        };
      }
    }
    next = { ...next, towns };
  }

  // --- Add new seeds (with tickCreated) ---
  if (result.newSeeds) {
    const newSeeds: Seed[] = result.newSeeds.map((s) => ({
      ...s,
      tickCreated: tick,
    }));
    next = { ...next, seeds: [...next.seeds, ...newSeeds] };
  }

  // --- Resolve seeds by id ---
  if (result.resolvedSeedIds && result.resolvedSeedIds.length > 0) {
    const resolvedSet = new Set(result.resolvedSeedIds);
    next = {
      ...next,
      seeds: next.seeds.map((s) =>
        resolvedSet.has(s.id) ? { ...s, status: 'resolved' as const } : s,
      ),
    };
  }

  // --- Update character dispositions & memories ---
  if (result.characterUpdates) {
    const characters = { ...next.characters };
    for (const update of result.characterUpdates) {
      const existing = characters[update.characterId];
      if (existing) {
        characters[update.characterId] = {
          ...existing,
          disposition:
            update.disposition !== undefined
              ? update.disposition
              : existing.disposition,
          memories:
            update.memory !== undefined
              ? [...existing.memories, update.memory]
              : existing.memories,
        };
      }
    }
    next = { ...next, characters };
  }

  // --- Add facts ---
  if (result.newFacts) {
    next = { ...next, facts: [...next.facts, ...result.newFacts] };
  }

  return next;
}

/* ------------------------------------------------------------------ */
/*  shouldRunCycle                                                      */
/* ------------------------------------------------------------------ */

export function shouldRunCycle(state: WorldState, tick: number): boolean {
  return tick - state.lastDevelopmentTick >= DEVELOPMENT_CYCLE_INTERVAL;
}

/* ------------------------------------------------------------------ */
/*  sanitizeWorldState                                                 */
/* ------------------------------------------------------------------ */

export function sanitizeWorldState(state: WorldState): WorldState {
  // Trim seeds to MAX_SEEDS — keep most recent active ones
  let seeds = [...state.seeds];
  const activeSeeds = seeds
    .filter((s) => s.status === 'active')
    .sort((a, b) => b.tickCreated - a.tickCreated)
    .slice(0, MAX_SEEDS);
  const nonActiveSeeds = seeds.filter((s) => s.status !== 'active');
  seeds = [...activeSeeds, ...nonActiveSeeds];

  // Trim facts to MAX_FACTS — keep most recent
  const facts = state.facts.slice(-MAX_FACTS);

  // Trim playerMemories to 20 — keep most recent
  const playerMemories = state.playerMemories.slice(-20);

  return {
    ...state,
    seeds,
    facts,
    playerMemories,
  };
}

/* ------------------------------------------------------------------ */
/*  recordPlayerAction                                                 */
/* ------------------------------------------------------------------ */

type PlayerAction =
  | { type: 'visit'; townId: TownId; tick: number }
  | { type: 'trade'; townId: TownId; goodId: string; action: 'buy' | 'sell'; tick: number }
  | { type: 'dialogue'; characterId: string; tick: number };

export function recordPlayerAction(
  state: WorldState,
  action: PlayerAction,
): WorldState {
  const activity = { ...state.activity };

  switch (action.type) {
    case 'visit': {
      const townVisits = [
        ...activity.townVisits,
        { townId: action.townId, tick: action.tick },
      ].slice(-10);
      return { ...state, activity: { ...activity, townVisits } };
    }
    case 'trade': {
      const trades = [
        ...activity.trades,
        {
          townId: action.townId,
          goodId: action.goodId,
          action: action.action,
          tick: action.tick,
        },
      ].slice(-10);
      return { ...state, activity: { ...activity, trades } };
    }
    case 'dialogue': {
      const dialogues = [
        ...activity.dialogues,
        { characterId: action.characterId, tick: action.tick },
      ].slice(-10);
      return { ...state, activity: { ...activity, dialogues } };
    }
  }
}

/* ------------------------------------------------------------------ */
/*  maybeDiscoverObject                                                */
/* ------------------------------------------------------------------ */

export function maybeDiscoverObject(
  discoveredIds: string[],
  objectDefs: { id: string; acquireChance: number }[],
  seed: number,
): string | null {
  const discoveredSet = new Set(discoveredIds);

  for (const def of objectDefs) {
    if (discoveredSet.has(def.id)) continue;
    if (seed % 100 < def.acquireChance * 100) {
      return def.id;
    }
  }

  return null;
}
