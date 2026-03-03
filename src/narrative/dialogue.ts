import type { WorldState, CharacterDef, LLMClient, DialogueTurn } from '../types/narrative';
import { buildDialogueContext } from './context';

/* ------------------------------------------------------------------ */
/*  processDialogue                                                    */
/* ------------------------------------------------------------------ */

export async function processDialogue(
  worldState: WorldState,
  characterDef: CharacterDef,
  playerMessage: string,
  llmClient: LLMClient,
  constitution: string,
): Promise<{ npcReply: string; memoryEntry?: string }> {
  // 1. Gather existing dialogue turns
  const existingTurns: DialogueTurn[] = worldState.dialogue?.turns ?? [];

  // 2. Build recent turns for context
  const recentTurns = existingTurns.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  // 3. Build the dialogue context (system prompt)
  const dialogueContext = buildDialogueContext(
    worldState,
    characterDef,
    recentTurns,
    constitution,
  );

  // 4. Build LLM messages array from turns + new player message
  const messages = [
    ...existingTurns.map((t) => ({
      role: t.role === 'player' ? ('user' as const) : ('assistant' as const),
      content: t.content,
    })),
    { role: 'user' as const, content: playerMessage },
  ];

  // 5. Call the LLM
  const npcReply = await llmClient.complete(messages, {
    model: 'claude-haiku-4-5-20251001',
    system: dialogueContext,
  });

  // 6. If conversation has 3+ turns (including this new exchange), create a memory entry
  const totalTurns = existingTurns.length + 2; // existing + player msg + npc reply
  let memoryEntry: string | undefined;

  if (totalTurns >= 3) {
    // Summarize the topic from the most recent messages
    const topicMessages = [
      ...existingTurns.slice(-2).map((t) => t.content),
      playerMessage,
    ];
    const topicSnippet = topicMessages.join(' ').slice(0, 80);
    memoryEntry = `Spoke with ${characterDef.name} about: ${topicSnippet}`;
  }

  return { npcReply, memoryEntry };
}
