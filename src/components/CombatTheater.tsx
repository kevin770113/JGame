import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { CombatLog } from '../types';
import { parseLocalizedName } from '../utils/i18nUtils'; 

export default function CombatTheater() {
  const { t } = useTranslation();
  const activeCombat = useGameStore((state) => state.activeCombat);
  const setActiveCombat = useGameStore((state) => state.setActiveCombat);
  const location = useGameStore((state) => state.player.location);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [displayedLogs, setDisplayedLogs] = useState<CombatLog[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [endFlash, setEndFlash] = useState<'none' | 'gold' | 'red'>('none');
  
  const [slaveHp, setSlaveHp] = useState(0);
  const [npcHp, setNpcHp] = useState(0);
  const [activeEffect, setActiveEffect] = useState<'none' | 'slave-hit' | 'npc-hit' | 'slave-skill'>('none');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const isMounted = useRef<boolean>(true);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current); 
    };
  }, []);

  useEffect(() => {
    if (activeCombat) {
      setCurrentFrame(0);
      setDisplayedLogs([]);
      setIsFinished(false);
      setEndFlash('none');
      setSlaveHp(activeCombat.logs[0]?.sHp ?? activeCombat.slaveMaxHp);
      setNpcHp(activeCombat.logs[0]?.nHp ?? activeCombat.npcMaxHp);
      setActiveEffect('none');
    }
  }, [activeCombat]);

  useEffect(() => {
    if (!activeCombat || isFinished) return;

    const playNextFrame = () => {
      if (!isMounted.current) return; 

      if (currentFrame < activeCombat.logs.length) {
        const log = activeCombat.logs[currentFrame];
        
        setDisplayedLogs(prev => [...prev, log]);
        if (log.sHp !== undefined) setSlaveHp(log.sHp);
        if (log.nHp !== undefined) setNpcHp(log.nHp);

        if (log.type === 'damage') {
          if (log.message.includes(activeCombat.slaveName + ' 發動攻擊') || log.message.includes(activeCombat.slaveName + ' 发动攻击')) setActiveEffect('npc-hit');
          else setActiveEffect('slave-hit');
        } else if (log.type === 'skill') {
          setActiveEffect('slave-skill');
        }

        setTimeout(() => {
          if (isMounted.current) setActiveEffect('none');
        }, 300);

        setCurrentFrame(prev => prev + 1);
      } else {
        setIsFinished(true);
        // ★ 戰鬥結束瞬間觸發勝利金光或失敗紅光
        setEndFlash(activeCombat.isWin ? 'gold' : 'red');
        setTimeout(() => {
          if (isMounted.current) setEndFlash('none');
        }, 1500);
      }
    };

    timeoutIdRef.current = setTimeout(playNextFrame, 1000);
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
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

  const localizedSlaveName = parseLocalizedName(activeCombat.slaveName);
  const localizedNpcName = parseLocalizedName(activeCombat.npcName);

  const sNameLong = localizedSlaveName.length > 8;
  const sNameClass = sNameLong 
    ? "text-sm md:text-base tracking-normal leading-tight whitespace-nowrap" 
    : "text-base md:text-xl tracking-widest leading-snug whitespace-nowrap";

  const nNameLong = localizedNpcName.length > 8;
  const nNameClass = nNameLong 
    ? "text-sm md:text-base tracking-normal leading-tight text-right whitespace-nowrap" 
    : "text-base md:text-xl tracking-widest leading-snug text-right whitespace-nowrap";

  // ★ 依據目前地點獲取對應的 R2 角鬥場背景圖片路徑
  const getArenaBgUrl = () => {
    if (activeCombat.isAbyss) return 'https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev/bg-abyss-capital.webp';
    const r2Base = 'https://pub-f4c2298cdecf44d8bedcde11c1d8ea8d.r2.dev/';
    if (location === 'Frontlines') return `${r2Base}arena-bg-frontlines.webp`;
    if (location === 'Capital') return `${r2Base}arena-bg-capital.webp`;
    if (location === 'NeutralHub') return `${r2Base}arena-bg-neutral.webp`;
    return `${r2Base}arena-bg-frontlines.webp`;
  };

  return (
    <>
      {/* ★ 內嵌免設定檔的純淨動畫 CSS */}
      <style>{`
        @keyframes flashGold {
          0% { opacity: 0; background-color: rgba(234, 179, 8, 0.0); }
          15% { opacity: 1; background-color: rgba(234, 179, 8, 0.5); }
          100% { opacity: 0; background-color: rgba(234, 179, 8, 0.0); }
        }
        @keyframes flashRed {
          0% { opacity: 0; background-color: rgba(220, 38, 38, 0.0); }
          15% { opacity: 1; background-color: rgba(220, 38, 38, 0.6); }
          100% { opacity: 0; background-color: rgba(220, 38, 38, 0.0); }
        }
        .animate-flash-gold { animation: flashGold 1.5s ease-out forwards; }
        .animate-flash-red { animation: flashRed 1.5s ease-out forwards; }
      `}</style>

      {/* 結算閃光特效層 */}
      {endFlash === 'gold' && <div className="fixed inset-0 z-[110] pointer-events-none animate-flash-gold mix-blend-screen" />}
      {endFlash === 'red' && <div className="fixed inset-0 z-[110] pointer-events-none animate-flash-red mix-blend-multiply" />}

      <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in overflow-hidden select-none font-mono">
        <div className="absolute inset-0 bg-black/90 z-0 pointer-events-none"></div>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className={`absolute inset-0 transform-gpu will-change-opacity transition-opacity duration-1000 ease-in-out bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(220,20,20,0.4)_100%)] ${!isFinished ? 'opacity-100 animate-pulse' : 'opacity-0'}`}></div>
        </div>

        {/* ★ 頂部改為英雄橫幅圖片容器，墊上黑色漸層 */}
        <div className="relative border-b border-gray-800 pt-16 pb-6 px-4 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.8)] z-10 min-h-[25vh] md:min-h-[30vh] flex flex-col justify-end bg-gray-950">
          <img src={getArenaBgUrl()} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"></div>
          
          <div className="absolute top-4 left-4 z-10">
            <span className="text-red-600/90 font-black tracking-[0.2em] text-sm drop-shadow-md">
              {activeCombat.isAbyss ? t('combat.title_abyss', '［深淵死鬥］') : t('combat.title_arena', '［血腥角鬥］')}
            </span>
          </div>
          
          {/* 血條對抗資訊列 */}
          <div className="relative z-10 flex justify-between items-start gap-4 max-w-4xl mx-auto w-full">
            <div className={`flex-1 flex flex-col gap-1.5 transition-transform duration-75 overflow-hidden ${activeEffect === 'slave-hit' ? 'translate-x-[-10px] md:translate-x-[-20px]' : activeEffect === 'slave-skill' ? 'scale-105' : ''}`}>
              <span className={`text-blue-400 font-bold break-all ${sNameClass}`}>
                {localizedSlaveName}
              </span>
              <div className="w-full h-4 md:h-5 bg-gray-950 border border-gray-800 rounded-sm overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(37,99,235,0.4)] ${slaveHpPercent < 30 ? 'bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.6)]' : 'bg-blue-600'}`}
                  style={{ width: `${slaveHpPercent}%` }}
                />
              </div>
              <span className="text-gray-400 text-[10px] md:text-xs font-bold font-mono text-left tracking-widest">
                {slaveHp} / {activeCombat.slaveMaxHp}
              </span>
            </div>

            <div className="shrink-0 flex flex-col items-center justify-center w-10 md:w-16 mt-4">
               <span className="text-gray-500 font-black italic text-2xl md:text-3xl drop-shadow-md">VS</span>
            </div>

            <div className={`flex-1 flex flex-col gap-1.5 transition-transform duration-75 overflow-hidden ${activeEffect === 'npc-hit' ? 'translate-x-[10px] md:translate-x-[20px]' : ''}`}>
              <span className={`text-red-400 font-bold break-all ${nNameClass}`}>
                {localizedNpcName}
              </span>
              <div className="w-full h-4 md:h-5 bg-gray-950 border border-gray-800 rounded-sm overflow-hidden relative rotate-180">
                <div 
                  className="h-full bg-red-700 transition-all duration-500 ease-out shadow-[0_0_8px_rgba(185,28,28,0.5)]"
                  style={{ width: `${npcHpPercent}%` }}
                />
              </div>
              <span className="text-gray-400 text-[10px] md:text-xs font-bold font-mono text-right tracking-widest">
                {npcHp} / {activeCombat.npcMaxHp}
              </span>
            </div>
          </div>
        </div>

        {/* 戰鬥日誌滾動區 */}
        <div className="flex-1 relative overflow-hidden z-10 flex flex-col">
          <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>
          <div 
            className="absolute inset-0 z-10"
            style={{ 
              maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' 
            }}
          >
            <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto scrollbar-none z-20 p-4 md:p-8">
              <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full pt-12 pb-24 relative">
                {displayedLogs.map((log, idx) => {
                  const logAny = log as any;
                  let text = log.message;
                  
                  if (logAny.messageKey) {
                     text = t(logAny.messageKey, { ...logAny.messageParams, defaultValue: log.message }) as string;
                  }

                  const highlightedText = text
                    .replace(activeCombat.slaveName, `<strong class="text-blue-400">${localizedSlaveName}</strong>`)
                    .replace(activeCombat.npcName, `<strong class="text-red-500">${localizedNpcName}</strong>`);

                  return (
                    <div key={idx} className={`animate-slide-up text-[13px] md:text-sm leading-relaxed ${getLogColor(log.type)}`}>
                      <span className="text-gray-600 mr-3 text-[10px] md:text-xs opacity-70 font-bold">
                        [{log.round > 0 ? t('combat.round_prefix', { round: String(log.round).padStart(2, '0'), defaultValue: `回合 ${String(log.round).padStart(2, '0')}` }) : t('combat.system_prefix', '系統')}]
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 結算面板 */}
        <div className={`bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 relative z-20 flex justify-center items-center transition-all duration-1000 ${isFinished ? 'h-40 md:h-44 opacity-100 translate-y-0 px-4 pt-4 pb-12' : 'h-0 opacity-0 translate-y-full overflow-hidden p-0'}`}>
          {isFinished && (
            <div className="flex flex-col items-center gap-3 w-full max-w-md animate-fade-in mt-2">
              <div className={`text-xl font-black tracking-[0.2em] drop-shadow-md ${activeCombat.isWin ? 'text-yellow-500' : 'text-red-600'}`}>
                {activeCombat.isWin ? t('combat.victory', '［討伐成功］') : t('combat.defeat', '［試驗體倒下］')}
              </div>
              {activeCombat.isWin && (
                <div className="text-[11px] text-gray-400 flex gap-4 font-bold tracking-widest">
                  <span>{t('combat.reward_gold', '獲得資金:')} <strong className="text-yellow-500 font-mono text-sm">${activeCombat.rewardGold}</strong></span>
                  {activeCombat.rewardPrestige > 0 && <span>{t('combat.reward_prestige', '獲得威望:')} <strong className="text-blue-400 font-mono text-sm">+{activeCombat.rewardPrestige}</strong></span>}
                </div>
              )}
              <button 
                onClick={() => setActiveCombat(null)}
                className={`w-full mt-2 py-3 rounded text-xs font-bold tracking-widest shadow-lg transition-transform active:scale-95 border ${
                  activeCombat.isWin 
                    ? 'bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-500 border-yellow-700/50' 
                    : 'bg-red-950/60 hover:bg-red-900/80 text-red-500 border-red-900'
                }`}
              >
                {t('combat.return_base', '［返回據點］')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
