import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import BaseView from './views/BaseView';

function App() {
  const [currentView, setCurrentView] = useState('Base');

  // 根據 currentView 渲染對應的場景組件
  const renderView = () => {
    switch (currentView) {
      case 'Base':
        return <BaseView />;
      case 'Market':
        return <div className="text-gray-500 text-center mt-10">奴隸市場建置中...</div>;
      case 'Breeding':
        return <div className="text-gray-500 text-center mt-10">繁衍實驗室建置中...</div>;
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
      
      {/* 主視窗區 - 這裡掛載真實的遊戲畫面 */}
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
