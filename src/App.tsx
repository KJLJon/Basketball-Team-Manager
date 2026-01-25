import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Home } from './pages/Home';
import { Players } from './pages/Players';
import { Schedule } from './pages/Schedule';
import { Stats } from './pages/Stats';
import { GameSetupPage } from './pages/GameSetupPage';
import { GameDayPage } from './pages/GameDayPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';

function App() {
  return (
    <BrowserRouter basename="/Basketball-Team-Manager">
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/stats/player/:playerId" element={<PlayerDetailPage />} />
          <Route path="/game/:gameId/setup" element={<GameSetupPage />} />
          <Route path="/game/:gameId" element={<GameDayPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
