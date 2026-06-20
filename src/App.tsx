import { useState, useEffect } from 'react';
import Header from './components/Header';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView'; // 第四步將覆蓋改名為 RoomView
import DispatchView from './views/DispatchView'; // 第四步將覆蓋改名為 TavernView
import MapView from './views/MapView';
import { useGameStore } from './store/useGameStore';
import { Slave } from './types';

function App() {
  // 訂閱大腦全新的空間路由狀態
  const currentScene = useGameStore((state) => state.currentScene);
  const currentSubView = useGameStore((state) => state.currentSubView);
  const navigate = useGameStore((state) => state.navigate);
  
  const slaves = useGameStore((state) => state.slaves);
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const triggerBackgroundMarketRefresh = useGameStore((state) => state.triggerBackgroundMarketRefresh);

  // 全局詳細資訊彈窗狀態 (Modal)
  const [activeSlave, setActiveSlave] = useState<Slave | null>(null);

  // 遊戲啟動背景預載
  useEffect(() => {
    if (marketSlaves.length === 0) {
      triggerBackgroundMarketRefresh();
    }
  }, []);

  // 根據大場景與子視圖動態決定中央舞台內容
  const renderMainStage = () => {
    if (currentScene === 'Home') {
      switch (currentSubView) {
        case 'Main':
          return <BaseView />;
        case 'Room':
          return <BreedingView />; // 繁衍改在房間內進行
        case 'Map':
          return <MapView />;
        default:
          return <BaseView />;
      }
    } else {
      // Town 外出城鎮場景的分支路由
      switch (currentSubView) {
        case 'Main':
          return (
            <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
              <div className="border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-gray-300">城鎮市集</h2>
                <p className="text-xs text-gray-500 mt-1">喧鬧的灰色地帶，充斥著酒精、金錢與血統的地下交易。</p>
              </div>
              
              {/* 未來替換市集背景圖的佔位區 */}
              <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-lg text-center my-2 h-44 flex items-center justify-center italic text-gray-600 text-sm">
                【城鎮外景街頭插圖預留區】
              </div>

              {/* 外出時的場景整合行動選單 */}
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('Town', 'Market')}
                  className="py-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98"
                >
                  <span className="flex items-center gap-2">⛓️ 訪問奴隸商隊</span>
                  <span className="text-xs text-gray-500 font-normal">引進全新的種族與血統大腦</span>
                </button>
                <button 
                  onClick={() => navigate('Town', 'Tavern')}
                  className="py-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98"
                >
                  <span className="flex items-center gap-2">📜 前往喧鬧酒館</span>
                  <span className="text-xs text-gray-500 font-normal">接取委託委派成員換取資金</span>
                </button>
                <button 
                  onClick={() => navigate('Home', 'Main')}
                  className="py-3 bg-blood-red/20 hover:bg-blood-red/30 border border-blood-red/50 text-red-400 font-bold rounded-lg text-center transition-colors shadow mt-2"
                >
                  🔙 返回安全據點 (基地大廳)
                </button>
              </div>
            </div>
          );
        case 'Market':
          return <MarketView />;
        case 'Tavern':
          return <DispatchView />;
        default:
          return <BaseView />;
      }
    }
  };

  // 內政防呆：計算健康狀態燈號 (綠、黃、紅)
  const getHealthStatusColor = (slave: Slave) => {
    const { stamina, stress } = slave.conditionStats;
    if (stamina < 30 || stress > 80) return 'bg-red-500 animate-pulse';
    if (stamina < 60 || stress > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-dark-bg text-gray-200 overflow-hidden select-none">
      
      {/* 頂部常駐狀態列 */}
      <div className="shrink-0 z-20 shadow-md bg-gray-900 relative">
        <Header />
      </div>

      {/* 核心舞台：雙欄空間排版 */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 左側/中央：動態子視圖主舞台 */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 overscroll-contain">
          <div className="w-full max-w-lg">
            {renderMainStage()}
          </div>
        </main>

        {/* 右側：直式極簡成員名單 (基地高亮，外出時變暗並禁用 pointer-events) */}
        <aside className={`w-24 border-l border-gray-800 flex flex-col bg-gray-950/40 overflow-y-auto shrink-0 transition-all duration-300 ${
          currentScene === 'Town' ? 'opacity-15 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="p-2 border-b border-gray-800 text-center bg-gray-900/30">
            <span className="text-2xs font-bold text-gray-500 tracking-wider">基地成員</span>
          </div>
          
          <div className="flex flex-col p-1 gap-1.5">
            {slaves.map((slave) => (
              <button
                key={slave.id}
                onClick={() => setActiveSlave(slave)}
                className="w-full bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700/50 rounded p-1.5 text-left flex flex-col gap-1 relative active:scale-95 transition-all shadow-sm group"
              >
                {/* 健康警示小點 */}
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getHealthStatusColor(slave)} shadow-sm`} />
                
                {/* 極簡正方形頭像框 */}
                <div className="w-7 h-7 bg-gray-950 rounded border border-gray-600 flex items-center justify-center text-xs text-gray-400 font-mono font-bold group-hover:border-blood-red transition-colors">
                  {slave.race[0]}
                </div>
                
                {/* 名字與性別符號 */}
                <div className="truncate text-2xs font-bold text-gray-300 w-full flex items-center justify-between gap-0.5">
                  <span className="truncate flex-1">{slave.name}</span>
                  <span className={`font-sans ${slave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>
                    {slave.gender === 'Male' ? '♂' : '♀'}
                  </span>
                </div>
              </button>
            ))}
            {slaves.length === 0 && (
              <div className="text-3xs text-gray-600 text-center py-6">空無一人</div>
            )}
          </div>
        </aside>
      </div>

      {/* 全局詳細資訊彈窗 (Modal 面板層) */}
      {activeSlave && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all"
          onClick={() => setActiveSlave(null)}
        >
          <div 
            className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-2xl flex flex-col gap-4 relative border-t-2 border-t-blood-red"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 關閉按鈕 */}
            <button 
              onClick={() => setActiveSlave(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-white text-lg font-bold transition-colors"
            >
              ✕
            </button>
            
            {/* 頭部核心身分 */}
            <div>
              <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                {activeSlave.name}
                <span className={activeSlave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}>
                  {activeSlave.gender === 'Male' ? '♂' : '♀'}
                </span>
              </h3>
              <span className="text-xs text-gray-400 bg-gray-950 px-2.5 py-0.5 rounded border border-gray-700 inline-block mt-1">
                種族：{activeSlave.race}
              </span>
            </div>

            {/* 六圍數型面板 */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-950 p-3 rounded border border-gray-800">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between"><span className="text-gray-500">武力:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.combat}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">體質:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.endurance}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">智力:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.intelligence}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">服從:</span> <span className={activeSlave.primaryStats.obedience < 20 ? 'text-red-400 font-bold' : 'text-gray-200 font-mono'}>{activeSlave.primaryStats.obedience}</span></div>
              </div>
              
              <div className="flex flex-col gap-2 border-l border-gray-800 pl-3 justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>體力</span><span>{activeSlave.conditionStats.stamina}/100</span></div>
                  <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden"><div className="bg-green-500 h-full" style={{ width: `${activeSlave.conditionStats.stamina}%` }}></div></div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>壓力</span><span>{activeSlave.conditionStats.stress}/100</span></div>
                  <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden"><div className="bg-yellow-500 h-full" style={{ width: `${activeSlave.conditionStats.stress}%` }}></div></div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>反抗</span><span>{activeSlave.conditionStats.rebellion}/100</span></div>
                  <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden"><div className="bg-blood-red h-full" style={{ width: `${activeSlave.conditionStats.rebellion}%` }}></div></div>
                </div>
              </div>
            </div>

            {/* AI 傳奇身世故事 */}
            <div className="text-xs text-gray-400 italic bg-gray-950 p-2.5 rounded border-l border-blood-red bg-gray-950/40 leading-relaxed">
              身世背景：{activeSlave.backgroundStory}
            </div>

            <button 
              onClick={() => setActiveSlave(null)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded border border-gray-600 transition-colors text-xs tracking-wide"
            >
              收回羊皮紙卷
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
