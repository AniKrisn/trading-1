import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Game } from './ui/Game';
import { GrainFilter } from './ui/GrainFilter';
import './global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GrainFilter />
    <Game />
  </StrictMode>
);
