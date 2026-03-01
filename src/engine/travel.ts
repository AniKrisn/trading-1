import type { Player, TownId, Route } from '@/types';

/** Find a route between two towns (routes are bidirectional) */
export function findRoute(routes: Route[], from: TownId, to: TownId): Route | undefined {
  return routes.find(r =>
    (r.from === from && r.to === to) || (r.from === to && r.to === from)
  );
}

/** Begin traveling from current town to a destination */
export function startTravel(player: Player, routes: Route[], toTownId: TownId): Player | { error: string } {
  if (!player.currentTownId) return { error: 'Already traveling' };
  if (player.currentTownId === toTownId) return { error: 'Already at destination' };

  const route = findRoute(routes, player.currentTownId, toTownId);
  if (!route) return { error: 'No route to destination' };

  return {
    ...player,
    currentTownId: null,
    travelState: {
      fromTownId: player.currentTownId,
      toTownId,
      ticksTotal: route.distance,
      ticksElapsed: 0,
    },
  };
}

/** Advance travel by one tick; arrive if travel is complete */
export function advanceTravel(player: Player): Player {
  if (!player.travelState) return player;

  const newElapsed = player.travelState.ticksElapsed + 1;
  if (newElapsed >= player.travelState.ticksTotal) {
    // Arrived
    return {
      ...player,
      currentTownId: player.travelState.toTownId,
      travelState: null,
    };
  }

  return {
    ...player,
    travelState: { ...player.travelState, ticksElapsed: newElapsed },
  };
}
