import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { parseLocalizedName } from '../utils/i18nUtils';

export default function ArenaView() {
  const { t, i18n } = useTranslation();
  const slaves = useGameStore((state) => state.slaves);
  const arenaNPCs = useGameStore((state) => state.arenaNPCs);
  const { actionPoints, location } = useGameStore((state) => state.player);
  const executeArenaBattle = useGameStore((state) => state.executeArenaBattle);

  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  
  // 戰鬥動效專屬狀態鎖
  const [isFighting, setIsFighting] = useState(false);

  const isEn = i18n.language?.startsWith('en');
  const localNPCs = arenaNPCs.filter(npc => npc.location === location);
  
  // 僅篩選閒置且未昏厥的奴隸（體力低於20仍會顯示，以便玩家直觀掌握狀態）
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置' && (s.faintTurns || 0) === 0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 當可指派鬥士名單更新時，預設選取中央第一位
  useEffect(() => {
    if (idleSlaves.length > 0 && !selectedSlaveId) {
      setSelectedSlaveId(idleSlaves[0].id);
    }
  }, [idleSlaves, selectedSlaveId]);

  // 處理滾輪滾動監聽，動態判定正中央的試驗體
  const handleScroll = () => {
    if (!scrollRef.current || idleSlaves.length === 0) return;
    const container = scrollRef.current;
    const children = container.children;
    const containerCenter = container.getBoundingClientRect().top + container.clientHeight / 2;

    let closestId = idleSlaves[0].id;
    let minDistance = Infinity;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const childCenter = child.getBoundingClientRect().top + child.clientHeight / 2;
      const distance = Math.abs(childCenter - containerCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        const slaveId = child.getAttribute('data-slave-id');
        if (slaveId) closestId = slaveId;
      }
    }

    if (closestId !== selectedSlaveId) {
      setSelectedSlaveId(closestId);
    }
  };

  const handleFight = (npcId: string) => {
    if (!selectedSlaveId) {
      setSysMessage({ text: t('arena.err_no_fighter', '［錯誤］請先選擇要上陣的試驗體。'), type: 'error' });
      return;
    }
    const activeSlave = slaves.find(s => s.id === selectedSlaveId);
    if (!activeSlave || activeSlave.conditionStats.stamina < 20) {
      setSysMessage({ text: t('arena.err_no_fighter_stamina', '［錯誤］該名鬥士體力不足，無法上陣。'), type: 'error' });
      return;
    }
    if (actionPoints < 1) {
      setSysMessage({ text: t('arena.err_no_ap', '［系統警告］行動力不足。'), type: 'error' });
      return;
    }

    // 觸發刀劍交鋒的紅光閃擊與容器震動特效
    setIsFighting(true);

    // 延遲 900ms 鎖定操作，交付 Store 進行深層結算
    setTimeout(() => {
      executeArenaBattle(selectedSlaveId, npcId);
      setIsFighting(false);
    }, 900);
  };

  // ★ 核心修復：更正為合法的 R2 儲存空間網址前綴
  const getArenaBgUrl = () => {
    const r2Base = 'https://pub-960b13e3ff2e4b13940f018c6763a755.r2.dev/';
    if (location === 'Frontlines') return `${r2Base}arena-bg-frontlines.webp`;
    if (location === 'Capital') return `${r2Base}arena-bg-capital.webp`;
    if (location === 'NeutralHub') return `${r2Base}arena-bg-neutral.webp`;
    return `${r2Base}arena-bg-frontlines.webp`;
  };

  // ★ 核心修復：動態即時語系名字解析器（相容新舊存檔，切換語系絕不卡死名字）
  const getLocalizedNpcName = (id: string, currentName: string) => {
    let cleanName = currentName
      .replace('【狂暴的】', '').replace('【鐵壁的】', '').replace('【狡詐的】', '')
      .replace('[Frenzied] ', '').replace('[Ironclad] ', '').replace('[Cunning] ', '').trim();

    if (id.includes('npc-1')) cleanName = isEn ? 'Underground Thug' : '地下狂徒';
    else if (id.includes('npc-2')) cleanName = isEn ? 'Iron Gladiator' : '鐵血角鬥士';
    else if (id.includes('npc-3')) cleanName = isEn ? 'Royal Executioner' : '皇家處刑者';

    if (id.includes('berserk') || currentName.includes('狂暴') || currentName.includes('Frenzied')) {
      return isEn ? `[Frenzied] ${cleanName}` : `【狂暴的】${cleanName}`;
    }
    if (id.includes('ironclad') || id.includes('iron') || currentName.includes('鐵壁') || currentName.includes('Ironclad')) {
      return isEn ? `[Ironclad] ${cleanName}` : `【鐵壁的】${cleanName}`;
    }
    if (id.includes('cunning') || currentName.includes('狡詐') || currentName.includes('Cunning')) {
      return isEn ? `[Cunning] ${cleanName}` : `【狡詐的】${cleanName}`;
    }
    return cleanName;
  };

  const activeSlave = slaves.find(s => s.id === selectedSlaveId);

  return (
    <div className={`w-full flex flex-col gap-4 pb-10 animate-fade-in relative z-10 ${isFighting ? 'animate-shake' : ''}`}>
      
      {/* 全屏戰鬥刀劍交鋒血紅閃擊遮罩 */}
      {isFighting && (
        <div className="fixed inset-0 bg-red-600/50 z-50 pointer-events-none animate-flash" />
      )}

      {/* 頂部暗黑英雄式滿版橫幅 */}
      <div className="relative w-full h-36 sm:h-40 shrink-0 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
        <img 
          src={getArenaBgUrl()} 
          alt="Arena" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute bottom-3 left-4 z-10">
          <h2 className="text-xl font-bold text-red-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-widest">
            {t('arena.title', '［血腥角鬥場］')}
          </h2>
        </div>
        {/* ★ 已完美拔除畫蛇添足的「返回城鎮」按鈕 */}
      </div>

      <div className="bg-black/40 p-4 sm:p-5 rounded-lg border border-red-900/20 shadow-xl flex flex-col gap-5">
        
        {/* 磁吸式實體垂直選角滾輪 */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-xs text-red-500/80 font-bold tracking-widest border-l-2 border-red-600/80 pl-2">
            {t('arena.select_fighter', '［指派上陣鬥士］')}
          </label>
          
          {idleSlaves.length > 0 ? (
            <div className="relative bg-gray-950/90 border border-gray-800 rounded-lg h-36 overflow-hidden shadow-inner flex items-center justify-center">
              {/* 中央高亮選取框護欄 */}
              <div className="absolute inset-x-0 h-12 border-y border-red-900/40 bg-purple-950/10 pointer-events-none z-10" />
              {/* 上下緣環境漸層陰影遮罩 */}
              <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-gray-950 to-transparent pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-gray-950 to-transparent pointer-events-none z-10" />
              
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                // ★ 核心修復：強制 overflow-x-hidden 與 touch-pan-y 鎖死水平滑動干擾
                className="w-full h-full overflow-y-auto overflow-x-hidden touch-pan-y snap-y snap-mandatory scrollbar-none py-12 flex flex-col items-center"
              >
                {idleSlaves.map(s => {
                  const isSelected = s.id === selectedSlaveId;
                  const isStaminaLow = s.conditionStats.stamina < 20;
                  return (
                    <div 
                      key={s.id}
                      data-slave-id={s.id}
                      className={`w-full h-12 shrink-0 snap-center flex items-center justify-between px-6 font-mono transition-all duration-200 ${
                        isSelected 
                          ? 'text-purple-400 font-bold text-sm scale-105 opacity-100' 
                          : 'text-gray-600 text-xs opacity-35'
                      }`}
                    >
                      <span className="truncate max-w-[50%] font-sans tracking-wide">
                        {parseLocalizedName(s.name)}
                      </span>
                      {/* ★ 核心修復：改為顯示體力，並在低於出戰門檻時以紅色警告 */}
                      <div className="flex gap-2 text-right text-3xs items-center">
                        <span className="text-gray-500 tracking-widest">{t('stats.stamina', '體力')}:</span>
                        <strong className={`${isStaminaLow ? 'text-red-500 animate-pulse' : 'text-green-400'} font-mono text-sm`}>
                          {s.conditionStats.stamina}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 bg-gray-950/80 p-3 rounded border border-gray-800/80 shadow-inner">
              {t('arena.no_fighter', '目前沒有閒置的試驗體。')}
            </div>
          )}

          {activeSlave && (
            <div className="text-3xs text-gray-500 mt-1 flex justify-between px-1 font-mono">
              <span className={activeSlave.conditionStats.stamina < 20 ? 'text-red-500 font-bold animate-pulse' : ''}>
                {t('arena.min_stamina_req', '※ 出戰需具備最低體力: 20')}
              </span>
              <span>{t('stats.skill_combat', '戰鬥專精')}: <strong className="text-blue-400/80">Lv.{activeSlave.skills.combat}</strong></span>
            </div>
          )}
        </div>

        {sysMessage && (
          <div className={`p-3 rounded border text-xs font-bold text-center tracking-widest shadow-inner ${sysMessage.type === 'error' ? 'bg-red-950/40 border-red-900/50 text-red-400/90' : 'bg-green-950/40 border-green-900/50 text-green-400/90'}`}>
            {sysMessage.text}
          </div>
        )}

        {/* 挑戰對手列表 */}
        <div className="flex flex-col gap-4 mt-1">
          {localNPCs.length === 0 && (
            <div className="text-xs text-gray-600 text-center py-6 italic">{t('arena.no_npc', '該區域目前沒有可挑戰的對手。')}</div>
          )}
          {localNPCs.map(npc => {
            let winRate = 0;
            if (activeSlave) {
              const pScore = activeSlave.primaryStats.combat * 1.5 + activeSlave.primaryStats.endurance + (activeSlave.skills.combat * 20);
              const nScore = npc.stats.combat * 1.5 + npc.stats.endurance;
              winRate = Math.min(95, Math.max(5, Math.floor((pScore / (pScore + nScore)) * 100)));
            }

            let npcDesc = npc.description;
            if (isEn) {
              if (npc.id.includes('npc-1')) npcDesc = 'A desperate outlaw covered in mud and blood. Lacks any real technique.';
              else if (npc.id.includes('npc-2')) npcDesc = 'A professional fighter heavily invested by the guild. Well-equipped and trained.';
              else if (npc.id.includes('npc-3')) npcDesc = 'A killing machine of the imperial family, designed to crush challengers.';
            }

            return (
              <div key={npc.id} className="bg-gray-950/80 p-4 rounded-lg border border-gray-800 shadow-lg flex flex-col gap-3 relative overflow-hidden group hover:border-red-900/40 transition-colors">
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col gap-1">
                    {/* ★ 核心修復：使用 getLocalizedNpcName 即時重繪名字與特質前綴 */}
                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-red-400/90 transition-colors tracking-widest">
                      {getLocalizedNpcName(npc.id, npc.name)}
                    </h4>
                    <p className="text-3xs text-gray-500 leading-relaxed max-w-[180px] sm:max-w-[220px]">{npcDesc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-3xs text-gray-600 font-bold tracking-widest">{t('arena.reward', '賞金 / 威望')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500/90 font-bold font-mono text-sm">${npc.rewardGold}</span>
                      <span className="text-blue-400/80 font-bold font-mono text-xs">+{npc.rewardPrestige}</span>
                    </div>
                  </div>
                </div>

                {/* 專業 5 宮格資料表 */}
                <div className="grid grid-cols-5 gap-0 border border-gray-800/80 rounded bg-black/50 text-center font-mono text-3xs z-10 shadow-inner mt-1">
                  <div className="flex flex-col border-r border-gray-800/80 p-1.5"><span className="text-gray-600 font-bold mb-0.5">{t('stats.combat', '武力')}</span><span className="text-red-400/90 font-bold">{npc.stats.combat}</span></div>
                  <div className="flex flex-col border-r border-gray-800/80 p-1.5"><span className="text-gray-600 font-bold mb-0.5">{t('stats.endurance', '體質')}</span><span className="text-green-400/90 font-bold">{npc.stats.endurance}</span></div>
                  <div className="flex flex-col border-r border-gray-800/80 p-1.5"><span className="text-gray-600 font-bold mb-0.5">{t('stats.intelligence', '智力')}</span><span className="text-blue-400/90 font-bold">{npc.stats.intelligence}</span></div>
                  <div className="flex flex-col border-r border-gray-800/80 p-1.5"><span className="text-gray-600 font-bold mb-0.5">{t('stats.charisma', '魅力')}</span><span className="text-purple-400/90 font-bold">{npc.stats.charisma ?? 10}</span></div>
                  <div className="flex flex-col p-1.5"><span className="text-gray-600 font-bold mb-0.5">{t('stats.luck', '幸運')}</span><span className="text-yellow-400/90 font-bold">{npc.stats.luck ?? 10}</span></div>
                </div>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50 z-10">
                  <div className="text-xs text-gray-500 font-bold tracking-widest">
                    {activeSlave ? (
                      <>
                        {t('arena.win_rate', '系統勝率預測')}: <strong className={winRate >= 70 ? 'text-green-500/90 font-mono' : winRate >= 40 ? 'text-yellow-500/90 font-mono' : 'text-red-500/90 font-mono'}>{winRate}%</strong>
                      </>
                    ) : (
                      <span className="text-gray-600 italic text-2xs">{t('arena.select_to_predict', '選擇鬥士以預測勝率')}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleFight(npc.id)}
                    disabled={!selectedSlaveId || actionPoints < 1 || isFighting || (activeSlave && activeSlave.conditionStats.stamina < 20)}
                    className={`px-4 py-2 rounded font-bold text-xs tracking-widest transition-all shadow-md ${
                      !selectedSlaveId || actionPoints < 1 || isFighting || (activeSlave && activeSlave.conditionStats.stamina < 20)
                        ? 'bg-gray-900/50 text-gray-600 border border-gray-800 cursor-not-allowed'
                        : 'bg-red-950/60 hover:bg-red-900/80 text-red-400/90 hover:text-red-300 border border-red-900/60'
                    }`}
                  >
                    {t('arena.btn_fight', '進入戰鬥')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
