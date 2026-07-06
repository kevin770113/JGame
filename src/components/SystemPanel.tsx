import { useGameStore } from '../store/useGameStore';
import { supabase } from '../services/supabaseClient';

export default function SystemPanel() {
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const isSaving = useGameStore((state) => state.isSaving);
  const syncProfileToCloud = useGameStore((state) => state.syncProfileToCloud);
  const localSaveVersion = useGameStore((state) => state.localSaveVersion);

  const isOpen = activeWindow === 'system';

  const handleToggle = () => {
    setActiveWindow(isOpen ? null : 'system');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <div className="fixed left-0 top-[45%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-r border-gray-600 text-gray-400 py-3 px-1.5 rounded-r-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          <span>系</span>
          <span>統</span>
          <span>選</span>
          <span>單</span>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed left-0 top-0 h-full w-64 bg-gray-950 border-r border-gray-700 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
             <span className="text-gray-400">⚙️</span> ［系統管理］
          </h3>
          <button 
            onClick={() => setActiveWindow(null)}
            className="text-gray-500 hover:text-white text-xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-3 shadow-inner">
             <div className="text-xs text-gray-400 font-bold border-b border-gray-800 pb-2 tracking-widest">［存檔狀態］</div>
             <div className="text-xs text-gray-300 font-mono flex justify-between">
                <span>本地記憶版號:</span>
                <span className="text-blue-400">v{localSaveVersion}</span>
             </div>
             <button 
               onClick={() => { syncProfileToCloud(); }}
               disabled={isSaving}
               className={`w-full mt-2 py-2.5 rounded font-bold text-xs tracking-widest transition-colors shadow-sm border ${isSaving ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-wait' : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600 active:scale-95'}`}
             >
               {isSaving ? '［同步中...］' : '［強制上傳雲端］'}
             </button>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex flex-col gap-3 shadow-inner mt-auto">
             <div className="text-xs text-gray-400 font-bold border-b border-gray-800 pb-2 tracking-widest">［帳號連線］</div>
             <button 
               onClick={handleLogout}
               className="w-full mt-2 py-2.5 rounded font-bold text-xs tracking-widest transition-colors shadow-sm border bg-red-950/40 hover:bg-red-900/60 text-red-500 border-red-900 active:scale-95"
             >
               ［切斷連結並登出］
             </button>
          </div>
        </div>
      </div>
    </>
  );
}
