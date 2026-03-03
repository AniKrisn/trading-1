import { useState, useMemo, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useGameLoop } from './useGameLoop';
import { GOODS, GOOD_IDS } from '@/data/goods';
import { getBuyPrice, getSellPrice } from '@/engine/market';
import { getCargoUsed, getCargoFree } from '@/engine/trade';
import { TOWN_DESCRIPTIONS } from '@/data/descriptions';
import { pickPassage } from '@/data/voyages';
import { WorldMap } from './WorldMap';
import type { GoodId, TownId } from '@/types';
import './Game.css';

const weights = Object.fromEntries(
  Object.entries(GOODS).map(([id, g]) => [id, g.weight])
) as Record<GoodId, number>;

export function Game() {
  useGameLoop();
  const [tradeQty, setTradeQty] = useState<number>(1);

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
  const reset = useGameStore(s => s.reset);

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

  const getEffectiveQty = (goodId: GoodId, action: 'buy' | 'sell') => {
    const row = marketRows.find(r => r.goodId === goodId);
    if (!row) return 0;
    if (tradeQty === 0) return action === 'buy' ? row.maxBuy : row.held;
    return tradeQty;
  };

  const handleBuy = (goodId: GoodId) => {
    const qty = getEffectiveQty(goodId, 'buy');
    if (qty > 0) buyAction(goodId, qty);
  };

  const handleSell = (goodId: GoodId) => {
    const qty = getEffectiveQty(goodId, 'sell');
    if (qty > 0) sellAction(goodId, qty);
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

  const statusText = lastLog?.message ?? (isPaused ? 'click prices to trade' : '');

  return (
    <main className="game">
      <ThemeToggle />

      <div className="header">
        <span className="gold">{player.gold}g</span>
        <span className="cargo">{cargoUsed}/{player.cargoCapacity}</span>
      </div>

      <WorldMap
        towns={towns}
        routes={routes}
        currentTownId={player.currentTownId}
        travelState={travelState}
        reachable={reachable}
        onTravel={travelAction}
        tick={tick}
      />

      {currentTown && (
        <p className="town-desc">{TOWN_DESCRIPTIONS[currentTown.id]}</p>
      )}

      {currentTown && (
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

      {currentTown && (
        <div className="qty-row">
          {[1, 5, 10, 0].map(q => (
            <button
              key={q}
              className={`qty-btn ${tradeQty === q ? 'active' : ''}`}
              onClick={() => setTradeQty(q)}
            >
              {q === 0 ? 'max' : `\u00d7${q}`}
            </button>
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
          return <span className="voyage-text">{pickPassage(startTick).text}</span>;
        })()}
        <div className="controls">
          <button
            className="play-dot"
            onClick={togglePause}
            style={{ backgroundColor: isPaused ? 'var(--muted)' : '#00d26a' }}
            aria-label={isPaused ? 'Play' : 'Pause'}
          />
          <button className="reset-btn" onClick={reset}>
            reset
          </button>
        </div>
      </div>
    </main>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <button
      className="theme-dot"
      onClick={() => setIsDark(!isDark)}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    />
  );
}
