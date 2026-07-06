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

  return (
    <>
      {/* 呼出按鈕：放置在右側，位於名單抽屜下方 */}
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

      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      {/* 右側滑出抽屜本體 */}
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

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-none">
          
          {/* 原功能還原：手動存檔 */}
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

          {/* 原功能還原：急救覆蓋 */}
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

          {/* 原功能還原：四格按鈕，並優化適應側邊欄寬度 */}
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
            <span className="text-gray-600 text-2xs tracking-widest font-mono">Dark Fantasy Trader v2.9.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
