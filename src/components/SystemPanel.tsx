import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { supabase } from '../services/supabaseClient';
import localforage from 'localforage';

export default function SystemPanel() {
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const syncProfileToCloud = useGameStore((state) => state.syncProfileToCloud);
  const loadProfileFromCloud = useGameStore((state) => state.loadProfileFromCloud);
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);

  const isOpen = activeWindow === 'system';
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'cooldown'>('idle');

  const [dbIdentities, setDbIdentities] = useState<{id: string, name: string}[]>([]);
  const [isFetchingDb, setIsFetchingDb] = useState(false);
  const [showDb, setShowDb] = useState(false);

  const handleToggle = () => {
    setActiveWindow(isOpen ? null : 'system');
  };

  const handleManualSave = async () => {
    if (saveStatus !== 'idle') return;
    setSaveStatus('saving');
    
    await syncProfileToCloud();
    
    setSaveStatus('cooldown');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  const handleForceLoad = () => {
    setGlobalModal({
      title: '［⚠️ 系統急救：強制覆蓋警告］',
      message: '此操作將無視存檔保護鎖，直接從雲端下載最後一次成功的存檔並覆蓋本地進度。\n\n如果您目前遇到本地快取異常或畫面卡死，請使用此功能進行急救。\n\n確定要強制讀取雲端存檔嗎？',
      isConfirm: true,
      action: async () => {
        await loadProfileFromCloud();
        setActiveWindow(null);
        setGlobalModal({ title: '［系統］', message: '已強制從雲端載入並覆蓋本地存檔。', isConfirm: false });
      }
    });
  };

  const handleForceLogout = () => {
    setGlobalModal({
      title: '［⚠️ 徹底登出與清除快取］',
      message: '這將清除您裝置上的所有本地快取，並切斷深淵連線。\n若您未手動存檔，尚未同步的最新進度將會遺失。\n\n確定要執行嗎？',
      isConfirm: true,
      action: async () => {
        await supabase.auth.signOut();
        localStorage.clear(); 
        await localforage.clear();
        window.location.reload(); 
      }
    });
  };

  const fetchDbIdentities = async () => {
    setIsFetchingDb(true);
    const { data, error } = await supabase.from('global_identities').select('id, name');
    if (!error && data) {
      setDbIdentities(data);
      setShowDb(true);
    }
    setIsFetchingDb(false);
  };

  // ★ V2.9.3 安全化重構：清空本地 canConsume 記憶紀錄，實現無痛名字循環測試
  const handleClearDb = () => {
    setGlobalModal({
      title: '［🔄 除錯功能：重置本地已用名單］',
      message: '此操作將清空本地存檔中的「已抽取名字紀錄」。\n\n執行後，地下商隊將無阻礙地重新抓取您之前看過的名字。適合用來測試資料庫拉取流程，不會引發資料庫異常。確定要執行嗎？',
      isConfirm: true,
      action: async () => {
         useGameStore.setState(state => ({
           player: { ...state.player, usedIdentityIds: [] }
         }));
         await syncProfileToCloud();
         setDbIdentities([]);
         setGlobalModal({ title: '［系統］', message: '已用名單記憶已成功清除！市場將可重新拉取舊名單。', isConfirm: false });
      }
    });
  };

  return (
    <>
      <div className="fixed right-0 top-[45%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-400 py-3 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          <span>系</span>
          <span>統</span>
          <span>選</span>
          <span>單</span>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed right-0 top-0 h-full w-64 sm:w-72 bg-gray-950 border-l border-purple-900/50 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
             <span className="text-purple-400">⚙️</span> ［系統控制樞紐］
          </h3>
          <button 
            onClick={() => setActiveWindow(null)}
            className="text-gray-500 hover:text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-none pb-12">
          
          <div className="bg-gray-900/80 p-3 rounded-lg border border-gray-800 flex flex-col gap-2.5 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-gray-300 tracking-widest">資料同步</span>
              <span className="text-xs text-gray-500">將目前的進度手動強制上傳</span>
            </div>
            <button 
              onClick={handleManualSave}
              disabled={saveStatus !== 'idle'}
              className={`w-full py-2.5 rounded text-xs font-bold tracking-widest transition-all shadow border shrink-0 ${
                saveStatus === 'saving' ? 'bg-yellow-900/40 text-yellow-500 border-yellow-700 animate-pulse' :
                saveStatus === 'cooldown' ? 'bg-green-900/30 text-green-500 border-green-800' :
                'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-500 active:scale-95'
              }`}
            >
              {saveStatus === 'saving' ? '［同步中...］' : saveStatus === 'cooldown' ? '［已安全儲存］' : '［手動存檔］'}
            </button>
          </div>

          <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/30 flex flex-col gap-2.5 shadow-inner">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-red-400 tracking-widest">系統急救：強制覆蓋</span>
              <span className="text-xs text-red-500/70">強行拉取雲端存檔以修復異常</span>
            </div>
            <button 
              onClick={handleForceLoad}
              className="w-full py-2.5 bg-red-900/50 hover:bg-red-800 text-white border border-red-700 rounded text-xs font-bold tracking-widest transition-colors shadow shrink-0 active:scale-95"
            >
              ［拉取雲端］
            </button>
          </div>

          <div className="h-px bg-gray-800 my-1 w-full"></div>

          <div className="bg-purple-950/20 p-3 rounded-lg border border-purple-900/30 flex flex-col gap-2.5 shadow-inner mt-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-purple-400 tracking-widest flex items-center gap-1">
                <span>🚧</span> 開發者除錯模式
              </span>
              <span className="text-xs text-purple-500/70">遠端資料庫總覽與本地記憶清除</span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={fetchDbIdentities}
                disabled={isFetchingDb}
                className="flex-1 py-2 bg-purple-900/50 hover:bg-purple-800 border border-purple-700 text-purple-300 rounded text-xs font-bold tracking-widest transition-colors shadow shrink-0 active:scale-95"
              >
                {isFetchingDb ? '讀取中...' : '［查看全資料］'}
              </button>
              <button 
                onClick={handleClearDb}
                className="flex-1 py-2 bg-blood-red/40 hover:bg-blood-red/70 border border-red-900 text-red-400 rounded text-xs font-bold tracking-widest transition-colors shadow shrink-0 active:scale-95"
              >
                ［重置名單］
              </button>
            </div>

            {showDb && (
               <div className="max-h-48 overflow-y-auto bg-black/60 p-2.5 rounded border border-purple-900/50 text-xs font-mono flex flex-col gap-1.5 scrollbar-none mt-1">
                  {dbIdentities.length === 0 ? (
                    <span className="text-gray-500 text-center py-2">［資料庫目前為空］</span>
                  ) : (
                    dbIdentities.map(d => (
                       <div key={d.id} className="flex justify-between items-center border-b border-gray-800/80 pb-1.5 hover:bg-gray-900 px-1 rounded">
                          <span className="text-gray-300 font-bold max-w-[100px] truncate">{d.name}</span>
                          <span className="text-gray-600 text-[10px] truncate w-28 text-right">{d.id}</span>
                       </div>
                    ))
                  )}
               </div>
            )}
          </div>

          <div className="h-px bg-gray-800 my-1 w-full"></div>

          <div className="grid grid-cols-2 gap-2">
            <button disabled className="py-2.5 bg-gray-900/40 border border-gray-800/50 text-gray-600 rounded text-xs font-bold tracking-widest cursor-not-allowed">
              ［改版日誌］
            </button>
            <button disabled className="py-2.5 bg-gray-900/40 border border-gray-800/50 text-gray-600 rounded text-xs font-bold tracking-widest cursor-not-allowed">
              ［說明文件］
            </button>
            <button disabled className="py-2.5 bg-gray-900/40 border border-gray-800/50 text-gray-600 rounded text-xs font-bold tracking-widest cursor-not-allowed col-span-2">
              ［錯誤回報］
            </button>
            <button 
              onClick={handleForceLogout}
              className="py-2.5 mt-1 bg-gray-900 hover:bg-gray-800 border border-gray-600 text-gray-300 rounded text-xs font-bold tracking-widest transition-colors active:scale-95 shadow col-span-2"
            >
              ［登出與清除快取］
            </button>
          </div>
          
          <div className="text-center mt-auto pt-4 pb-2">
            <span className="text-gray-600 text-2xs tracking-widest font-mono">Dark Fantasy Trader v2.9.3</span>
          </div>
        </div>
      </div>
    </>
  );
}
