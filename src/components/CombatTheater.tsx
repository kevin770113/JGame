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

  const logsEndRef = useRef<HTMLDivElement>(null);

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
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in overflow-hidden select-none font-mono">
      {/* ★ V2.6 擴大頂部舞台比例與加入安全防護區段 (pt-12) */}
      <div className="bg-gray-950 border-b-2 border-blood-red/50 pt-12 pb-8 px-4 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.8)] relative z-10 min-h-[35vh] md:min-h-[40vh] flex flex-col justify-center">
        <div className="text-center mb-6">
          <span className="text-red-600 font-black tracking-[0.3em] text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
            {activeCombat.isAbyss ? '【 深 淵 死 鬥 】' : '【 角 鬥 廝 殺 】'}
          </span>
        </div>
        
        <div className="flex justify-between items-center gap-4 max-w-4xl mx-auto w-full">
          <div className={`flex-1 flex flex-col gap-2 transition-transform duration-75 ${activeEffect === 'slave-hit' ? 'translate-x-[-10px] md:translate-x-[-20px]' : activeEffect === 'slave-skill' ? 'scale-105' : ''}`}>
            <div className="flex justify-between items-end">
              <span className="text-blue-400 font-bold text-base md:text-xl tracking-widest truncate max-w-[60%]">{activeCombat.slaveName}</span>
              <span className="text-gray-400 text-sm md:text-base font-bold">{slaveHp} / {activeCombat.slaveMaxHp}</span>
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

          <div className={`flex-1 flex flex-col gap-2 transition-transform duration-75 ${activeEffect === 'npc-hit' ? 'translate-x-[10px] md:translate-x-[20px]' : ''}`}>
            <div className="flex justify-between items-end flex-row-reverse">
              <span className="text-red-400 font-bold text-base md:text-xl tracking-widest truncate max-w-[60%]">{activeCombat.npcName}</span>
              <span className="text-gray-400 text-sm md:text-base font-bold">{npcHp} / {activeCombat.npcMaxHp}</span>
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

      {/* ★ V2.6 優化漸層遮罩，讓日誌隱入黑暗更自然 */}
      <div className="flex-1 bg-[url('https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev/bg-abyss-capital.webp')] bg-cover bg-center bg-no-repeat relative overflow-hidden">
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-y-auto scrollbar-none" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 90%, transparent)' }}>
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pt-16 pb-24">
            {displayedLogs.map((log, idx) => (
              <div key={idx} className={`animate-slide-up text-sm md:text-base leading-relaxed ${getLogColor(log.type)}`}>
                <span className="text-gray-600 mr-3 text-xs md:text-sm opacity-70">[{log.round > 0 ? `回合 ${String(log.round).padStart(2, '0')}` : '系統'}]</span>
                <span dangerouslySetInnerHTML={{ __html: log.message.replace(activeCombat.slaveName, `<strong class="text-blue-300">${activeCombat.slaveName}</strong>`).replace(activeCombat.npcName, `<strong class="text-red-400">${activeCombat.npcName}</strong>`) }} />
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      <div className={`bg-gray-950 p-4 border-t border-gray-800 flex justify-center items-center transition-all duration-1000 ${isFinished ? 'h-32 opacity-100 translate-y-0' : 'h-0 opacity-0 translate-y-full overflow-hidden p-0'}`}>
        {isFinished && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md animate-fade-in">
            <div className={`text-xl font-black tracking-[0.2em] drop-shadow-md ${activeCombat.isWin ? 'text-yellow-500' : 'text-red-600'}`}>
              {activeCombat.isWin ? '［ 討 伐 成 功 ］' : '［ 試 驗 體 倒 下 ］'}
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
                  ? 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-500 border-yellow-700/50' 
                  : 'bg-red-950/50 hover:bg-red-900/70 text-red-500 border-red-900'
              }`}
            >
              ［ 返 回 據 點 ］
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
