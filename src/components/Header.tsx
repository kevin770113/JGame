import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { day, timePhase, gold, food, prestige, actionPoints } = useGameStore((state) => state.player);
  const syncProfileToCloud = useGameStore((state) => state.syncProfileToCloud);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'cooldown'>('idle');

  const handleManualSave = async () => {
    if (saveStatus !== 'idle') return;
    setSaveStatus('saving');
    
    await syncProfileToCloud(); // 觸發雲端儲存
    
    setSaveStatus('cooldown');
    setTimeout(() => {
      setSaveStatus('idle'); // 3秒後解除冷卻
    }, 3000);
  };

  return (
    <header className="bg-gray-950 border-b border-gray-800 p-2 sm:p-3 flex justify-between items-center shadow-md relative z-50">
      <div className="flex flex-col gap-1 w-full max-w-3xl mx-auto">
        {/* 頂部：天數與存檔防護按鈕 */}
        <div className="flex justify-between items-center w-full mb-1">
          <div className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
            <span className="text-blood-red">❖</span> 第 {day} 天 ［{timePhase}］
          </div>
          
          <button 
            onClick={handleManualSave}
            disabled={saveStatus !== 'idle'}
            className={`px-3 py-1.5 rounded text-xs font-bold tracking-widest transition-all shadow border ${
              saveStatus === 'saving' ? 'bg-yellow-900/40 text-yellow-500 border-yellow-700 animate-pulse' :
              saveStatus === 'cooldown' ? 'bg-green-900/30 text-green-500 border-green-800' :
              'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 active:scale-95'
            }`}
          >
            {saveStatus === 'saving' ? '［雲端同步中...］' : saveStatus === 'cooldown' ? '［已安全儲存］' : '［手動存檔］'}
          </button>
        </div>
        
        {/* 資源列 */}
        <div className="grid grid-cols-4 gap-2 text-xs sm:text-sm bg-gray-900/80 p-2 rounded border border-gray-800 shadow-inner">
           <div className="flex flex-col items-center"><span className="text-gray-500 text-3xs mb-0.5 tracking-widest">資金</span><span className="text-yellow-500 font-mono font-bold">{gold}</span></div>
           <div className="flex flex-col items-center border-l border-gray-800"><span className="text-gray-500 text-3xs mb-0.5 tracking-widest">糧食</span><span className="text-orange-400 font-mono font-bold">{food}</span></div>
           <div className="flex flex-col items-center border-l border-gray-800"><span className="text-gray-500 text-3xs mb-0.5 tracking-widest">威望</span><span className="text-blue-400 font-mono font-bold">{prestige}</span></div>
           <div className="flex flex-col items-center border-l border-gray-800"><span className="text-gray-500 text-3xs mb-0.5 tracking-widest">行動力</span><span className={actionPoints < 5 ? 'text-red-500 font-mono font-bold animate-pulse' : 'text-green-400 font-mono font-bold'}>{actionPoints}/50</span></div>
        </div>
      </div>
    </header>
  );
}
