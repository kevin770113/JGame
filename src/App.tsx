import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';

function App() {
  const [currentView, setCurrentView] = useState('Base');

  return (
    // 注意這裡的 h-[100dvh] 是核心修復關鍵
    <div className="w-full h-[100dvh] flex flex-col bg-dark-bg text-gray-200 overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-500 mb-4">
          目前所在場景：{currentView}
        </h2>
        <p className="text-gray-600 text-center text-sm px-4">
          (真實的 UI 面板與互動功能，將在下一批次實作)
        </p>
      </main>

      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

export default App;
