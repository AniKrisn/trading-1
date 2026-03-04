import type { LLMClient, LLMMessage } from '../types/narrative';

/* ------------------------------------------------------------------ */
/*  Anthropic client (via Vite proxy — key stays server-side)          */
/* ------------------------------------------------------------------ */

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export function createProxyClient(): LLMClient {
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

      const response = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${text}`);
      }

      const data = await response.json();

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
/*  Client factory                                                     */
/* ------------------------------------------------------------------ */

export function getLLMClient(): LLMClient {
  // In dev, the Vite proxy handles the API key server-side.
  // If no key is configured, the proxy will get a 401 and we fall through.
  return createProxyClient();
}
