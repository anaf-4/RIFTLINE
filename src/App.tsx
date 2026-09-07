import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from './store/gameStore';
import TitleScreen from './ui/screens/TitleScreen';
import ClassSelectScreen from './ui/screens/ClassSelectScreen';
import MapScreen from './ui/screens/MapScreen';
import CombatScreen from './ui/screens/CombatScreen';
import RewardScreen from './ui/screens/RewardScreen';
import ShopScreen from './ui/screens/ShopScreen';
import RestScreen from './ui/screens/RestScreen';
import EventScreen from './ui/screens/EventScreen';
import AchievementsScreen from './ui/screens/AchievementsScreen';
import GameOverScreen from './ui/screens/GameOverScreen';
import VictoryScreen from './ui/screens/VictoryScreen';
import ViewportScaler from './ui/components/ViewportScaler';
import './ui/styles/layout.css';

export default function App() {
  const screen = useGameStore((s) => s.game.screen);
  const backToTitle = useGameStore((s) => s.backToTitle);
  const initApp = useGameStore((s) => s.initApp);

  useEffect(() => {
    void initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = CapApp.addListener('backButton', () => {
      if (screen === 'title') {
        CapApp.exitApp();
      } else {
        backToTitle();
      }
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [screen, backToTitle]);

  return (
    <div className="app-root">
      <ViewportScaler>
        {screen === 'title' && <TitleScreen />}
        {screen === 'classSelect' && <ClassSelectScreen />}
        {screen === 'map' && <MapScreen />}
        {screen === 'combat' && <CombatScreen />}
        {screen === 'reward' && <RewardScreen />}
        {screen === 'shop' && <ShopScreen />}
        {screen === 'rest' && <RestScreen />}
        {screen === 'event' && <EventScreen />}
        {screen === 'achievements' && <AchievementsScreen />}
        {screen === 'gameover' && <GameOverScreen />}
        {screen === 'victory' && <VictoryScreen />}
      </ViewportScaler>
    </div>
  );
}
