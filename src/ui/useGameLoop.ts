import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { maybeTriggerCycle, runEntropyCheck } from '@/narrative/development';
import { createAnthropicClient, createMockClient, getStoredApiKey } from '@/narrative/llmClient';
import { CHARACTERS } from '@/data/characters';
import { CONSTITUTION } from '@/data/constitution';
import { ENTROPY_CHECK_INTERVAL } from '@/types/narrative';

const BASE_TICK_MS = 1000; // 1 second per tick at speed 1

function getLLMClient() {
  const key = getStoredApiKey();
  return key ? createAnthropicClient(key) : createMockClient();
}

export function useGameLoop() {
  const tickRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const developingRef = useRef(false);

  useEffect(() => {
    const loop = (time: number) => {
      const state = useGameStore.getState();
      if (!state.isPaused) {
        const interval = BASE_TICK_MS / state.speed;
        if (time - lastTickRef.current >= interval) {
          state.doTick();
          lastTickRef.current = time;

          // After tick, check for development cycle (non-blocking)
          if (!developingRef.current) {
            const worldState = useWorldStore.getState();
            const tick = state.tick + 1; // doTick already incremented
            developingRef.current = true;
            const client = getLLMClient();

            maybeTriggerCycle(worldState, tick, CHARACTERS, client, CONSTITUTION)
              .then(result => {
                if (result) {
                  useWorldStore.getState().applyDevelopment(result, tick);

                  // Check if entropy cleanup is due
                  const ws = useWorldStore.getState();
                  if (ws.developmentCycleCount % ENTROPY_CHECK_INTERVAL === 0) {
                    runEntropyCheck(ws, client, CONSTITUTION).then(cleanup => {
                      if (cleanup) {
                        useWorldStore.getState().applyDevelopment(cleanup, tick);
                      }
                    });
                  }
                }
              })
              .finally(() => {
                developingRef.current = false;
              });
          }
        }
      }
      tickRef.current = requestAnimationFrame(loop);
    };

    tickRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(tickRef.current);
  }, []);
}
