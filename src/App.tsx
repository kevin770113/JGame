import { useState, useEffect } from 'react';
import Header from './components/Header';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView'; 
import DispatchView from './views/DispatchView'; 
import MapView from './views/MapView';
import InteractionView from './views/InteractionView'; // 新增匯入
import { useGameStore } from './store/useGameStore';
import { Slave } from './types';

function App() {
  const currentScene = useGameStore((state) => state.currentScene);
  const currentSubView = useGameStore((state) => state.currentSubView);
  const navigate = useGameStore((state) => state.navigate);
  
  const slaves = useGameStore((state) => state.slaves);
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const triggerBackgroundMarketRefresh = useGameStore((state) => state.triggerBackgroundMarketRefresh);

  const [activeSlave, setActiveSlave] = useState<Slave | null>(null);

  useEffect(() => {
    if (marketSlaves.length === 0) triggerBackgroundMarketRefresh();
  }, []);

  const renderMainStage = () => {
    if (currentScene === 'Home') {
      switch (currentSubView) {
        case 'Main': return <BaseView />;
        case 'Room': return <BreedingView />; 
        case 'Interaction': return <InteractionView />; // 新增路由
        case 'Map': return <MapView />;
        default: return <BaseView />;
      }
    } else {
      switch (currentSubView) {
        case 'Main':
          return (
            <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
              <div className="border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-gray-300">城鎮市集</h2>
                <p className="text-xs text-gray-500 mt-1">喧鬧的灰色地帶，充斥著酒精、金錢與血統的地下交易。</p>
              </div>
              
              <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-lg text-center my-2 h-44 flex items-center justify-center italic text-gray-600 text-sm">
                ［城鎮外景街頭插圖預留區］
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('Town', 'Market')}
                  className="py-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98 group"
                >
                  <span className="flex items-center gap-2 text-gray-300 group-hover:text-white tracking-widest">［訪問奴隸商隊］</span>
                  <span className="text-xs text-gray-500 font-normal">引進全新的種族與血統</span>
                </button>
                <button 
                  onClick={() => navigate('Town', 'Tavern')}
                  className="py-4 bg-gray-900/80 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98 group"
                >
                  <span className="flex items-center gap-2 text-gray-300 group-hover:text-white tracking-widest">［前往喧鬧酒館］</span>
                  <span className="text-xs text-gray-500 font-normal">查閱深淵委託與懸賞</span>
                </button>
                <button 
                  onClick={() => navigate('Home', 'Main')}
                  className="py-3 bg-blood-red/20 hover:bg-blood-red/30 border border-blood-red/50 text-red-400 font-bold rounded-lg text-center transition-colors shadow mt-2 tracking-widest"
                >
                  ［返回安全據點］
                </button>
              </div>
            </div>
          );
        case 'Market': return <MarketView />;
        case 'Tavern': return <DispatchView />;
        default: return <BaseView />;
      }
    }
  };

  const getHealthStatusColor = (slave: Slave) => {
    const { stamina, stress } = slave.conditionStats;
    if (stamina < 30 || stress > 80) return 'bg-red-500 animate-pulse';
    if (stamina < 60 || stress > 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-dark-bg text-gray-200 overflow-hidden select-none">
      <div className="shrink-0 z-20 shadow-md bg-gray-900 relative"><Header /></div>

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 overscroll-contain">
          <div className={`w-full transition-all duration-300 ${currentScene === 'Town' ? 'max-w-3xl' : 'max-w-lg'}`}>
            {renderMainStage()}
          </div>
        </main>

        {currentScene === 'Home' && (
          <aside className="w-24 border-l border-gray-800 flex flex-col bg-gray-950/40 overflow-y-auto shrink-0 animate-fade-in">
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
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getHealthStatusColor(slave)} shadow-sm`} />
                  
                  <div className={`w-7 h-7 bg-gray-950 rounded border ${slave.activityStatus !== '閒置' ? 'border-yellow-600 text-yellow-600' : 'border-gray-600 text-gray-400'} flex items-center justify-center text-xs font-mono font-bold group-hover:border-blood-red transition-colors`}>
                    {slave.race[0]}
                  </div>
                  
                  <div className="truncate text-2xs font-bold text-gray-300 w-full flex items-center justify-between gap-0.5">
                    <span className="truncate flex-1">{slave.name}</span>
                    <span className={`font-sans font-bold ${slave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>
                      {slave.gender === 'Male' ? '男' : '女'}
                    </span>
                  </div>
                  {slave.activityStatus !== '閒置' && (
                     <div className="text-3xs text-yellow-500 font-bold bg-yellow-900/30 text-center rounded">{slave.activityStatus}</div>
                  )}
                </button>
              ))}
              {slaves.length === 0 && <div className="text-3xs text-gray-600 text-center py-6">空無一人</div>}
            </div>
          </aside>
        )}
      </div>

      {activeSlave && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all" onClick={() => setActiveSlave(null)}>
          <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-2xl flex flex-col gap-4 relative border-t-2 border-t-blood-red" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveSlave(null)} className="absolute top-2 right-3 text-gray-500 hover:text-white text-sm font-bold transition-colors">
              ［關閉］
            </button>
            
            <div>
              <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                {activeSlave.name}
                <span className={`text-sm ${activeSlave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>
                  [{activeSlave.gender === 'Male' ? '男' : '女'}]
                </span>
              </h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-gray-400 bg-gray-950 px-2.5 py-0.5 rounded border border-gray-700">種族：{activeSlave.race}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded border ${activeSlave.activityStatus === '閒置' ? 'bg-gray-950 border-gray-700 text-gray-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-500 font-bold'}`}>
                  狀態：{activeSlave.activityStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm bg-gray-950 p-3 rounded border border-gray-800">
              <div className="flex flex-col gap-1.5 border-r border-gray-800 pr-3">
                <div className="text-xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-1">天賦屬性</div>
                <div className="flex justify-between"><span className="text-gray-500">武力:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.combat}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">體質:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.endurance}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">智力:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.intelligence}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">服從:</span> <span className={activeSlave.primaryStats.obedience < 20 ? 'text-red-400 font-bold' : 'text-gray-200 font-mono'}>{activeSlave.primaryStats.obedience}</span></div>
              </div>
              
              <div className="flex flex-col gap-1.5 pl-1">
                 <div className="text-xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-1">掌握技能</div>
                 <div className="flex justify-between"><span className="text-gray-500">戰鬥專精:</span> <span className="text-blue-400 font-mono font-bold">Lv.{activeSlave.skills?.combat || 1}</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">內政管家:</span> <span className="text-blue-400 font-mono font-bold">Lv.{activeSlave.skills?.housework || 1}</span></div>
                 <div className="flex justify-between"><span className="text-gray-500">生存本能:</span> <span className="text-blue-400 font-mono font-bold">Lv.{activeSlave.skills?.survival || 1}</span></div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pl-1 justify-center">
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>體力</span><span>{activeSlave.conditionStats.stamina}/100</span></div>
                  <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden"><div className="bg-green-500 h-full" style={{ width: `${activeSlave.conditionStats.stamina}%` }}></div></div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>壓力</span><span>{activeSlave.conditionStats.stress}/100</span></div>
                  <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden"><div className="bg-yellow-500 h-full" style={{ width: `${activeSlave.conditionStats.stress}%` }}></div></div>
                </div>
            </div>

            <div className="text-xs text-gray-400 italic bg-gray-950 p-2.5 rounded border-l border-blood-red bg-gray-950/40 leading-relaxed">
              檔案紀錄：{activeSlave.backgroundStory}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
