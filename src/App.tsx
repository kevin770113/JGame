import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';

function App() {
  const [currentView, setCurrentView] = useState('Base');

  return (
    <div className="w-full h-[100dvh] flex flex-col bg-dark-bg text-gray-200 overflow-hidden relative">
      
      {/* 頂部資源列 - shrink-0 保證不被壓縮，z-20 保證覆蓋在內容之上 */}
      <div className="shrink-0 z-20 relative shadow-md">
        <Header />
      </div>
      
      {/* 中間主視窗區 - flex-1 填滿剩餘空間，overflow-y-auto 允許獨立上下滑動 */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 relative">
        <div className="mt-6 flex flex-col items-center w-full max-w-lg">
          <h2 className="text-2xl font-bold text-gray-500 mb-4">
            目前所在場景：{currentView}
          </h2>
          <p className="text-gray-600 text-center text-sm px-4 mb-4">
            (真實的 UI 面板與互動功能，將在下一批次實作)
          </p>
          
          {/* 測試用假方塊：用來驗證滑動時，上下選單會不會跟著跑 */}
          <div className="h-[800px] w-full border-2 border-dashed border-gray-700 flex flex-col items-center justify-start pt-10 text-gray-600 rounded-lg">
            <span className="text-lg text-gray-400">滑動測試區塊 👇</span>
            <span className="mt-auto pb-10 text-lg text-gray-400">底部邊界 👆</span>
          </div>
        </div>
      </main>

      {/* 底部導覽列 - shrink-0 保證不被壓縮 */}
      <div className="shrink-0 z-20 relative">
        <Navigation currentView={currentView} setCurrentView={setCurrentView} />
      </div>
      
    </div>
  );
}

export default App;
