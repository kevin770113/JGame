import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView';
// 新增引入 DispatchView
import DispatchView from './views/DispatchView';

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
        return <DispatchView />; // 替換為真實的派遣組件
      case 'Map':
        return <div className="text-gray-500 text-center mt-10">據點遷移建置中...</div>;
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
