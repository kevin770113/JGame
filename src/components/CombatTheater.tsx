import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CombatLog } from '../types';

export default function CombatTheater() {
  const activeCombat = useGameStore((state) => state.activeCombat);
  const setActiveCombat = useGameStore((state) => state.setActiveCombat);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<CombatLog[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const [slaveHp, setSlaveHp] = useState(0);
  const [npcHp, setNpcHp] = useState(0);
  const [activeEffect, setActiveEffect] = useState<'none' | 'slave-hit' | 'npc-hit' | 'slave-skill'>('none');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCombat) {
      setCurrentFrame(0);
      setDisplayedLogs([]);
      setIsFinished(false);
      setSlaveHp(activeCombat.logs[0]?.sHp ?? activeCombat.slaveMaxHp);
      setNpcHp(activeCombat.logs[0]?.nHp ?? activeCombat.npcMaxHp);
      setActiveEffect('none');
    }
  }, [activeCombat]);

  useEffect(() => {
    if (!activeCombat || isFinished) return;

    const timer = setTimeout(() => {
      if (currentFrame < activeCombat.logs.length) {
        const log = activeCombat.logs[currentFrame];
        
        setDisplayedLogs(prev => [...prev, log]);
        
        if (log.sHp !== undefined) setSlaveHp(log.sHp);
        if (log.nHp !== undefined) setNpcHp(log.nHp);

        if (log.type === 'damage') {
          if (log.message.includes(activeCombat.slaveName + ' 發動攻擊')) setActiveEffect('npc-hit');
          else setActiveEffect('slave-hit');
        } else if (log.type === 'skill') {
          setActiveEffect('slave-skill');
        }

        setTimeout(() => setActiveEffect('none'), 300);
        setCurrentFrame(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 1000); 

    return () => clearTimeout(timer);
  }, [activeCombat, currentFrame, isFinished]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  if (!activeCombat) return null;

  const slaveHpPercent = Math.max(0, Math.min(100, (slaveHp / activeCombat.slaveMaxHp) * 100));
  const npcHpPercent = Math.max(0, Math.min(100, (npcHp / activeCombat.npcMaxHp) * 100));

  const getLogColor = (type: CombatLog['type']) => {
    switch (type) {
      case 'damage': return 'text-red-400';
      case 'heal': return 'text-green-400';
      case 'skill': return 'text-yellow-400';
      case 'system': return 'text-purple-400 font-bold';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-[url('https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev/bg-abyss-capital.webp')] bg-cover bg-center bg-no-repeat flex flex-col animate-fade-in overflow-hidden select-none font-mono">
      
      {/* 1. 基礎環境暗度 */}
      <div className="absolute inset-0 bg-black/50 z-0 pointer-events-none"></div>

      {/* 2. 全域底層呼吸燈 (z-0) - 完全滿版 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 transform-gpu will-change-opacity transition-opacity duration-1000 ease-in-out bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(220,20,20,0.6)_100%)] ${!isFinished ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
      </div>

      {/* 3. 頂部毛玻璃舞台 (z-10) */}
      <div className="bg-gray-950/60 backdrop-blur-md border-b-2 border-blood-red/50 pt-6 pb-6 px-4 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.8)] relative z-10 min-h-[25vh] md:min-h-[30vh] flex flex-col justify-center">
        <div className="text-center mb-6">
          <span className="text-red-600 font-black tracking-[0.3em] text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
            {activeCombat.isAbyss ? '【深淵死鬥】' : '【角鬥廝殺】'}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-4 max-w-4xl mx-auto w-full">
          <div className={`flex-1 flex flex-col gap-2 transition-transform duration-75 overflow-hidden ${activeEffect === 'slave-hit' ? 'translate-x-[-10px] md:translate-x-[-20px]' : activeEffect === 'slave-skill' ? 'scale-105' : ''}`}>
            <div className="flex justify-between items-end gap-3">
              <span className="text-blue-400 font-bold text-base md:text-xl tracking-widest truncate">{activeCombat.slaveName}</span>
              <span className="text-gray-400 text-sm md:text-base font-bold shrink-0 whitespace-nowrap">{slaveHp} / {activeCombat.slaveMaxHp}</span>
            </div>
            <div className="w-full h-5 md:h-6 bg-gray-900 border border-gray-700 rounded-sm overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 ease-out ${slaveHpPercent < 30 ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}
                style={{ width: `${slaveHpPercent}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay"></div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center justify-center w-12 md:w-16">
            <span className="text-gray-600 font-black italic text-3xl md:text-4xl">VS</span>
          </div>

          <div className={`flex-1 flex flex-col gap-2 transition-transform duration-75 overflow-hidden ${activeEffect === 'npc-hit' ? 'translate-x-[10px] md:translate-x-[20px]' : ''}`}>
            <div className="flex justify-between items-end flex-row-reverse gap-3">
              <span className="text-red-400 font-bold text-base md:text-xl tracking-widest truncate">{activeCombat.npcName}</span>
              <span className="text-gray-400 text-sm md:text-base font-bold shrink-0 whitespace-nowrap">{npcHp} / {activeCombat.npcMaxHp}</span>
            </div>
            <div className="w-full h-5 md:h-6 bg-gray-900 border border-gray-700 rounded-sm overflow-hidden relative rotate-180">
              <div 
                className="h-full bg-red-800 transition-all duration-500 ease-out"
                style={{ width: `${npcHpPercent}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent mix-blend-overlay"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 中央主展演區 (z-10) */}
      <div className="flex-1 relative overflow-hidden z-10 flex flex-col">
        
        {/* 日誌區專屬護眼黑底，完美壓制紅光避免染色文字 (50% + 70% = 85% 總黑度) */}
        <div className="absolute inset-0 bg-black/70 z-0 pointer-events-none"></div>
        
        {/* 羽化遮罩父容器 */}
        <div 
          className="absolute inset-0 z-10"
          style={{ 
            maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' 
          }}
        >
          {/* 勝利與失敗底光 */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className={`absolute bottom-0 left-0 right-0 h-[70%] transform-gpu will-change-opacity transition-opacity duration-1000 ease-in-out bg-gradient-to-t from-yellow-500/40 to-transparent ${isFinished && activeCombat.isWin ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`absolute bottom-0 left-0 right-0 h-[70%] transform-gpu will-change-opacity transition-opacity duration-1000 ease-in-out bg-gradient-to-t from-red-600/40 to-transparent ${isFinished && !activeCombat.isWin ? 'opacity-100' : 'opacity-0'}`}></div>
          </div>

          {/* 戰鬥日誌層 */}
          <div 
            ref={scrollContainerRef}
            className="absolute inset-0 overflow-y-auto scrollbar-none z-20 p-4 md:p-8"
          >
            <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pt-12 pb-24 relative">
              {displayedLogs.map((log, idx) => (
                <div key={idx} className={`animate-slide-up text-sm md:text-base leading-relaxed ${getLogColor(log.type)}`}>
                  <span className="text-gray-600 mr-3 text-xs md:text-sm opacity-70">[{log.round > 0 ? `回合 ${String(log.round).padStart(2, '0')}` : '系統'}]</span>
                  <span dangerouslySetInnerHTML={{ __html: log.message.replace(activeCombat.slaveName, `<strong class="text-blue-300">${activeCombat.slaveName}</strong>`).replace(activeCombat.npcName, `<strong class="text-red-400">${activeCombat.npcName}</strong>`) }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. 結算面板 (z-20) */}
      <div className={`bg-gray-950/90 backdrop-blur-md px-4 pt-4 pb-12 border-t border-gray-800 relative z-20 flex justify-center items-center transition-all duration-1000 ${isFinished ? 'h-40 md:h-44 opacity-100 translate-y-0' : 'h-0 opacity-0 translate-y-full overflow-hidden p-0'}`}>
        {isFinished && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md animate-fade-in mt-2">
            <div className={`text-xl font-black tracking-[0.2em] drop-shadow-md ${activeCombat.isWin ? 'text-yellow-500' : 'text-red-600'}`}>
              {activeCombat.isWin ? '［討伐成功］' : '［試驗體倒下］'}
            </div>
            {activeCombat.isWin && (
              <div className="text-xs text-gray-400 flex gap-4">
                <span>獲得資金: <strong className="text-yellow-500">${activeCombat.rewardGold}</strong></span>
                {activeCombat.rewardPrestige > 0 && <span>獲得威望: <strong className="text-blue-400">{activeCombat.rewardPrestige}</strong></span>}
              </div>
            )}
            <button 
              onClick={() => setActiveCombat(null)}
              className={`w-full mt-2 py-3 rounded text-sm font-bold tracking-widest shadow-lg transition-transform active:scale-95 border ${
                activeCombat.isWin 
                  ? 'bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-500 border-yellow-700/50' 
                  : 'bg-red-950/60 hover:bg-red-900/80 text-red-500 border-red-900'
              }`}
            >
              ［返回據點］
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
