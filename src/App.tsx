import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';

function App() {
  const [currentView, setCurrentView] = useState('Base');

  return (
    // 拔除 w-full h-[100dvh]，改用 absolute inset-0 強制貼齊四邊
    <div className="absolute inset-0 flex flex-col bg-dark-bg text-gray-200 overflow-hidden">
      
      {/* 頂部資源列 */}
      <div className="shrink-0 z-20 shadow-md bg-gray-900 relative">
        <Header />
      </div>
      
      {/* 中間主視窗區 */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 relative overscroll-contain">
        <div className="mt-6 flex flex-col items-center w-full max-w-lg">
          <h2 className="text-2xl font-bold text-gray-500 mb-4">
            目前所在場景：{currentView}
          </h2>
          <p className="text-gray-600 text-center text-sm px-4 mb-4">
            (真實的 UI 面板與互動功能，將在下一批次實作)
          </p>
          
          <div className="h-[800px] w-full border-2 border-dashed border-gray-700 flex flex-col items-center justify-start pt-10 text-gray-600 rounded-lg">
            <span className="text-lg text-gray-400">滑動測試區塊 👇</span>
            <span className="mt-auto pb-10 text-lg text-gray-400">底部邊界 👆</span>
          </div>
        </div>
      </main>

      {/* 底部導覽列 */}
      <div className="shrink-0 z-20 relative bg-gray-900 border-t border-gray-700">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      
    </div>
  );
}

export default App;
