import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
// 新增引入 BreedingView
import BreedingView from './views/BreedingView';

function App() {
  const [currentView, setCurrentView] = useState('Base');

  const renderView = () => {
    switch (currentView) {
      case 'Base':
        return <BaseView />;
      case 'Market':
        return <MarketView />;
      case 'Breeding':
        return <BreedingView />; // 替換為真實的繁衍組件
      case 'Dispatch':
        return <div className="text-gray-500 text-center mt-10">外部派遣建置中...</div>;
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
