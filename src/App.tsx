import { useState, useEffect } from 'react';
import Header from './components/Header';
import BaseView from './views/BaseView';
import MarketView from './views/MarketView';
import BreedingView from './views/BreedingView'; 
import DispatchView from './views/DispatchView'; 
import MapView from './views/MapView';
import InteractionView from './views/InteractionView';
import ArenaView from './views/ArenaView';
import AbyssView from './views/AbyssView'; 
import LoginView from './views/LoginView';
import QuestPanel from './components/QuestPanel';
import { useGameStore } from './store/useGameStore';
import { supabase } from './services/supabaseClient';
import { Slave } from './types';
import { ITEMS_DATA } from './utils/gameData'; // ★ 引入裝備靜態資料庫

const R2_BASE_URL = 'https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev';

function App() {
  const currentScene = useGameStore((state) => state.currentScene);
  const currentSubView = useGameStore((state) => state.currentSubView);
  const location = useGameStore((state) => state.player.location);
  const navigate = useGameStore((state) => state.navigate);
  
  const slaves = useGameStore((state) => state.slaves);
  const triggerBackgroundMarketRefresh = useGameStore((state) => state.triggerBackgroundMarketRefresh);
  const loadProfileFromCloud = useGameStore((state) => state.loadProfileFromCloud);

  const globalModal = useGameStore((state) => state.globalModal);
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);

  const [activeSlave, setActiveSlave] = useState<Slave | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setSession(session);
      if (session) {
        await loadProfileFromCloud();
        if (useGameStore.getState().marketSlaves.length === 0) triggerBackgroundMarketRefresh();
      }
      if (mounted) setIsAuthChecking(false);
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        await loadProfileFromCloud();
        if (useGameStore.getState().marketSlaves.length === 0) triggerBackgroundMarketRefresh();
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [triggerBackgroundMarketRefresh, loadProfileFromCloud]);

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
        default: return <BaseView />;
      }
    } else {
      switch (currentSubView) {
        case 'Main':
          return (
            <div className="w-full min-h-[75vh] flex flex-col justify-between pb-10 animate-fade-in">
              <div className="border-b border-gray-700 pb-2 bg-gray-950/70 p-3 rounded backdrop-blur-xs">
                <h2 className="text-xl font-bold text-gray-300">城鎮市集</h2>
                <p className="text-xs text-gray-500 mt-1">喧鬧的灰色地帶，充斥著酒精、金錢與血統的地下交易。</p>
              </div>
              <div className="flex-1"></div>
              <div className="flex flex-col gap-3 bg-gray-950/50 p-3 rounded backdrop-blur-xs">
                <button onClick={() => navigate('Town', 'Market')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98 group"><span className="flex items-center gap-2 text-gray-300 group-hover:text-white tracking-widest">［訪問地下商隊］</span><span className="text-xs text-gray-500 font-normal">引進與變現血統資產</span></button>
                <button onClick={() => navigate('Town', 'Tavern')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98 group"><span className="flex items-center gap-2 text-gray-300 group-hover:text-white tracking-widest">［前往深淵酒館］</span><span className="text-xs text-gray-500 font-normal">查閱地區懸賞與傳說委託</span></button>
                <button onClick={() => navigate('Town', 'Arena')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98 group"><span className="flex items-center gap-2 text-gray-300 group-hover:text-white tracking-widest">［前往角鬥場］</span><span className="text-xs text-gray-500 font-normal">參與血腥競技與死鬥</span></button>
                
                {location === 'Capital' && (
                  <button onClick={() => navigate('Town', 'Abyss')} className="py-4 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-800/50 rounded-lg font-bold text-left px-6 flex justify-between items-center transition-all shadow active:scale-98 group mt-1">
                     <span className="flex items-center gap-2 text-purple-400 group-hover:text-purple-300 tracking-widest">［挑戰深淵之塔］</span>
                     <span className="text-xs text-purple-600 font-normal">無盡階梯與古代英靈</span>
                  </button>
                )}

                <button onClick={() => navigate('Home', 'Main')} className="py-3 bg-blood-red/20 hover:bg-blood-red/30 border border-blood-red/50 text-red-400 font-bold rounded-lg text-center transition-colors shadow mt-2 tracking-widest">［返回安全據點］</button>
              </div>
            </div>
          );
        case 'Market': return <MarketView />;
        case 'Tavern': return <DispatchView />;
        case 'Arena': return <ArenaView />; 
        case 'Abyss': return <AbyssView />; 
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

  if (isAuthChecking) return <div className="w-full h-screen bg-dark-bg flex items-center justify-center text-gray-500 font-bold tracking-widest animate-pulse">［連線深淵印記中...］</div>;
  if (!session) return <LoginView />;

  return (
    <div className="absolute inset-0 flex flex-col bg-dark-bg text-gray-200 overflow-hidden select-none transition-all duration-700" style={{backgroundImage: `url(${getDynamicBackground()})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
      
      <div className="shrink-0 z-20 shadow-md bg-gray-900 relative"><Header /></div>
      <QuestPanel />

      <div className="flex-1 flex overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center z-10 overscroll-contain">
          <div className={`w-full transition-all duration-300 ${currentScene === 'Town' ? 'max-w-3xl' : 'max-w-lg'}`}>{renderMainStage()}</div>
        </main>

        {currentScene === 'Home' && (
          <aside className="w-24 border-l border-gray-800 flex flex-col bg-gray-950/60 backdrop-blur-xs overflow-y-auto shrink-0 animate-fade-in">
            <div className="p-2 border-b border-gray-800 text-center bg-gray-900/40"><span className="text-2xs font-bold text-gray-500 tracking-wider">基地成員</span></div>
            <div className="flex flex-col p-1 gap-1.5">
              {slaves.map((slave) => (
                <button key={slave.id} onClick={() => setActiveSlave(slave)} className="w-full bg-gray-800/50 hover:bg-gray-700/80 border border-gray-700/50 rounded p-1.5 text-left flex flex-col gap-1 relative active:scale-95 transition-all shadow-sm group">
                  <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${getHealthStatusColor(slave)} shadow-sm`} />
                  <div className={`w-7 h-7 bg-gray-950 rounded border ${slave.activityStatus !== '閒置' ? 'border-yellow-600 text-yellow-600' : 'border-gray-600 text-gray-400'} flex items-center justify-center text-xs font-mono font-bold group-hover:border-blood-red transition-colors`}>{slave.race[0]}</div>
                  <div className="truncate text-2xs font-bold text-gray-300 w-full flex items-center justify-between gap-0.5"><span className="truncate flex-1">{slave.name}</span><span className={`font-sans font-bold ${slave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>{slave.gender === 'Male' ? '男' : '女'}</span></div>
                  {slave.activityStatus !== '閒置' && <div className="text-3xs text-yellow-500 font-bold bg-yellow-900/30 text-center rounded">{slave.activityStatus}</div>}
                </button>
              ))}
              {slaves.length === 0 && <div className="text-3xs text-gray-600 text-center py-6">空無一人</div>}
            </div>
          </aside>
        )}
      </div>

      {activeSlave && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-all animate-fade-in" onClick={() => setActiveSlave(null)}>
          <div className="w-full max-w-2xl bg-gray-900/95 border border-gray-700 rounded-lg p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row gap-5 relative border-t-2 border-t-blood-red backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveSlave(null)} className="absolute top-2 right-3 text-gray-500 hover:text-white text-sm font-bold transition-colors z-20">［關閉］</button>
            <div className="w-full sm:w-1/3 bg-gray-950 border border-gray-800 rounded flex flex-col items-center justify-center min-h-[200px] sm:min-h-[400px] relative overflow-hidden group"><div className="absolute inset-0 bg-gray-800/10 group-hover:bg-gray-800/30 transition-colors"></div><span className="text-gray-600 text-xs italic tracking-widest z-10">［立繪預留區］</span></div>
            <div className="w-full sm:w-2/3 flex flex-col gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">{activeSlave.name}<span className={`text-sm ${activeSlave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}`}>[{activeSlave.gender === 'Male' ? '男' : '女'}]</span></h3>
                <div className="flex gap-2 mt-1.5"><span className="text-xs text-gray-400 bg-gray-950 px-2.5 py-0.5 rounded border border-gray-700">種族：{activeSlave.race}</span><span className={`text-xs px-2.5 py-0.5 rounded border ${activeSlave.activityStatus === '閒置' ? 'bg-gray-950 border-gray-700 text-gray-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-500 font-bold'}`}>狀態：{activeSlave.activityStatus}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-950 p-3 rounded border border-gray-800">
                <div className="flex flex-col gap-1.5 border-r border-gray-800 pr-3"><div className="text-xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-1 tracking-widest">［天賦屬性］</div><div className="flex justify-between"><span className="text-gray-500">武力:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.combat}</span></div><div className="flex justify-between"><span className="text-gray-500">體質:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.endurance}</span></div><div className="flex justify-between"><span className="text-gray-500">智力:</span> <span className="text-gray-200 font-mono font-bold">{activeSlave.primaryStats.intelligence}</span></div><div className="flex justify-between"><span className="text-gray-500">服從:</span> <span className={activeSlave.primaryStats.obedience < 20 ? 'text-red-400 font-bold' : 'text-gray-200 font-mono'}>{activeSlave.primaryStats.obedience}</span></div></div>
                <div className="flex flex-col gap-1.5 pl-1"><div className="text-xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-1 tracking-widest">［掌握技能］</div><div className="flex justify-between"><span className="text-gray-500">戰鬥:</span> <span className="text-blue-400 font-mono font-bold">Lv.{activeSlave.skills?.combat || 1}</span></div><div className="flex justify-between"><span className="text-gray-500">管家:</span> <span className="text-blue-400 font-mono font-bold">Lv.{activeSlave.skills?.housework || 1}</span></div><div className="flex justify-between"><span className="text-gray-500">生存:</span> <span className="text-blue-400 font-mono font-bold">Lv.{activeSlave.skills?.survival || 1}</span></div></div>
              </div>
              
              {/* ★ 新增：血脈被動與當前武裝面板 */}
              <div className="flex flex-col gap-2 bg-gray-950 p-3 rounded border border-gray-800 text-sm shadow-inner">
                <div className="flex flex-col gap-1 border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-500 font-bold tracking-widest">［血脈被動］</span>
                  <span className="text-yellow-500 text-xs leading-relaxed font-bold">
                    {activeSlave.race === '人類' && '【絕境意志】血量低於 40% 時爆發，武力提升 25%。'}
                    {activeSlave.race === '精靈' && '【風之眷顧】速度提升 20%，若取得先手則首擊傷害增加 15%。'}
                    {activeSlave.race === '半獸人' && '【狂熱戰血】武力提升 15%，防禦降低 10%。受擊疊加印記，最高增傷 30%。'}
                    {activeSlave.race === '矮人' && '【堅岩體魄】最大血量提升 20%，防禦提升 15%。受擊固定減免 5 點傷害。'}
                    {activeSlave.race === '龍族' && '【真龍威壓】武力、防禦、速度全面提升 10%，自帶 20% 最終傷害減免。'}
                    {activeSlave.race === '不死族' && '【枯骨不朽】每次攻擊造成傷害時，將吸收 15% 轉化為自身生命力。'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-xs text-gray-500 font-bold tracking-widest">［當前武裝］</span>
                  <span className="text-blue-400 text-xs font-bold">
                    {activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId] 
                      ? `【${ITEMS_DATA[activeSlave.equipment.weaponId].name}】 ${ITEMS_DATA[activeSlave.equipment.weaponId].desc}`
                      : '［無配戴武器］'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5"><div className="flex justify-between text-3xs text-gray-500 font-bold"><span>體力</span><span className="font-mono">{activeSlave.conditionStats.stamina}/100</span></div><div className="w-full h-1.5 bg-gray-950 rounded overflow-hidden border border-gray-800"><div className="bg-green-600 h-full" style={{ width: `${activeSlave.conditionStats.stamina}%` }}></div></div></div>
                  <div className="flex flex-col gap-0.5"><div className="flex justify-between text-3xs text-gray-500 font-bold"><span>壓力</span><span className="font-mono">{activeSlave.conditionStats.stress}/100</span></div><div className="w-full h-1.5 bg-gray-950 rounded overflow-hidden border border-gray-800"><div className="bg-yellow-600 h-full" style={{ width: `${activeSlave.conditionStats.stress}%` }}></div></div></div>
                  <div className="flex flex-col gap-0.5"><div className="flex justify-between text-3xs text-gray-500 font-bold"><span>反抗</span><span className="font-mono">{activeSlave.conditionStats.rebellion}/100</span></div><div className="w-full h-1.5 bg-gray-950 rounded overflow-hidden border border-gray-800"><div className="bg-blood-red h-full" style={{ width: `${activeSlave.conditionStats.rebellion}%` }}></div></div></div>
              </div>
              <div className="text-xs text-gray-400 italic bg-gray-950 p-3 rounded border-l-2 border-blood-red bg-gray-950/40 leading-relaxed overflow-y-auto max-h-32">［檔案紀錄］{activeSlave.backgroundStory}</div>
            </div>
          </div>
        </div>
      )}

      {globalModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-gray-900 border-t-2 border-blood-red rounded-lg p-5 max-w-sm w-full shadow-2xl border-x border-b border-gray-700 relative">
            <h3 className={`text-lg font-bold tracking-widest flex items-center gap-2 mb-2 ${globalModal.title.includes('警告') || globalModal.title.includes('錯誤') || globalModal.title.includes('拒絕') ? 'text-red-500' : 'text-yellow-500'}`}>
              {globalModal.title}
            </h3>
            <div className="text-sm text-gray-300 leading-relaxed mb-6 bg-gray-950 p-4 rounded border border-gray-800 whitespace-pre-wrap shadow-inner">
              {globalModal.message}
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
