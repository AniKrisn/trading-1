import type { TownId, GameState } from './index';

// --- Complexity caps ---
export const MAX_SEEDS = 5;
export const MAX_FACTS = 20;
export const MAX_CHARACTERS = 12;
export const MAX_DEVELOPMENTS_PER_CYCLE = 3;
export const DEVELOPMENT_CYCLE_INTERVAL = 30; // ticks between cycles
export const ENTROPY_CHECK_INTERVAL = 5; // every N cycles

// --- Characters ---

export interface CharacterDef {
  id: string;
  name: string;
  townId: TownId;
  role: string;
  personality: string;
  speechPattern: string;
  initialDisposition: number; // 0-100
}

export interface CharacterState {
  id: string;
  disposition: number; // 0-100
  lastInteractionTick: number | null;
  memories: string[]; // short entries about interactions with player
}

// --- Narrative seeds ---

export type SeedStatus = 'active' | 'resolved' | 'expired';

export interface Seed {
  id: string;
  description: string;
  status: SeedStatus;
  involvedCharacters: string[];
  tickCreated: number;
}

// --- Town narrative ---

export interface TownNarrativeState {
  townId: TownId;
  atmosphere: string;
  rumors: string[];
  recentEvents: string[];
}

// --- Found objects ---

export interface FoundObjectDef {
  id: string;
  name: string;
  flavorText: string;
  acquireChance: number; // 0-1
}

// --- Player activity ---

export interface PlayerActivitySummary {
  townVisits: { townId: TownId; tick: number }[];
  trades: { townId: TownId; goodId: string; action: 'buy' | 'sell'; tick: number }[];
  dialogues: { characterId: string; tick: number }[];
}

// --- Development cycle ---

export interface DevelopmentResult {
  updatedAtmospheres?: { townId: TownId; atmosphere: string }[];
  newRumors?: { townId: TownId; rumor: string }[];
  newEvents?: { townId: TownId; event: string }[];
  newSeeds?: Omit<Seed, 'tickCreated'>[];
  resolvedSeedIds?: string[];
  characterUpdates?: { characterId: string; disposition?: number; memory?: string }[];
  newFacts?: string[];
}

// --- Dialogue ---

export interface DialogueTurn {
  role: 'player' | 'npc';
  content: string;
}

export interface DialogueSession {
  characterId: string;
  turns: DialogueTurn[];
  startTick: number;
}

// --- World state (canonical mutable) ---

export interface WorldState {
  characters: Record<string, CharacterState>;
  seeds: Seed[];
  facts: string[]; // world facts the LLM has established
  playerMemories: string[]; // things the player has done/learned
  towns: Record<TownId, TownNarrativeState>;
  discoveredObjects: string[]; // object ids
  activity: PlayerActivitySummary;
  dialogue: DialogueSession | null;
  lastDevelopmentTick: number;
  developmentCycleCount: number;
}

// --- Save/load ---

export interface SaveData {
  version: number;
  timestamp: number;
  gameState: GameState;
  worldState: WorldState;
}

// --- LLM client ---

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LLMClient {
  complete(
    messages: LLMMessage[],
    options?: { model?: string; system?: string }
  ): Promise<string>;
}
