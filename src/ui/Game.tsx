import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWorldStore } from '@/store/worldStore';
import { useGameLoop } from './useGameLoop';
import { GOODS, GOOD_IDS } from '@/data/goods';
import { getBuyPrice, getSellPrice } from '@/engine/market';
import { getCargoUsed, getCargoFree } from '@/engine/trade';
import { TOWN_DESCRIPTIONS } from '@/data/descriptions';
import { pickPassage } from '@/data/voyages';
import { CHARACTER_BY_TOWN } from '@/data/characters';
import { FOUND_OBJECTS } from '@/data/foundObjects';
import { saveGame, loadGame, hasSave, deleteSave } from '@/narrative/persistence';
import { WorldMap } from './WorldMap';
import { DialoguePanel } from './DialoguePanel';
import { ApiKeyInput } from './ApiKeyInput';
import type { GoodId, TownId } from '@/types';
import './Game.css';

const weights = Object.fromEntries(
  Object.entries(GOODS).map(([id, g]) => [id, g.weight])
) as Record<GoodId, number>;

export function Game() {
  useGameLoop();

  const tick = useGameStore(s => s.tick);
  const player = useGameStore(s => s.player);
  const towns = useGameStore(s => s.towns);
  const routes = useGameStore(s => s.routes);
  const isPaused = useGameStore(s => s.isPaused);
  const log = useGameStore(s => s.log);
  const buyAction = useGameStore(s => s.buy);
  const sellAction = useGameStore(s => s.sell);
  const travelAction = useGameStore(s => s.travel);
  const togglePause = useGameStore(s => s.togglePause);
  const gameReset = useGameStore(s => s.reset);

  const dialogue = useWorldStore(s => s.dialogue);
  const startDialogue = useWorldStore(s => s.startDialogue);
  const discoveredObjects = useWorldStore(s => s.discoveredObjects);
  const discoverObject = useWorldStore(s => s.discoverObject);
  const checkForObject = useWorldStore(s => s.checkForObject);
  const recordTownVisit = useWorldStore(s => s.recordTownVisit);
  const worldReset = useWorldStore(s => s.reset);
  const loadWorldState = useWorldStore(s => s.loadWorldState);

  const currentTown = player.currentTownId ? towns[player.currentTownId] : null;
  const travelState = player.travelState;

  const cargoUsed = useMemo(
    () => getCargoUsed(player.inventory, weights),
    [player.inventory],
  );

  const lastLog = log.length > 0 ? log[log.length - 1] : null;

  const reachable = useMemo(() => {
    if (!player.currentTownId) return [];
    return routes
      .filter(r => r.from === player.currentTownId || r.to === player.currentTownId)
      .map(r => ({
        townId: (r.from === player.currentTownId ? r.to : r.from) as TownId,
        distance: r.distance,
      }));
  }, [player.currentTownId, routes]);

  const marketRows = useMemo(() => {
    if (!currentTown) return [];
    return GOOD_IDS.map(goodId => {
      const entry = currentTown.market[goodId];
      const inv = player.inventory.find(i => i.goodId === goodId);
      const buyPrice = getBuyPrice(entry);
      const freeSpace = getCargoFree(player, weights);
      return {
        goodId,
        name: GOODS[goodId].name,
        basePrice: GOODS[goodId].basePrice,
        supply: entry.supply,
        buyPrice,
        sellPrice: getSellPrice(entry),
        held: inv?.quantity ?? 0,
        maxBuy: Math.max(
          0,
          Math.min(
            Math.floor(entry.supply),
            Math.floor(player.gold / buyPrice),
            Math.floor(freeSpace / GOODS[goodId].weight),
          ),
        ),
      };
    });
  }, [currentTown, player]);

  const handleBuy = (goodId: GoodId) => {
    buyAction(goodId, 1);
  };

  const handleSell = (goodId: GoodId) => {
    sellAction(goodId, 1);
  };

  const buyClass = (price: number, base: number) => {
    const r = price / base;
    if (r < 0.7) return 'price-good';
    if (r > 1.5) return 'price-bad';
    return '';
  };

  const sellClass = (price: number, base: number) => {
    const r = price / base;
    if (r > 1.5) return 'price-good';
    if (r < 0.7) return 'price-bad';
    return '';
  };

  // Record town visits and check for found objects on arrival
  const prevTownRef = useState<TownId | null>(null);
  useEffect(() => {
    if (player.currentTownId && player.currentTownId !== prevTownRef[0]) {
      recordTownVisit(player.currentTownId, tick);
      const objectId = checkForObject(tick);
      if (objectId) {
        discoverObject(objectId);
      }
      prevTownRef[1](player.currentTownId);
    }
  }, [player.currentTownId, tick, recordTownVisit, checkForObject, discoverObject, prevTownRef]);

  // Auto-save on arrival at town and dialogue end
  useEffect(() => {
    if (player.currentTownId && !dialogue) {
      const gameState = useGameStore.getState();
      const worldState = useWorldStore.getState();
      saveGame(gameState, worldState);
    }
  }, [player.currentTownId, dialogue]);

  // Load save on mount
  useEffect(() => {
    if (hasSave()) {
      const save = loadGame();
      if (save) {
        // Load game state by resetting and overwriting
        useGameStore.setState(save.gameState);
        loadWorldState(save.worldState);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = useCallback(() => {
    gameReset();
    worldReset();
    deleteSave();
  }, [gameReset, worldReset]);

  const handleTalk = useCallback(() => {
    if (player.currentTownId) {
      const charDef = CHARACTER_BY_TOWN[player.currentTownId];
      if (charDef) {
        startDialogue(charDef.id, tick);
      }
    }
  }, [player.currentTownId, tick, startDialogue]);

  const npcName = player.currentTownId ? CHARACTER_BY_TOWN[player.currentTownId]?.name : null;

  // Found objects with details
  const foundObjectDetails = useMemo(() => {
    return discoveredObjects
      .map(id => FOUND_OBJECTS.find(o => o.id === id))
      .filter(Boolean) as typeof FOUND_OBJECTS;
  }, [discoveredObjects]);

  const [showInventory, setShowInventory] = useState(false);

  const statusText = lastLog?.message ?? '';

  return (
    <main className="game">
      <ThemeToggle />

      <div className="header">
        <span className="gold">{player.gold}g</span>
        <span className="cargo">{cargoUsed}/{player.cargoCapacity}</span>
        {foundObjectDetails.length > 0 && (
          <button
            className="inv-btn"
            onClick={() => setShowInventory(!showInventory)}
          >
            {showInventory ? 'close' : 'items'}
          </button>
        )}
      </div>

      <div className="map-wrap">
        <div className={showInventory ? 'map-fade' : ''}>
          <WorldMap
            towns={towns}
            routes={routes}
            currentTownId={player.currentTownId}
            travelState={travelState}
            reachable={reachable}
            onTravel={travelAction}
            tick={tick}
          />
        </div>
        <div className={`found-objects ${showInventory ? 'found-open' : 'found-closed'}`}>
          <svg className="found-border" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
              <filter id="ink-rough-inv" x="-2%" y="-2%" width="104%" height="104%">
                <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="4" seed={7} result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            <g filter="url(#ink-rough-inv)">
              <rect x="2" y="2" width="396" height="196" rx="2" className="found-border-rect" />
            </g>
          </svg>
          <div className="found-content">
            {foundObjectDetails.map(obj => (
              <div key={obj.id} className="found-object">
                <span className="found-name">{obj.name}</span>
                <span className="found-flavor">{obj.flavorText}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {currentTown && (
        <p className="town-desc">{TOWN_DESCRIPTIONS[currentTown.id]}</p>
      )}

      {currentTown && !dialogue && npcName && (
        <button className="talk-btn" onClick={handleTalk}>
          talk to {npcName}
        </button>
      )}

      {dialogue && player.currentTownId && (
        <DialoguePanel townId={player.currentTownId} />
      )}

      {currentTown && !dialogue && (
        <div className="market">
          <div className="market-row market-header">
            <span />
            <span>buy</span>
            <span>sell</span>
            <span className="held-col">held</span>
          </div>
          <div className="market-sep" />
          {marketRows.map(row => (
            <div key={row.goodId} className="market-row">
              <span className="good-name">{row.name}</span>
              <button
                className={`trade-btn ${buyClass(row.buyPrice, row.basePrice)}`}
                onClick={() => handleBuy(row.goodId)}
                disabled={row.maxBuy === 0}
              >
                {row.buyPrice}
              </button>
              <button
                className={`trade-btn ${sellClass(row.sellPrice, row.basePrice)}`}
                onClick={() => handleSell(row.goodId)}
                disabled={row.held === 0}
              >
                {row.sellPrice}
              </button>
              <span className="held">{row.held > 0 ? `\u00d7${row.held}` : ''}</span>
            </div>
          ))}
        </div>
      )}


      {!currentTown && player.inventory.length > 0 && (
        <div className="inventory">
          {player.inventory.map(item => (
            <div key={item.goodId} className="inv-row">
              <span>{GOODS[item.goodId].name}</span>
              <span className="inv-qty">&times;{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="footer">
        <span className="status">{statusText || '\u00a0'}</span>
        {travelState && (() => {
          const startTick = tick - travelState.ticksElapsed;
          return (
            <>
              <span className="voyage-text">{pickPassage(startTick).text}</span>
              <img src="/boat.png" alt="" className="boat-img" />
            </>
          );
        })()}
        <div className="controls">
          <button
            className="play-dot"
            onClick={togglePause}
            style={{ backgroundColor: isPaused ? 'var(--muted)' : '#00d26a' }}
            aria-label={isPaused ? 'Play' : 'Pause'}
          />
          <button className="reset-btn" onClick={handleReset}>
            reset
          </button>
        </div>
        <ApiKeyInput />
      </div>
    </main>
  );
}

const THEMES = ['dawn', 'day', 'dusk', 'dark'] as const;
type Theme = typeof THEMES[number];

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && THEMES.includes(saved)) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dawn';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const next = () => {
    setTheme(t => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]);
  };

  return (
    <div className="theme-dots" onClick={next}>
      {THEMES.map(t => (
        <span
          key={t}
          className={`theme-dot${t === theme ? ' theme-dot-active' : ''}`}
        />
      ))}
    </div>
  );
}
