import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { UpdateBanner } from './components/common/UpdateBanner';
import { Home } from './pages/Home';
import { Players } from './pages/Players';
import { Schedule } from './pages/Schedule';
import { Stats } from './pages/Stats';
import { Training } from './pages/Training';
import { GameSetupPage } from './pages/GameSetupPage';
import { GameDayPage } from './pages/GameDayPage';
import { PlayerDetailPage } from './pages/PlayerDetailPage';
import { GameService } from './services/game';
import { useServiceWorker } from './hooks/useServiceWorker';

function App() {
  const { showUpdateBanner, updateServiceWorker, dismissUpdate } = useServiceWorker();

  // Run migration on app load to convert old rotation format to new playerMinutes format
  useEffect(() => {
    GameService.migrateToPlayerMinutes();
  }, []);

  return (
    <BrowserRouter basename="/Basketball-Team-Manager">
      <ScrollToTop />
      {showUpdateBanner && (
        <UpdateBanner onUpdate={updateServiceWorker} onDismiss={dismissUpdate} />
      )}
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<Players />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/training" element={<Training />} />
          <Route path="/stats/player/:playerId" element={<PlayerDetailPage />} />
          <Route path="/game/:gameId/setup" element={<GameSetupPage />} />
          <Route path="/game/:gameId" element={<GameDayPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
