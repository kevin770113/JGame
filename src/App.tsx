import { useState, useEffect } from 'react';
import Header from './components/Header';
import BaseView from './views/BaseView';
import TownMainView from './views/TownMainView'; // ★ V2.9.8 新增街道場景
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView'; 
import DispatchView from './views/DispatchView'; 
import MapView from './views/MapView';
import InteractionView from './views/InteractionView';
import HousekeepingView from './views/HousekeepingView'; 
import ArenaView from './views/ArenaView';
import AbyssView from './views/AbyssView'; 
import LoginView from './views/LoginView';
import QuestPanel from './components/QuestPanel';
import SlavePanel from './components/SlavePanel'; 
import SystemPanel from './components/SystemPanel';
import CombatTheater from './components/CombatTheater';
import { useGameStore } from './store/useGameStore';
import { supabase } from './services/supabaseClient';
import { Slave } from './types';
import { ITEMS_DATA, getSlavePortraitUrl } from './utils/gameData';

const R2_BASE_URL = 'https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev';

// (保留既有 renderRadar)
const renderRadar = (slave: Slave) => {
  const getP = (val: number, angleIndex: number, maxR = 40) => {
     const angle = (angleIndex * 72 - 90) * (Math.PI / 180);
     const r = (Math.min(100, Math.max(0, val)) / 100) * maxR;
     return `${60 + r * Math.cos(angle)},${60 + r * Math.sin(angle)}`;
  };
  
  const stats = [
     slave.primaryStats.combat,
     slave.primaryStats.intelligence,
     slave.primaryStats.charisma ?? 10,
     slave.primaryStats.luck ?? 10,
     slave.primaryStats.endurance
  ];
  
  const statPoints = stats.map((val, i) => getP(val, i)).join(' ');
  const bg100 = [100,100,100,100,100].map((v,i) => getP(v,i)).join(' ');
  const bg75 = [75,75,75,75,75].map((v,i) => getP(v,i)).join(' ');
  const bg50 = [50,50,50,50,50].map((v,i) => getP(v,i)).join(' ');
  const bg25 = [25,25,25,25,25].map((v,i) => getP(v,i)).join(' ');

  return (
    <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center -ml-2">
       <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-md">
          <polygon points={bg100} fill="rgba(31, 41, 55, 0.4)" stroke="#4b5563" strokeWidth="1" />
          <polygon points={bg75} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
          <polygon points={bg50} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
          <polygon points={bg25} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
          
          <line x1="60" y1="60" x2={getP(100,0).split(',')[0]} y2={getP(100,0).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,1).split(',')[0]} y2={getP(100,1).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,2).split(',')[0]} y2={getP(100,2).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,3).split(',')[0]} y2={getP(100,3).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,4).split(',')[0]} y2={getP(100,4).split(',')[1]} stroke="#4b5563" strokeWidth="1" />

          <polygon points={statPoints} fill="rgba(139, 92, 246, 0.5)" stroke="#a855f7" strokeWidth="1.5" className="transition-all duration-700 ease-out" />

          <text x="60" y="14" fontSize="10" fill="#f87171" textAnchor="middle" fontWeight="bold">武力</text>
          <text x="110" y="52" fontSize="10" fill="#60a5fa" textAnchor="middle" fontWeight="bold">智力</text>
          <text x="96" y="112" fontSize="10" fill="#f472b6" textAnchor="middle" fontWeight="bold">魅力</text>
          <text x="24" y="112" fontSize="10" fill="#facc15" textAnchor="middle" fontWeight="bold">幸運</text>
          <text x="10" y="52" fontSize="10" fill="#4ade80" textAnchor="middle" fontWeight="bold">體質</text>
       </svg>
    </div>
  );
};

function App() {
  const currentScene = useGameStore((state) => state.currentScene);
  const currentSubView = useGameStore((state) => state.currentSubView);
  const location = useGameStore((state) => state.player.location);
  const navigate = useGameStore((state) => state.navigate);
  
  const triggerBackgroundMarketRefresh = useGameStore((state) => state.triggerBackgroundMarketRefresh);
  const loadProfileFromCloud = useGameStore((state) => state.loadProfileFromCloud);
  const _hasHydrated = useGameStore((state) => state._hasHydrated);

  const globalModal = useGameStore((state) => state.globalModal);
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);

  const [activeSlave, setActiveSlave] = useState<Slave | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [slaveTab, setSlaveTab] = useState<'ability' | 'status'>('ability');
  
  // ★ V2.9.8 競技小抽屜狀態
  const [showCombatDrawer, setShowCombatDrawer] = useState(false);

  useEffect(() => {
    if (activeSlave) setSlaveTab('ability');
  }, [activeSlave?.id]);

  useEffect(() => {
    if (!_hasHydrated) return;

    let mounted = true;
    let hasFiredInit = false; 

    const handleAuthAndSync = async (sessionData: any) => {
      if (hasFiredInit) return;
      hasFiredInit = true; 
      
      if (sessionData) {
        await loadProfileFromCloud();
        if (useGameStore.getState().marketSlaves.length === 0 && useGameStore.getState().localSaveVersion === 0) {
          triggerBackgroundMarketRefresh();
        }
      }
      if (mounted) setIsAuthChecking(false);
    };

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setSession(session);
        await handleAuthAndSync(session);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) setSession(session);
      if (session) {
        if (event === 'INITIAL_SESSION') {
          await handleAuthAndSync(session);
        } else {
          await loadProfileFromCloud();
          if (useGameStore.getState().marketSlaves.length === 0 && useGameStore.getState().localSaveVersion === 0) {
            triggerBackgroundMarketRefresh();
          }
        }
      } else {
        if (mounted) setIsAuthChecking(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [_hasHydrated, loadProfileFromCloud, triggerBackgroundMarketRefresh]);

  const getDynamicBackground = () => {
    const sceneKey = currentScene.toLowerCase();
    const locationKey = location.toLowerCase();
    return `${R2_BASE_URL}/bg-${sceneKey}-${locationKey}.webp`;
  };

  const renderMainStage = () => {
    if (currentScene === 'Home') {
      switch (currentSubView) {
        case 'Main': return <BaseView />;
        case 'Room': return <BreedingView />; 
        case 'Interaction': return <InteractionView />;
        case 'Map': return <MapView />;
        case 'Housekeeping': return <HousekeepingView />; 
        default: return <BaseView />;
      }
    } else {
      switch (currentSubView) {
        case 'TownMain': return <TownMainView />; // ★ V2.9.8 新增街道入口
        case 'Tavern': return <DispatchView />;
        case 'Arena': return <ArenaView />; 
        case 'Abyss': return <AbyssView />; 
        case 'Market':
        case 'Main': 
        default: 
          return <MarketView />;
      }
    }
  };

  // ★ V2.9.8 底部全域導航列淨化 (移除 Emoji、安全高度防擋)
  const renderBottomNav = () => {
    if (currentScene === 'Home') {
      return (
        <div className="fixed bottom-0 left-0 right-0 h-16 sm:h-18 pb-safe pt-1 bg-gray-950 border-t border-gray-800 flex items-center justify-around px-1 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('Home', 'Interaction')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Interaction' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">互動</span></button>
          <button onClick={() => navigate('Home', 'Room')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Room' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">育成</span></button>
          <button onClick={() => navigate('Home', 'Map')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Map' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">遷移</span></button>
          <button onClick={() => navigate('Home', 'Housekeeping')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Housekeeping' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">家政</span></button>
          <button onClick={() => navigate('Town', 'TownMain')} className="flex flex-col items-center justify-center w-1/5 h-full text-blood-red/80 hover:text-blood-red transition-colors"><span className="text-xs tracking-widest font-bold">外出</span></button>
        </div>
      );
    } else {
      return (
        <div className="fixed bottom-0 left-0 right-0 h-16 sm:h-18 pb-safe pt-1 bg-gray-950 border-t border-gray-800 flex items-center justify-around px-1 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
          <button onClick={() => navigate('Town', 'TownMain')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'TownMain' || currentSubView === 'Main' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">街道</span></button>
          <button onClick={() => navigate('Town', 'Market')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Market' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">市集</span></button>
          <button onClick={() => navigate('Town', 'Tavern')} className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Tavern' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">酒館</span></button>
          <button onClick={() => {
              if (location === 'Capital') {
                setShowCombatDrawer(true);
              } else {
                navigate('Town', 'Arena');
              }
            }} 
            className={`flex flex-col items-center justify-center w-1/5 h-full transition-colors ${currentSubView === 'Arena' || currentSubView === 'Abyss' ? 'text-purple-400 font-bold' : 'text-gray-500 hover:text-gray-400'}`}><span className="text-xs tracking-widest">競技</span></button>
          <button onClick={() => navigate('Home', 'Main')} className={`flex flex-col items-center justify-center w-1/5 h-full text-blood-red/80 hover:text-blood-red transition-colors`}><span className="text-xs tracking-widest font-bold">返回</span></button>
        </div>
      );
    }
  };

  if (!_hasHydrated) return <div className="w-full h-screen bg-dark-bg flex items-center justify-center text-gray-600 font-bold tracking-widest animate-pulse">［讀取本地記憶中...］</div>;
  if (isAuthChecking) return <div className="w-full h-screen bg-dark-bg flex items-center justify-center text-gray-400 font-bold tracking-widest animate-pulse">［連線深淵印記中...］</div>;
  if (!session) return <LoginView />;

  return (
    <div className="absolute inset-0 flex flex-col bg-dark-bg text-gray-200 overflow-hidden select-none transition-all duration-700" style={{backgroundImage: `url(${getDynamicBackground()})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
      <div className="absolute inset-0 bg-black/70 z-0 pointer-events-none"></div>
      
      <div className="shrink-0 z-20 shadow-md bg-gray-900 relative"><Header /></div>
      
      <SystemPanel /> 
      <QuestPanel />
      <SlavePanel onSelectSlave={setActiveSlave} />
      <CombatTheater /> 

      <div className="flex-1 flex overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 overscroll-contain pb-28 sm:pb-32">
          <div className={`w-full transition-all duration-300 ${currentScene === 'Town' ? 'max-w-3xl' : 'max-w-lg'}`}>{renderMainStage()}</div>
        </main>
      </div>

      {renderBottomNav()}

      {/* ★ V2.9.8 競技多功能小抽屜 */}
      {showCombatDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowCombatDrawer(false)}></div>
          <div className="relative bg-gray-950 border-t-2 border-purple-900 rounded-t-2xl p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex flex-col gap-4 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.9)] z-50">
             <h3 className="text-gray-500 font-bold tracking-widest text-xs mb-1 text-center">［選擇競技場域］</h3>
             <button onClick={() => { setShowCombatDrawer(false); navigate('Town', 'Arena'); }} className="py-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-gray-300 font-bold tracking-widest transition-colors shadow">血腥角鬥場</button>
             {location === 'Capital' && (
               <button onClick={() => { setShowCombatDrawer(false); navigate('Town', 'Abyss'); }} className="py-4 bg-purple-950 hover:bg-purple-900 border border-purple-800 rounded-xl text-purple-400 font-bold tracking-widest transition-colors shadow">深淵之塔</button>
             )}
          </div>
        </div>
      )}

      {activeSlave && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-[60] transition-all animate-fade-in" onClick={() => setActiveSlave(null)}>
          <div className="w-full max-w-3xl bg-gray-900/95 border border-gray-700 rounded-lg p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row gap-5 relative border-t-2 border-t-blood-red backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveSlave(null)} className="absolute top-0 right-0 z-[70] text-gray-400 hover:text-white text-sm font-bold transition-colors bg-red-950/80 hover:bg-red-900/90 rounded-bl-xl px-4 py-2 shadow-md border-b border-l border-red-900">［關閉］</button>
            
            <div className="w-full sm:w-2/5 bg-gray-950 border border-gray-800 rounded flex flex-col items-center justify-center min-h-[220px] sm:min-h-[420px] relative overflow-hidden group shrink-0">
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-0">
                <span className="text-gray-700 text-3xl opacity-30">⛓️</span>
              </div>
              
              <img 
                src={getSlavePortraitUrl(activeSlave)} 
                alt={activeSlave.name} 
                className="absolute inset-0 w-full h-full object-cover object-[center_15%] z-0 animate-fade-in"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-gray-800/10 group-hover:bg-gray-800/30 transition-colors z-20 pointer-events-none"></div>
            </div>
            
            <div className="w-full sm:w-3/5 flex flex-col gap-2 overflow-y-hidden max-h-[60vh] sm:max-h-[75vh]">
              
              <div className="shrink-0 flex flex-col gap-1.5 pb-2">
                <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  {activeSlave.name}
                  <span className={`text-sm ${activeSlave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>[{activeSlave.gender === 'Male' ? '男' : '女'}]</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-300 bg-gray-950 px-2 py-0.5 rounded border border-gray-700 shadow-sm">種族：{activeSlave.race}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border shadow-sm ${activeSlave.activityStatus === '閒置' ? 'bg-gray-950 border-gray-700 text-gray-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-500 font-bold'}`}>狀態：{activeSlave.activityStatus}</span>
                  
                  {activeSlave.role === 'maid' && <span className="text-xs px-2 py-0.5 bg-blue-900/30 border border-blue-700 text-blue-400 font-bold rounded shadow-sm">職位：管家</span>}
                  {activeSlave.role === 'security' && <span className="text-xs px-2 py-0.5 bg-purple-900/30 border border-purple-700 text-purple-400 font-bold rounded shadow-sm">職位：守衛</span>}
                  {(activeSlave.faintTurns || 0) > 0 && <span className="text-xs px-2 py-0.5 bg-gray-800 border border-gray-500 text-gray-300 font-extrabold rounded shadow-sm">昏厥 ({activeSlave.faintTurns} 回合)</span>}
                  {activeSlave.isInjured && <span className="text-xs px-2 py-0.5 bg-red-950 border border-red-700 text-red-400 font-extrabold rounded animate-pulse shadow-sm">負傷</span>}
                </div>
              </div>

              <div className="flex border-b border-gray-800 shrink-0">
                <button onClick={() => setSlaveTab('ability')} className={`flex-1 py-2 text-xs font-bold tracking-widest transition-colors ${slaveTab === 'ability' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-900/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>［戰鬥能力］</button>
                <button onClick={() => setSlaveTab('status')} className={`flex-1 py-2 text-xs font-bold tracking-widest transition-colors ${slaveTab === 'status' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}>［綜合狀態］</button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-none pb-2 mt-2">
                
                {slaveTab === 'ability' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex flex-row items-center gap-3 bg-gray-950/60 p-2 sm:p-3 rounded border border-gray-800/80 shadow-inner">
                       {renderRadar(activeSlave)}
                       
                       <div className="flex-1 flex flex-col gap-1.5 text-xs">
                          <div className="flex justify-between items-center bg-gray-900/80 px-2 py-1.5 rounded border border-gray-800">
                             <span className="text-gray-500 font-bold">武力:</span>
                             {activeSlave.isInjured ? 
                                <span><span className="text-red-500 font-mono font-bold">{Math.floor(activeSlave.primaryStats.combat * 0.5)}</span> <span className="text-gray-600 text-3xs font-mono">(原:{activeSlave.primaryStats.combat})</span></span> 
                                : <span className="text-red-400 font-mono font-bold">{activeSlave.primaryStats.combat}</span>}
                          </div>
                          <div className="flex justify-between items-center bg-gray-900/80 px-2 py-1.5 rounded border border-gray-800">
                             <span className="text-gray-500 font-bold">體質:</span>
                             {activeSlave.isInjured ? 
                                <span><span className="text-red-500 font-mono font-bold">{Math.floor(activeSlave.primaryStats.endurance * 0.5)}</span> <span className="text-gray-600 text-3xs font-mono">(原:{activeSlave.primaryStats.endurance})</span></span> 
                                : <span className="text-green-400 font-mono font-bold">{activeSlave.primaryStats.endurance}</span>}
                          </div>
                          <div className="flex justify-between items-center bg-gray-900/80 px-2 py-1.5 rounded border border-gray-800">
                             <span className="text-gray-500 font-bold">智力:</span>
                             {activeSlave.isInjured ? 
                                <span><span className="text-red-500 font-mono font-bold">{Math.floor(activeSlave.primaryStats.intelligence * 0.5)}</span> <span className="text-gray-600 text-3xs font-mono">(原:{activeSlave.primaryStats.intelligence})</span></span> 
                                : <span className="text-blue-400 font-mono font-bold">{activeSlave.primaryStats.intelligence}</span>}
                          </div>
                          <div className="flex justify-between items-center bg-gray-900/80 px-2 py-1.5 rounded border border-gray-800">
                             <span className="text-gray-500 font-bold">魅力:</span>
                             <span className="text-pink-400 font-mono font-bold">{activeSlave.primaryStats.charisma ?? 10}</span>
                          </div>
                          <div className="flex justify-between items-center bg-gray-900/80 px-2 py-1.5 rounded border border-gray-800">
                             <span className="text-gray-500 font-bold">幸運:</span>
                             <span className="text-yellow-400 font-mono font-bold">{activeSlave.primaryStats.luck ?? 10}</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="text-xs text-gray-400 font-bold tracking-widest border-b border-gray-800 pb-1">［掌握技能］</div>
                       <div className="grid grid-cols-3 gap-2">
                          <div className="bg-gradient-to-r from-blue-950 to-transparent border-l-2 border-blue-600 px-2 py-1.5 rounded-r">
                             <div className="text-3xs text-gray-500">戰鬥專精</div>
                             {activeSlave.isInjured ? 
                                <div className="text-red-500 font-mono font-bold text-xs">Lv.{Math.floor((activeSlave.skills?.combat || 1) * 0.5)}</div>
                                : <div className="text-blue-400 font-mono font-bold text-xs">Lv.{activeSlave.skills?.combat || 1}</div>}
                          </div>
                          <div className="bg-gradient-to-r from-green-950 to-transparent border-l-2 border-green-600 px-2 py-1.5 rounded-r">
                             <div className="text-3xs text-gray-500">內政管家</div>
                             {activeSlave.isInjured ? 
                                <div className="text-red-500 font-mono font-bold text-xs">Lv.{Math.floor((activeSlave.skills?.housework || 1) * 0.5)}</div>
                                : <div className="text-green-400 font-mono font-bold text-xs">Lv.{activeSlave.skills?.housework || 1}</div>}
                          </div>
                          <div className="bg-gradient-to-r from-yellow-950 to-transparent border-l-2 border-yellow-600 px-2 py-1.5 rounded-r">
                             <div className="text-3xs text-gray-500">生存本能</div>
                             {activeSlave.isInjured ? 
                                <div className="text-red-500 font-mono font-bold text-xs">Lv.{Math.floor((activeSlave.skills?.survival || 1) * 0.5)}</div>
                                : <div className="text-yellow-400 font-mono font-bold text-xs">Lv.{activeSlave.skills?.survival || 1}</div>}
                          </div>
                       </div>
                       
                       <div className="text-xs text-gray-400 font-bold tracking-widest border-b border-gray-800 pb-1 mt-2">［血脈被動］</div>
                       <div className="bg-gradient-to-r from-purple-950/50 to-transparent border-l-2 border-purple-500 px-3 py-2 rounded-r shadow-sm border border-gray-800 border-l-0">
                          <span className="text-yellow-500 text-xs leading-relaxed font-bold">
                            {activeSlave.race === '人類' && '【絕境意志】血量低於 40% 時爆發，武力提升 25%。'}
                            {activeSlave.race === '精靈' && '【風之眷顧】速度提升 20%，若取得先手則首擊傷害增加 15%。'}
                            {activeSlave.race === '半獸人' && '【狂熱戰血】武力提升 15%，防禦降低 10%。受擊疊加印記，最高增傷 30%。'}
                            {activeSlave.race === '矮人' && '【堅岩體魄】最大血量提升 20%，防禦提升 15%。受擊固定減免 5 點傷害。'}
                            {activeSlave.race === '龍族' && '【真龍威壓】武力、防禦、速度全面提升 10%，自帶 20% 最終傷害減免。'}
                            {activeSlave.race === '不死族' && '【枯骨不朽】每次攻擊造成傷害時，將吸收 15% 轉化為自身生命力。'}
                          </span>
                       </div>
                    </div>
                  </div>
                )}

                {slaveTab === 'status' && (
                  <div className="flex flex-col gap-4 animate-fade-in relative overflow-hidden">
                    {(activeSlave.faintTurns || 0) > 0 && <div className="absolute inset-0 bg-gray-950/60 z-10 pointer-events-none rounded"></div>}
                    
                    <div className="flex flex-col gap-3 bg-gray-950 p-4 rounded-lg border border-gray-800 shadow-inner z-20">
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-400 font-bold">
                             <span className="tracking-widest">體力 (Stamina)</span>
                             <span className="font-mono text-green-400">{activeSlave.conditionStats.stamina}/100</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-900 rounded overflow-hidden border border-gray-800">
                             <div className="bg-green-600 h-full shadow-[0_0_10px_rgba(22,163,74,0.5)] transition-all" style={{ width: `${activeSlave.conditionStats.stamina}%` }}></div>
                          </div>
                       </div>
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-400 font-bold">
                             <span className="tracking-widest">壓力 (Stress)</span>
                             <span className="font-mono text-yellow-500">{activeSlave.conditionStats.stress}/100</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-900 rounded overflow-hidden border border-gray-800">
                             <div className="bg-yellow-600 h-full shadow-[0_0_10px_rgba(202,138,4,0.5)] transition-all" style={{ width: `${activeSlave.conditionStats.stress}%` }}></div>
                          </div>
                       </div>
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs text-gray-400 font-bold">
                             <span className="tracking-widest">反抗 (Rebellion)</span>
                             <span className="font-mono text-red-500">{activeSlave.conditionStats.rebellion}/100</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-900 rounded overflow-hidden border border-gray-800">
                             <div className="bg-blood-red h-full shadow-[0_0_10px_rgba(220,38,38,0.5)] transition-all" style={{ width: `${activeSlave.conditionStats.rebellion}%` }}></div>
                          </div>
                       </div>
                       <div className="flex flex-col gap-1 mt-1 pt-3 border-t border-gray-800/50">
                          <div className="flex justify-between text-xs text-gray-400 font-bold">
                             <span className="tracking-widest">服從度 (Obedience)</span>
                             <span className={activeSlave.primaryStats.obedience < 20 ? 'text-red-400 font-bold font-mono' : 'text-blue-400 font-mono'}>{activeSlave.primaryStats.obedience}/100</span>
                          </div>
                          <div className="w-full h-2.5 bg-gray-900 rounded overflow-hidden border border-gray-800">
                             <div className="bg-blue-600 h-full shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all" style={{ width: `${activeSlave.primaryStats.obedience}%` }}></div>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 z-20">
                       <div className="bg-gradient-to-t from-gray-900 to-gray-950 p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-gray-500 font-bold tracking-widest mb-1">［當前武裝］</span>
                          <span className="text-blue-400 text-xs font-bold leading-relaxed whitespace-pre-wrap">
                             {activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId] 
                               ? `【${ITEMS_DATA[activeSlave.equipment.weaponId].name}】\n${ITEMS_DATA[activeSlave.equipment.weaponId].desc}`
                               : '［無配戴武器］'}
                          </span>
                       </div>
                       <div className="bg-gradient-to-t from-gray-900 to-gray-950 p-3 rounded border border-gray-800 flex flex-col gap-1 shadow-sm">
                          <span className="text-xs text-gray-500 font-bold tracking-widest mb-1 border-b border-gray-800 pb-1">［戰鬥履歷］</span>
                          <div className="flex items-center justify-around text-sm mt-1">
                             <div className="flex flex-col items-center"><span className="text-3xs text-gray-500">勝場</span><span className="text-green-400 font-mono font-black text-lg">{activeSlave.combatRecord?.wins || 0}</span></div>
                             <span className="text-gray-700 text-xl font-thin">/</span>
                             <div className="flex flex-col items-center"><span className="text-3xs text-gray-500">敗場</span><span className="text-red-400 font-mono font-black text-lg">{activeSlave.combatRecord?.losses || 0}</span></div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {globalModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-gray-900 border-t-2 border-blood-red rounded-lg p-5 max-w-sm w-full shadow-2xl border-x border-b border-gray-700 relative">
            <h3 className={`text-lg font-bold tracking-widest flex items-center gap-2 mb-2 ${globalModal.title.includes('警告') || globalModal.title.includes('錯誤') || globalModal.title.includes('急救') ? 'text-red-500' : 'text-yellow-500'}`}>
              {globalModal.title}
            </h3>
            
            <div className="text-sm text-gray-300 leading-relaxed mb-6 bg-gray-950 p-4 rounded border border-gray-800 whitespace-pre-wrap shadow-inner overflow-y-auto max-h-[50vh]">
              {globalModal.message.split('\n').map((line, index) => {
                if (!line.trim()) return <br key={index} />;
                let lineClass = "mb-1";
                if (/(大捷|捷報|成功|平安歸隊)/.test(line)) {
                  lineClass = "text-green-400 font-bold mb-1";
                } else if (/(慘敗|重傷|越獄|過勞)/.test(line)) {
                  lineClass = "text-red-500 animate-pulse font-bold mb-1";
                }
                return <div key={index} className={lineClass}>{line}</div>;
              })}
            </div>
            
            <div className="flex gap-3">
              {globalModal.isConfirm && (
                <button 
                  onClick={() => setGlobalModal(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded border border-gray-600 transition-colors text-sm tracking-widest shadow"
                >
                  ［取消］
                </button>
              )}
              <button 
                onClick={() => {
                  if (globalModal.action) globalModal.action();
                  setGlobalModal(null);
                }}
                className={`flex-1 py-2.5 font-bold rounded border transition-colors text-sm tracking-widest shadow ${globalModal.isConfirm ? 'bg-blood-red/80 hover:bg-blood-red text-white border-red-900' : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500'}`}
              >
                {globalModal.isConfirm ? '［確認執行］' : '［確認］'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
