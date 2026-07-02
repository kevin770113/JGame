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
      {/* 頂部隱藏邊緣觸發器 */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-x border-b border-gray-600 text-gray-400 px-6 py-1 rounded-b-xl shadow-lg font-bold text-xs tracking-widest transition-colors hover:bg-gray-800 hover:text-white flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="text-gray-500">▼</span> 系統選單 <span className="text-gray-500">▼</span>
        </button>
      </div>

      {/* 互斥暗色背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      {/* 由上往下滑出的抽屜 */}
      <div 
        className={`fixed top-0 left-0 w-full bg-gray-950 border-b-2 border-purple-900/50 shadow-2xl z-50 flex flex-col items-center transform transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="w-full max-w-md p-5 flex flex-col gap-4 pb-6">
          <div className="flex justify-between items-center border-b border-gray-800 pb-3">
            <h3 className="text-base font-bold text-gray-200 tracking-widest flex items-center gap-2">
              <span className="text-purple-400">⚙️</span> ［系統控制樞紐］
            </h3>
            <button 
              onClick={() => setActiveWindow(null)}
              className="text-gray-500 hover:text-white text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* 1. 手動存檔 */}
            <div className="bg-gray-900/80 p-3 rounded border border-gray-800 flex justify-between items-center shadow-inner">
              <div className="flex flex-col gap-1 pr-2">
                <span className="text-sm font-bold text-gray-300">資料同步</span>
                <span className="text-xs text-gray-500">將目前的最新進度強制上傳至深淵伺服器</span>
              </div>
              <button 
                onClick={handleManualSave}
                disabled={saveStatus !== 'idle'}
                className={`px-4 py-2.5 rounded text-xs font-bold tracking-widest transition-all shadow border shrink-0 ${
                  saveStatus === 'saving' ? 'bg-yellow-900/40 text-yellow-500 border-yellow-700 animate-pulse' :
                  saveStatus === 'cooldown' ? 'bg-green-900/30 text-green-500 border-green-800' :
                  'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-500 active:scale-95'
                }`}
              >
                {saveStatus === 'saving' ? '［同步中...］' : saveStatus === 'cooldown' ? '［已安全儲存］' : '［手動存檔］'}
              </button>
            </div>

            {/* 2. 強制讀取雲端 (急救) */}
            <div className="bg-red-950/20 p-3 rounded border border-red-900/30 flex justify-between items-center shadow-inner mt-1">
              <div className="flex flex-col gap-1 pr-2">
                <span className="text-sm font-bold text-red-400">系統急救：強制覆蓋</span>
                <span className="text-xs text-red-500/70">無視版號防護鎖，強制拉取雲端存檔覆蓋本地</span>
              </div>
              <button 
                onClick={handleForceLoad}
                className="px-3 py-2 bg-red-900/50 hover:bg-red-800 text-white border border-red-700 rounded text-xs font-bold tracking-widest transition-colors shadow shrink-0 active:scale-95"
              >
                ［拉取雲端］
              </button>
            </div>

            <div className="h-px bg-gray-800 my-1 w-full"></div>

            {/* 3. 未來預留功能與登出 */}
            <div className="grid grid-cols-2 gap-2">
              <button disabled className="py-2.5 bg-gray-900/40 border border-gray-800/50 text-gray-600 rounded text-xs font-bold tracking-widest cursor-not-allowed">
                ［改版日誌 (敬請期待)］
              </button>
              <button disabled className="py-2.5 bg-gray-900/40 border border-gray-800/50 text-gray-600 rounded text-xs font-bold tracking-widest cursor-not-allowed">
                ［商會說明文件］
              </button>
              <button disabled className="py-2.5 bg-gray-900/40 border border-gray-800/50 text-gray-600 rounded text-xs font-bold tracking-widest cursor-not-allowed">
                ［回報深淵異常］
              </button>
              <button 
                onClick={handleForceLogout}
                className="py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-600 text-gray-300 rounded text-xs font-bold tracking-widest transition-colors active:scale-95 shadow"
              >
                ［登出與清除快取］
              </button>
            </div>
          </div>
          
          <div className="text-center mt-3">
            <span className="text-gray-600 text-2xs tracking-widest font-mono">Dark Fantasy Trader v2.4</span>
          </div>
        </div>
      </div>
    </>
  );
}
