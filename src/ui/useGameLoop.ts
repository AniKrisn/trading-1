import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

const BASE_TICK_MS = 1000; // 1 second per tick at speed 1

export function useGameLoop() {
  const tickRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    const loop = (time: number) => {
      const state = useGameStore.getState();
      if (!state.isPaused) {
        const interval = BASE_TICK_MS / state.speed;
        if (time - lastTickRef.current >= interval) {
          state.doTick();
          lastTickRef.current = time;
        }
      }
      tickRef.current = requestAnimationFrame(loop);
    };

    tickRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(tickRef.current);
  }, []);
}
