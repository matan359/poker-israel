/**
 * Casino Wrapper Component
 * Integrates casino games into the main poker app
 */
import React, { Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
// Import casino styles
import './Casino.css';

// Lazy load casino pages
const Home = React.lazy(() => import('./pages/Home'));
const Crash = React.lazy(() => import('./pages/Crash'));
const Roulette = React.lazy(() => import('./pages/Roulette'));
const Slots = React.lazy(() => import('./pages/Slots'));
const Blackjack = React.lazy(() => import('./pages/Blackjack'));
const Reme = React.lazy(() => import('./pages/Reme'));
const Limbo = React.lazy(() => import('./pages/Limbo'));
const Coinflip = React.lazy(() => import('./pages/Coinflip'));
const Towers = React.lazy(() => import('./pages/Towers'));
const Mines = React.lazy(() => import('./pages/Mines'));
const Unboxing = React.lazy(() => import('./pages/Unboxing'));
const Dice = React.lazy(() => import('./pages/Dice'));
const Keno = React.lazy(() => import('./pages/Keno'));
const Plinko = React.lazy(() => import('./pages/Plinko'));
const Race = React.lazy(() => import('./pages/Race'));
const Discord = React.lazy(() => import('./pages/Discord'));
const UnboxingList = React.lazy(() => import('./pages/UnboxingList'));

const LoadingFallback = () => (
  <div style={{ 
    minHeight: '100vh', 
    backgroundColor: '#15171e', 
    color: 'white', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    fontSize: '1.5rem'
  }}>
    טוען קזינו...
  </div>
);

const CasinoWrapper = () => {
  const location = useLocation();
  
  return (
    <div className="casino-wrapper" style={{ minHeight: '100vh', backgroundColor: '#15171e' }}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes key={location.pathname} location={location}>
          <Route path="" element={<Home />} />
          <Route path="games/crash" element={<Crash />} />
          <Route path="games/roulette" element={<Roulette />} />
          <Route path="games/slots" element={<Slots />} />
          <Route path="games/blackjack" element={<Blackjack />} />
          <Route path="games/reme" element={<Reme />} />
          <Route path="games/limbo" element={<Limbo />} />
          <Route path="games/coinflip" element={<Coinflip />} />
          <Route path="games/towers" element={<Towers />} />
          <Route path="games/mines" element={<Mines />} />
          <Route path="games/unboxing" element={<Unboxing />} />
          <Route path="games/dice" element={<Dice />} />
          <Route path="games/keno" element={<Keno />} />
          <Route path="games/plinko" element={<Plinko />} />
          <Route path="games/race" element={<Race />} />
          <Route path="games/discord" element={<Discord />} />
          <Route path="games/:id" element={<UnboxingList />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default CasinoWrapper;
