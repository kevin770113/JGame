import { useGameStore } from '../store/useGameStore';
import { Slave } from '../types';

interface SlavePanelProps {
  onSelectSlave: (slave: Slave) => void;
}

export default function SlavePanel({ onSelectSlave }: SlavePanelProps) {
  const slaves = useGameStore((state) => state.slaves);
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);

  const isOpen = activeWindow === 'roster';

  const handleToggle = () => {
    setActiveWindow(isOpen ? null : 'roster');
  };

  const handleSelect = (slave: Slave) => {
    setActiveWindow(null); 
    onSelectSlave(slave);
  };

  return (
    <>
      {/* 右側懸浮置中標籤按鈕 */}
      <div className="fixed right-0 top-1/4 z-50 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-300 py-3 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          <span>成</span>
          <span>員</span>
          <span>名</span>
          <span>冊</span>
        </button>
      </div>

      {/* 絕對互斥 ✕ 全局置中獨立大視窗 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveWindow(null)}
        >
          <div 
            className="bg-gray-900 border border-purple-900/50 rounded-lg w-full max-w-md max-h-[75vh] flex flex-col shadow-2xl relative border-t-2 border-t-purple-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-gray-800 flex justify-between items-center bg-gray-950/60">
              <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
                 <span className="text-purple-400">👁️</span> ［商會試驗體名冊］ 
                 <span className="text-xs font-mono text-gray-500">({slaves.length}/{useGameStore.getState().player.maxSlaveCapacity})</span>
              </h3>
              <button 
                onClick={() => setActiveWindow(null)}
                className="text-gray-500 hover:text-white text-xs font-bold tracking-widest transition-colors"
              >
                ［關閉］
              </button>
            </div>

            {/* 3 行卡片排版且獨立支援上下捲動 */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-gray-950/20 scrollbar-none">
              {slaves.map((slave) => (
                <button
                  key={slave.id}
                  onClick={() => handleSelect(slave)}
                  className="w-full bg-gray-900/90 hover:bg-gray-800/90 border border-gray-800 hover:border-gray-700 rounded-lg p-3 text-left flex flex-col gap-1 transition-all active:scale-98 shadow group"
                >
                  {/* 第一行：名字 */}
                  <div className="text-sm font-bold text-gray-200 group-hover:text-white truncate">
                    {slave.name}
                  </div>
                  
                  {/* 第二行：種族 / 性別 */}
                  <div className="text-2xs text-gray-400 flex items-center gap-2">
                    <span className="text-purple-300 font-bold">🧬 {slave.race}</span>
                    <span className="text-gray-700">｜</span>
                    <span className={slave.gender === 'Male' ? 'text-blue-400' : 'text-pink-400'}>
                      {slave.gender === 'Male' ? '♂ 男性' : '♀ 女性'}
                    </span>
                  </div>

                  {/* 第三行：狀態燈號 / 體力 / 壓力數值外顯 / 戰鬥紀錄 */}
                  <div className="text-2xs flex items-center gap-2.5 mt-1 border-t border-gray-800/60 pt-2 w-full overflow-x-auto scrollbar-none whitespace-nowrap">
                    <span className="flex items-center gap-1 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        slave.isInjured ? 'bg-red-600 animate-pulse' : slave.activityStatus === '閒置' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                      }`} />
                      <span className={slave.isInjured ? 'text-red-500 font-bold' : slave.activityStatus !== '閒置' ? 'text-yellow-500 font-bold' : 'text-gray-500'}>
                        {slave.isInjured ? '負傷' : slave.activityStatus}
                      </span>
                      {slave.isInjured && (
                        <span className="px-1 bg-red-950 border border-red-700 text-red-400 font-extrabold rounded text-3xs scale-90 animate-pulse">
                          負傷
                        </span>
                      )}
                    </span>
                    <span className="text-gray-700 shrink-0">｜</span>
                    <span className="text-green-400 font-mono font-bold shrink-0">體 {slave.conditionStats.stamina}</span>
                    <span className="text-gray-700 shrink-0">｜</span>
                    <span className="text-yellow-600 font-mono font-bold shrink-0">壓 {slave.conditionStats.stress}</span>
                    <span className="text-gray-700 shrink-0">｜</span>
                    <span className="text-blue-400 font-mono font-bold shrink-0">⚔️ 勝 {slave.combatRecord?.wins || 0}/敗 {slave.combatRecord?.losses || 0}</span>
                  </div>
                </button>
              ))}

              {slaves.length === 0 && (
                <div className="text-xs text-gray-600 text-center py-16 italic tracking-widest">
                  ［目前名冊內空無一人］
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
