import { useState, useEffect } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView';
import DispatchView from './views/DispatchView';
import MapView from './views/MapView';
import { useGameStore } from './store/useGameStore';

function App() {
  const [currentView, setCurrentView] = useState('Base');

  // 從大腦讀取市場狀態與背景批貨函數
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const triggerBackgroundMarketRefresh = useGameStore((state) => state.triggerBackgroundMarketRefresh);

  // 遊戲啟動監聽器 (Component Mount)
  useEffect(() => {
    // 只要遊戲一啟動，且發現大腦裡的市場是空的，就立刻在背景無聲無息地觸發 AI 批貨
    if (marketSlaves.length === 0) {
      triggerBackgroundMarketRefresh();
    }
  }, []); // 空的依賴陣列代表只在進入遊戲時檢查一次

  const renderView = () => {
    switch (currentView) {
      case 'Base':
        return <BaseView />;
      case 'Market':
        return <MarketView />;
      case 'Breeding':
        return <BreedingView />;
      case 'Dispatch':
        return <DispatchView />;
      case 'Map':
        return <MapView />;
      default:
        return <BaseView />;
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-dark-bg text-gray-200 overflow-hidden">
      
      <div className="shrink-0 z-20 shadow-md bg-gray-900 relative">
        <Header />
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 relative overscroll-contain">
        <div className="w-full max-w-lg">
          {renderView()}
        </div>
      </main>

      <div className="shrink-0 z-20 relative bg-gray-900 border-t border-gray-700">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      
    </div>
  );
}

export default App;
