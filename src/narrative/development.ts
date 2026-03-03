import type { WorldState, CharacterDef, LLMClient, DevelopmentResult } from '../types/narrative';
import { shouldRunCycle } from './worldEngine';
import { buildDevelopmentContext, buildEntropyContext } from './context';

/* ------------------------------------------------------------------ */
/*  JSON extraction helper                                             */
/* ------------------------------------------------------------------ */

function extractJson(text: string): string {
  // Try to extract JSON from markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Otherwise try to find a JSON object directly
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return objectMatch[0];
  }

  return text;
}

/* ------------------------------------------------------------------ */
/*  maybeTriggerCycle                                                  */
/* ------------------------------------------------------------------ */

export async function maybeTriggerCycle(
  worldState: WorldState,
  tick: number,
  characterDefs: CharacterDef[],
  llmClient: LLMClient,
  constitution: string,
): Promise<DevelopmentResult | null> {
  // 1. Check if it's time for a development cycle
  if (!shouldRunCycle(worldState, tick)) {
    return null;
  }

  // 2. Build the development context (system prompt)
  const developmentContext = buildDevelopmentContext(
    worldState,
    characterDefs,
    constitution,
  );

  // 3. Call the LLM with a user prompt requesting development
  try {
    const response = await llmClient.complete(
      [
        {
          role: 'user',
          content: 'Generate the next world development cycle.',
        },
      ],
      {
        model: 'claude-sonnet-4-6',
        system: developmentContext,
      },
    );

    // 4. Parse JSON from response
    const jsonStr = extractJson(response);
    const result: DevelopmentResult = JSON.parse(jsonStr);
    return result;
  } catch {
    // Parse failure or LLM error — return null
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  runEntropyCheck                                                    */
/* ------------------------------------------------------------------ */

export async function runEntropyCheck(
  worldState: WorldState,
  llmClient: LLMClient,
  constitution: string,
): Promise<DevelopmentResult | null> {
  // 1. Build the entropy context (system prompt)
  const entropyContext = buildEntropyContext(worldState, constitution);

  // 2. Call the LLM
  try {
    const response = await llmClient.complete(
      [
        {
          role: 'user',
          content: 'Perform entropy cleanup on the current world state.',
        },
      ],
      {
        model: 'claude-sonnet-4-6',
        system: entropyContext,
      },
    );

    // 3. Parse JSON from response
    const jsonStr = extractJson(response);
    const result: DevelopmentResult = JSON.parse(jsonStr);
    return result;
  } catch {
    // Parse failure or LLM error — return null
    return null;
  }
}
