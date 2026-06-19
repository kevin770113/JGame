import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView';
import DispatchView from './views/DispatchView';
// 新增引入 MapView
import MapView from './views/MapView';

function App() {
  const [currentView, setCurrentView] = useState('Base');

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
        return <MapView />; // 替換為真實的地圖組件
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
