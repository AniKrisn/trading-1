import type { LLMClient, LLMMessage } from '../types/narrative';

/* ------------------------------------------------------------------ */
/*  Anthropic client (raw fetch)                                       */
/* ------------------------------------------------------------------ */

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export function createAnthropicClient(apiKey: string): LLMClient {
  return {
    async complete(
      messages: LLMMessage[],
      options?: { model?: string; system?: string },
    ): Promise<string> {
      const model = options?.model ?? DEFAULT_MODEL;

      const body: Record<string, unknown> = {
        model,
        max_tokens: 512,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };

      if (options?.system) {
        body.system = options.system;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${text}`);
      }

      const data = await response.json();

      // Return first text content block
      const textBlock = data.content?.find(
        (block: { type: string }) => block.type === 'text',
      );

      return textBlock?.text ?? '';
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Mock client                                                        */
/* ------------------------------------------------------------------ */

const MOCK_DEVELOPMENT_RESULT = JSON.stringify({
  updatedAtmospheres: [],
  newRumors: [],
  newEvents: [],
  newSeeds: [],
  resolvedSeedIds: [],
  characterUpdates: [],
  newFacts: [],
});

const MOCK_NPC_LINE = 'Aye, traveler. The roads have been busy of late.';

export function createMockClient(): LLMClient {
  return {
    async complete(
      _messages: LLMMessage[],
      options?: { model?: string; system?: string },
    ): Promise<string> {
      const system = options?.system ?? '';

      if (system.toLowerCase().includes('development') || system.toLowerCase().includes('entropy')) {
        return MOCK_DEVELOPMENT_RESULT;
      }

      if (system.toLowerCase().includes('character') || system.toLowerCase().includes('respond as')) {
        return MOCK_NPC_LINE;
      }

      return 'No response.';
    },
  };
}

/* ------------------------------------------------------------------ */
/*  API key storage                                                    */
/* ------------------------------------------------------------------ */

const API_KEY_STORAGE_KEY = 'anthropic-api-key';

export function getStoredApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } catch {
    // localStorage unavailable — silently fail
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // localStorage unavailable — silently fail
  }
}
