import type { GameState } from '../types/index';
import type { WorldState, SaveData } from '../types/narrative';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SAVE_KEY = 'trading-game-save';
const SAVE_VERSION = 1;

/* ------------------------------------------------------------------ */
/*  saveGame                                                           */
/* ------------------------------------------------------------------ */

export function saveGame(gameState: GameState, worldState: WorldState): void {
  const data: SaveData = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    gameState,
    worldState,
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/* ------------------------------------------------------------------ */
/*  loadGame                                                           */
/* ------------------------------------------------------------------ */

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const data: SaveData = JSON.parse(raw);

    // Version check
    if (data.version !== SAVE_VERSION) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  deleteSave                                                         */
/* ------------------------------------------------------------------ */

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // localStorage unavailable — silently fail
  }
}

/* ------------------------------------------------------------------ */
/*  hasSave                                                            */
/* ------------------------------------------------------------------ */

export function hasSave(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
