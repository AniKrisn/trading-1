import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { WorldState, DevelopmentResult, Seed, DialogueTurn } from '@/types/narrative';
import type { TownId } from '@/types';
import { createInitialWorldState, applyDevelopmentResult, sanitizeWorldState, maybeDiscoverObject } from '@/narrative/worldEngine';
import { CHARACTERS } from '@/data/characters';
import { FOUND_OBJECTS } from '@/data/foundObjects';

interface WorldActions {
  applyDevelopment: (result: DevelopmentResult, tick: number) => void;
  addSeed: (seed: Seed) => void;
  resolveSeed: (seedId: string) => void;
  updateCharacter: (charId: string, updates: { disposition?: number; memory?: string }) => void;
  addPlayerMemory: (entry: string) => void;
  recordTownVisit: (townId: TownId, tick: number) => void;
  recordTrade: (townId: TownId, goodId: string, action: 'buy' | 'sell', tick: number) => void;
  startDialogue: (charId: string, tick: number) => void;
  addDialogueTurn: (turn: DialogueTurn) => void;
  endDialogue: () => void;
  discoverObject: (objectId: string) => void;
  checkForObject: (tick: number) => string | null;
  loadWorldState: (state: WorldState) => void;
  reset: () => void;
}

export type WorldStore = WorldState & WorldActions;

export const useWorldStore = create<WorldStore>()(
  immer((set, get) => ({
    ...createInitialWorldState(CHARACTERS),

    applyDevelopment: (result: DevelopmentResult, tick: number) => {
      set(state => {
        // Pass the draft to the pure function — immer drafts are transparent
        // for reads, so spread operations inside the pure function work fine.
        // The returned object is a plain new WorldState.
        const applied = applyDevelopmentResult(state as WorldState, result, tick);
        const sanitized = sanitizeWorldState(applied);

        // Write sanitized result back onto the draft
        state.characters = sanitized.characters;
        state.seeds = sanitized.seeds;
        state.facts = sanitized.facts;
        state.playerMemories = sanitized.playerMemories;
        state.towns = sanitized.towns;
        state.discoveredObjects = sanitized.discoveredObjects;
        state.activity = sanitized.activity;
        state.dialogue = sanitized.dialogue;
        state.lastDevelopmentTick = tick;
        state.developmentCycleCount += 1;
      });
    },

    addSeed: (seed: Seed) => {
      set(state => {
        state.seeds.push(seed);
      });
    },

    resolveSeed: (seedId: string) => {
      set(state => {
        const seed = state.seeds.find(s => s.id === seedId);
        if (seed) seed.status = 'resolved';
      });
    },

    updateCharacter: (charId: string, updates: { disposition?: number; memory?: string }) => {
      set(state => {
        const char = state.characters[charId];
        if (!char) return;
        if (updates.disposition !== undefined) char.disposition = updates.disposition;
        if (updates.memory) char.memories.push(updates.memory);
      });
    },

    addPlayerMemory: (entry: string) => {
      set(state => {
        state.playerMemories.push(entry);
        if (state.playerMemories.length > 20) {
          state.playerMemories = state.playerMemories.slice(-20);
        }
      });
    },

    recordTownVisit: (townId: TownId, tick: number) => {
      set(state => {
        state.activity.townVisits.push({ townId, tick });
        if (state.activity.townVisits.length > 10) {
          state.activity.townVisits = state.activity.townVisits.slice(-10);
        }
      });
    },

    recordTrade: (townId: TownId, goodId: string, action: 'buy' | 'sell', tick: number) => {
      set(state => {
        state.activity.trades.push({ townId, goodId, action, tick });
        if (state.activity.trades.length > 10) {
          state.activity.trades = state.activity.trades.slice(-10);
        }
      });
    },

    startDialogue: (charId: string, tick: number) => {
      set(state => {
        state.dialogue = { characterId: charId, turns: [], startTick: tick };
        state.activity.dialogues.push({ characterId: charId, tick });
        if (state.activity.dialogues.length > 10) {
          state.activity.dialogues = state.activity.dialogues.slice(-10);
        }
      });
    },

    addDialogueTurn: (turn: DialogueTurn) => {
      set(state => {
        if (state.dialogue) {
          state.dialogue.turns.push(turn);
        }
      });
    },

    endDialogue: () => {
      set(state => {
        state.dialogue = null;
      });
    },

    discoverObject: (objectId: string) => {
      set(state => {
        if (!state.discoveredObjects.includes(objectId)) {
          state.discoveredObjects.push(objectId);
        }
      });
    },

    checkForObject: (tick: number) => {
      const state = get();
      return maybeDiscoverObject(state.discoveredObjects, FOUND_OBJECTS, tick);
    },

    loadWorldState: (newState: WorldState) => {
      set(state => {
        state.characters = newState.characters;
        state.seeds = newState.seeds;
        state.facts = newState.facts;
        state.playerMemories = newState.playerMemories;
        state.towns = newState.towns;
        state.discoveredObjects = newState.discoveredObjects;
        state.activity = newState.activity;
        state.dialogue = newState.dialogue;
        state.lastDevelopmentTick = newState.lastDevelopmentTick;
        state.developmentCycleCount = newState.developmentCycleCount;
      });
    },

    reset: () => {
      set(state => {
        const fresh = createInitialWorldState(CHARACTERS);
        state.characters = fresh.characters;
        state.seeds = fresh.seeds;
        state.facts = fresh.facts;
        state.playerMemories = fresh.playerMemories;
        state.towns = fresh.towns;
        state.discoveredObjects = fresh.discoveredObjects;
        state.activity = fresh.activity;
        state.dialogue = fresh.dialogue;
        state.lastDevelopmentTick = fresh.lastDevelopmentTick;
        state.developmentCycleCount = fresh.developmentCycleCount;
      });
    },
  }))
);
