// Passages shown while sailing between islands.
// Weighted by mood: most are calm, some are atmospheric, a few are wrong.

export interface Passage {
  text: string;
  mood: 'calm' | 'strange' | 'wrong';
}

export const PASSAGES: Passage[] = [
  // Calm — the sea doing what it does
  { mood: 'calm', text: 'Flat water. The oars left clean holes.' },
  { mood: 'calm', text: 'Wind from the north. Steady.' },
  { mood: 'calm', text: 'A gull followed for a while, then lost interest.' },
  { mood: 'calm', text: 'The sail held. Nothing to do but wait.' },
  { mood: 'calm', text: 'Sun on the water. The kind of light that makes you squint.' },
  { mood: 'calm', text: 'The hull creaked in a rhythm you could sleep to.' },
  { mood: 'calm', text: 'A good wind. You made time.' },
  { mood: 'calm', text: 'Salt on your lips. The taste of getting somewhere.' },
  { mood: 'calm', text: 'You passed a fishing boat. No one waved.' },
  { mood: 'calm', text: 'The water was green near the shallows, then blue, then black.' },
  { mood: 'calm', text: 'You ate the last of the bread. It was stale but fine.' },
  { mood: 'calm', text: 'The coast shrank behind you. The horizon said nothing.' },
  { mood: 'calm', text: 'A school of silver fish broke the surface and vanished.' },

  // Strange — not wrong, but not right
  { mood: 'strange', text: 'The current pulled south. Your charts said it shouldn\'t.' },
  { mood: 'strange', text: 'No birds. The sky was empty the whole way.' },
  { mood: 'strange', text: 'The water was warmer than it should have been.' },
  { mood: 'strange', text: 'You heard something under the hull. Probably the keel.' },
  { mood: 'strange', text: 'A dead calm. The sail hung like cloth on a line.' },
  { mood: 'strange', text: 'The stars didn\'t look right, but you couldn\'t say why.' },
  { mood: 'strange', text: 'You thought you saw land to the west. There\'s no land to the west.' },
  { mood: 'strange', text: 'The compass needle trembled. Then it was fine.' },
  { mood: 'strange', text: 'Something scraped the bottom of the boat. You were in deep water.' },
  { mood: 'strange', text: 'The light went strange for a moment. A cloud, probably.' },

  // Wrong — the sea remembers
  { mood: 'wrong', text: 'Something large moved under the boat. It didn\'t surface.' },
  { mood: 'wrong', text: 'The net came up with a stone in it. It was warm.' },
  { mood: 'wrong', text: 'You counted the islands on the horizon. There was one too many.' },
  { mood: 'wrong', text: 'The water went dark beneath the hull. Then it passed.' },
  { mood: 'wrong', text: 'A sound from below. Not the sea. Something in it.' },
];

// Simple deterministic pick based on a seed (tick)
export function pickPassage(seed: number): Passage {
  // Weight: 70% calm, 22% strange, 8% wrong
  const roll = ((seed * 2654435761) >>> 0) % 100;
  const mood = roll < 70 ? 'calm' : roll < 92 ? 'strange' : 'wrong';
  const pool = PASSAGES.filter(p => p.mood === mood);
  const idx = ((seed * 1597334677) >>> 0) % pool.length;
  return pool[idx];
}
