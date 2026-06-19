import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';

function App() {
  // 管理目前正在顯示的遊戲場景 (預設為基地)
  const [currentView, setCurrentView] = useState('Base');

  return (
    <div className="w-full h-screen flex flex-col bg-dark-bg text-gray-200 overflow-hidden">
      {/* 頂部資源列 */}
      <Header />
      
      {/* 主視窗區 (Main Content) */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-500 mb-4">
          目前所在場景：{currentView}
        </h2>
        <p className="text-gray-600">
          (真實的 UI 面板與互動功能，將在下一批次實作)
        </p>
      </main>

      {/* 底部導覽列 */}
      <Navigation currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
}

export default App;
