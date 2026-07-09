import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { Slave } from '../types';
import { ITEMS_DATA, getSlavePortraitUrl } from '../utils/gameData';
import { parseLocalizedName } from '../utils/i18nUtils';

const renderRadar = (slave: Slave, t: any) => {
  const weaponAtk = (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) 
    ? (ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0) : 0;

  const getP = (val: number, angleIndex: number, maxR = 40) => {
     const angle = (angleIndex * 72 - 90) * (Math.PI / 180);
     const r = (Math.min(100, Math.max(0, val)) / 100) * maxR;
     return `${60 + r * Math.cos(angle)},${60 + r * Math.sin(angle)}`;
  };
  
  const stats = [
     slave.primaryStats.combat + weaponAtk, 
     slave.primaryStats.intelligence,
     slave.primaryStats.charisma ?? 10,
     slave.primaryStats.luck ?? 10,
     slave.primaryStats.endurance
  ];
  
  const statPoints = stats.map((val, i) => getP(val, i)).join(' ');
  const bg100 = [100,100,100,100,100].map((v,i) => getP(v,i)).join(' ');
  const bg75 = [75,75,75,75,75].map((v,i) => getP(v,i)).join(' ');
  const bg50 = [50,50,50,50,50].map((v,i) => getP(v,i)).join(' ');
  const bg25 = [25,25,25,25,25].map((v,i) => getP(v,i)).join(' ');

  return (
    <div className="relative w-40 h-40 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center mx-auto my-1">
       {/* 擴展 viewBox 防溢出 */}
       <svg viewBox="-15 -15 150 150" className="w-full h-full drop-shadow-md overflow-visible">
          <polygon points={bg100} fill="rgba(31, 41, 55, 0.4)" stroke="#4b5563" strokeWidth="1" />
          <polygon points={bg75} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
          <polygon points={bg50} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
          <polygon points={bg25} fill="none" stroke="#374151" strokeWidth="0.5" strokeDasharray="2 2" />
          
          <line x1="60" y1="60" x2={getP(100,0).split(',')[0]} y2={getP(100,0).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,1).split(',')[0]} y2={getP(100,1).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,2).split(',')[0]} y2={getP(100,2).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,3).split(',')[0]} y2={getP(100,3).split(',')[1]} stroke="#4b5563" strokeWidth="1" />
          <line x1="60" y1="60" x2={getP(100,4).split(',')[0]} y2={getP(100,4).split(',')[1]} stroke="#4b5563" strokeWidth="1" />

          <polygon points={statPoints} fill="rgba(139, 92, 246, 0.5)" stroke="#a855f7" strokeWidth="1.5" className="transition-all duration-700 ease-out" />

          <text x="60" y="5" fontSize="10" fill="#f87171" textAnchor="middle" fontWeight="bold">{t('stats.combat', '武力')}</text>
          <text x="105" y="48" fontSize="10" fill="#60a5fa" textAnchor="start" fontWeight="bold">{t('stats.intelligence', '智力')}</text>
          <text x="90" y="108" fontSize="10" fill="#f472b6" textAnchor="start" fontWeight="bold">{t('stats.charisma', '魅力')}</text>
          <text x="30" y="108" fontSize="10" fill="#facc15" textAnchor="end" fontWeight="bold">{t('stats.luck', '幸運')}</text>
          <text x="15" y="48" fontSize="10" fill="#4ade80" textAnchor="end" fontWeight="bold">{t('stats.endurance', '體質')}</text>
       </svg>
    </div>
  );
};

export default function SlavePanel() {
  const { t, i18n } = useTranslation();
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const slaves = useGameStore((state) => state.slaves);

  const [activeSlaveId, setActiveSlaveId] = useState<string | null>(null);
  const [slaveTab, setSlaveTab] = useState<'ability' | 'status'>('ability');

  const isOpen = activeWindow === 'roster';
  const handleToggle = () => setActiveWindow(isOpen ? null : 'roster');

  useEffect(() => {
    if (slaves.length > 0 && !activeSlaveId) setActiveSlaveId(slaves[0].id);
    else if (slaves.length === 0) setActiveSlaveId(null);
  }, [slaves, activeSlaveId]);

  useEffect(() => {
    if (activeSlaveId) setSlaveTab('ability');
  }, [activeSlaveId]);

  const activeSlave = slaves.find(s => s.id === activeSlaveId);
  const isEn = i18n.language?.startsWith('en');

  return (
    <>
      <div className="fixed right-0 top-[40%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-400 py-4 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="flex items-center gap-2 uppercase">
             {isEn ? 'ROSTER' : '成員名冊'}
          </div>
          <span className="mt-1 text-2xs px-1 bg-purple-950 text-purple-400 border border-purple-800 rounded-full font-mono">{slaves.length}</span>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-lg sm:max-w-2xl bg-gray-950 border-l border-purple-900/50 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
             {t('slave_panel.title', '［商隊成員總覽看板］')}
          </h3>
          <button 
            onClick={() => setActiveWindow(null)}
            className="text-gray-500 hover:text-red-400 text-xl font-bold transition-colors bg-gray-950/50 hover:bg-red-950/50 w-7 h-7 rounded border border-gray-800 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左側名單 */}
          <div className="w-1/3 sm:w-1/4 border-r border-gray-900 bg-gray-950 flex flex-col overflow-y-auto scrollbar-none divide-y divide-gray-900">
            {slaves.map((slave) => {
              const isSelected = slave.id === activeSlaveId;
              const localizedName = parseLocalizedName(slave.name);
              return (
                <button
                  key={slave.id}
                  onClick={() => setActiveSlaveId(slave.id)}
                  className={`w-full p-3 flex flex-col items-left text-left gap-1 transition-all relative overflow-hidden group border-l-2 ${
                    isSelected 
                      ? 'bg-purple-950/20 border-l-purple-500 bg-gradient-to-r from-purple-950/10 to-transparent' 
                      : 'border-l-transparent hover:bg-gray-900/40'
                  }`}
                >
                  <span className={`text-xs font-bold truncate w-full transition-colors ${isSelected ? 'text-purple-400' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {localizedName}
                  </span>
                  <div className="flex items-center gap-1.5 text-3xs text-gray-600 font-mono">
                    <span className={slave.gender === 'Male' ? 'text-blue-500/70' : 'text-pink-500/70'}>
                      {slave.gender === 'Male' ? t('gender.male_short', '男') : t('gender.female_short', '女')}
                    </span>
                    <span>•</span>
                    <span className="truncate">{t(`race.${slave.race}`, slave.race)}</span>
                  </div>
                  {slave.activityStatus !== '閒置' && (
                    <span className="absolute bottom-1 right-1 text-[8px] px-1 bg-yellow-950/80 text-yellow-500 border border-yellow-900/50 rounded font-bold scale-90">
                      {t(`activity_status.${slave.activityStatus}`, slave.activityStatus)}
                    </span>
                  )}
                  {slave.isInjured && (
                    <span className="absolute top-1 right-1 text-[8px] px-1 bg-red-950/80 text-red-500 border border-red-900/50 rounded font-bold animate-pulse scale-90">
                      {t('status.injured_short', '負傷')}
                    </span>
                  )}
                </button>
              );
            })}
            {slaves.length === 0 && (
              <div className="p-4 text-center text-3xs text-gray-700 tracking-widest leading-relaxed">
                {t('slave_panel.empty_roster', '目前麾下空無一人')}
              </div>
            )}
          </div>

          {/* 右側詳細資料 */}
          <div className="w-2/3 sm:w-3/4 flex flex-col bg-gray-950 overflow-hidden relative">
            {activeSlave ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* ★ 英雄式橫幅 (Hero Banner) 重歸！ */}
                <div className="relative w-full h-40 sm:h-52 shrink-0 bg-black border-b border-gray-800">
                  <img 
                    src={getSlavePortraitUrl(activeSlave)} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover object-[center_15%] opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                  
                  {/* 疊加的姓名與狀態資訊 */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xl sm:text-2xl font-bold text-gray-200 tracking-widest drop-shadow-md">
                        {parseLocalizedName(activeSlave.name)}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-gray-300 bg-black/60 px-2 py-0.5 rounded border border-gray-700 shadow-sm backdrop-blur-sm">
                          {t(`race.${activeSlave.race}`, activeSlave.race)}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border shadow-sm backdrop-blur-sm ${activeSlave.activityStatus === '閒置' ? 'bg-black/60 border-gray-700 text-gray-400' : 'bg-yellow-950/80 border-yellow-900 text-yellow-500 font-bold'}`}>
                          {t(`activity_status.${activeSlave.activityStatus}`, activeSlave.activityStatus)}
                        </span>
                        {(activeSlave.faintTurns || 0) > 0 && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-900/80 border border-gray-600 text-gray-300 font-extrabold rounded shadow-sm backdrop-blur-sm">
                            {t('app.faint_state', '昏厥')} ({activeSlave.faintTurns} {t('app.turns', '回合')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-800 shrink-0 bg-gray-900/50">
                  <button onClick={() => setSlaveTab('ability')} className={`flex-1 py-2.5 text-xs font-bold tracking-widest transition-colors ${slaveTab === 'ability' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-950/20' : 'text-gray-500 hover:text-gray-300'}`}>
                    {t('slave_panel.tab_ability', '［戰鬥能力］')}
                  </button>
                  <button onClick={() => setSlaveTab('status')} className={`flex-1 py-2.5 text-xs font-bold tracking-widest transition-colors ${slaveTab === 'status' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-950/20' : 'text-gray-500 hover:text-gray-300'}`}>
                    {t('slave_panel.tab_status', '［綜合狀態］')}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none p-4 flex flex-col gap-4">
                  {slaveTab === 'ability' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      
                      {/* 雷達圖 */}
                      <div className="bg-black/30 rounded-lg border border-gray-800/80 p-2 shadow-inner">
                         {renderRadar(activeSlave, t)}
                      </div>
                      
                      {/* ★ 五維素質全回歸：專業 6 宮格 (含武器攻擊力計算) */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-0 border border-gray-800/80 rounded-lg bg-black/40 text-xs font-mono shadow-inner">
                        <div className="border-r border-b border-gray-800/80 p-2 flex justify-between items-center">
                          <span className="text-gray-600 font-bold">{t('stats.combat', '武力')}</span>
                          {activeSlave.isInjured ? (
                            <span><span className="text-red-500 font-bold">{Math.floor(activeSlave.primaryStats.combat * 0.5)}</span> <span className="text-gray-600 text-[10px]">({t('ui.original', '原')}:{activeSlave.primaryStats.combat})</span></span>
                          ) : (
                            <span>
                              <span className="text-red-400/90 font-bold">{activeSlave.primaryStats.combat + ((activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId]) ? (ITEMS_DATA[activeSlave.equipment.weaponId].effect.attack || 0) : 0)}</span>
                              {activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId] && <span className="text-green-500/80 ml-1">+{ITEMS_DATA[activeSlave.equipment.weaponId].effect.attack}</span>}
                            </span>
                          )}
                        </div>
                        <div className="border-r border-b border-gray-800/80 p-2 flex justify-between items-center">
                          <span className="text-gray-600 font-bold">{t('stats.endurance', '體質')}</span>
                          {activeSlave.isInjured ? (
                            <span><span className="text-red-500 font-bold">{Math.floor(activeSlave.primaryStats.endurance * 0.5)}</span> <span className="text-gray-600 text-[10px]">({t('ui.original', '原')}:{activeSlave.primaryStats.endurance})</span></span>
                          ) : (
                            <span className="text-green-400/90 font-bold">{activeSlave.primaryStats.endurance}</span>
                          )}
                        </div>
                        <div className="sm:border-r-0 border-b border-gray-800/80 p-2 flex justify-between items-center">
                          <span className="text-gray-600 font-bold">{t('stats.intelligence', '智力')}</span>
                          {activeSlave.isInjured ? (
                            <span><span className="text-red-500 font-bold">{Math.floor(activeSlave.primaryStats.intelligence * 0.5)}</span> <span className="text-gray-600 text-[10px]">({t('ui.original', '原')}:{activeSlave.primaryStats.intelligence})</span></span>
                          ) : (
                            <span className="text-blue-400/90 font-bold">{activeSlave.primaryStats.intelligence}</span>
                          )}
                        </div>
                        <div className="border-r border-gray-800/80 sm:border-b p-2 flex justify-between items-center">
                          <span className="text-gray-600 font-bold">{t('stats.charisma', '魅力')}</span>
                          <span className="text-purple-400/90 font-bold">{activeSlave.primaryStats.charisma ?? 10}</span>
                        </div>
                        <div className="border-r border-gray-800/80 sm:border-b p-2 flex justify-between items-center">
                          <span className="text-gray-600 font-bold">{t('stats.luck', '幸運')}</span>
                          <span className="text-yellow-400/90 font-bold">{activeSlave.primaryStats.luck ?? 10}</span>
                        </div>
                        <div className="p-2 flex justify-between items-center bg-gray-900/30 sm:border-b border-gray-800/80">
                          <span className="text-gray-600 font-bold">{t('stats.obedience', '服從度')}</span>
                          <span className="text-indigo-400/90 font-bold">{activeSlave.primaryStats.obedience}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                         <div className="text-[10px] text-gray-500 font-bold tracking-widest border-b border-gray-800 pb-1">{t('slave_panel.skills', '［掌握技能］')}</div>
                         <div className="flex flex-wrap gap-2 text-center font-mono">
                            <div className="flex-1 min-w-[30%] bg-black/40 border border-gray-800/80 p-2 rounded-lg shadow-inner">
                               <div className="text-[10px] text-gray-500 truncate mb-1">{t('stats.skill_combat', '戰鬥專精')}</div>
                               <div className="text-blue-400/90 font-bold text-sm">Lv.{activeSlave.isInjured ? Math.floor((activeSlave.skills?.combat || 1) * 0.5) : (activeSlave.skills?.combat || 1)}</div>
                            </div>
                            <div className="flex-1 min-w-[30%] bg-black/40 border border-gray-800/80 p-2 rounded-lg shadow-inner">
                               <div className="text-[10px] text-gray-500 truncate mb-1">{t('stats.skill_housework', '內政管家')}</div>
                               <div className="text-green-400/90 font-bold text-sm">Lv.{activeSlave.isInjured ? Math.floor((activeSlave.skills?.housework || 1) * 0.5) : (activeSlave.skills?.housework || 1)}</div>
                            </div>
                            <div className="flex-1 min-w-[30%] bg-black/40 border border-gray-800/80 p-2 rounded-lg shadow-inner">
                               <div className="text-[10px] text-gray-500 truncate mb-1">{t('stats.skill_survival', '生存本能')}</div>
                               <div className="text-yellow-400/90 font-bold text-sm">Lv.{activeSlave.isInjured ? Math.floor((activeSlave.skills?.survival || 1) * 0.5) : (activeSlave.skills?.survival || 1)}</div>
                            </div>
                         </div>
                         
                         <div className="text-[10px] text-gray-500 font-bold tracking-widest border-b border-gray-800 pb-1 mt-3">{t('slave_panel.passive', '［血脈被動］')}</div>
                         <div className="bg-black/40 p-3 rounded-lg border border-gray-800/80 text-[10px] leading-relaxed text-yellow-500/80 font-bold shadow-inner">
                            {activeSlave.race === '人類' && t('passive.human', '【絕境意志】血量低於 40% 時爆發，武力提升 25%。')}
                            {activeSlave.race === '精靈' && t('passive.elf', '【風之眷顧】速度提升 20%，若取得先手則首擊傷害增加 15%。')}
                            {activeSlave.race === '半獸人' && t('passive.orc', '【狂熱戰血】武力提升 15%，防禦降低 10%。受擊疊加印記，最高增傷 30%。')}
                            {activeSlave.race === '矮人' && t('passive.dwarf', '【堅岩體魄】最大血量提升 20%，防禦提升 15%。受擊固定減免 5 點傷害。')}
                            {activeSlave.race === '龍族' && t('passive.dragon', '【真龍威壓】武力、防禦、速度全面提升 10%，自帶 20% 最終傷害減免。')}
                            {activeSlave.race === '不死族' && t('passive.undead', '【枯骨不朽】每次攻擊造成傷害時，將吸收 15% 轉化為自身生命力。')}
                         </div>
                      </div>
                    </div>
                  )}

                  {slaveTab === 'status' && (
                    <div className="flex flex-col gap-4 animate-fade-in relative overflow-hidden">
                       <div className="flex flex-col gap-3 bg-black/40 p-4 rounded-lg border border-gray-800/80 shadow-inner font-mono text-xs">
                          <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between text-gray-500 font-bold tracking-widest">
                                <span>{t('stats.stamina', '體力')} (Stamina)</span>
                                <span className="text-green-500/90">{activeSlave.conditionStats.stamina}/100</span>
                             </div>
                             <div className="w-full h-2 bg-gray-900 rounded-sm border border-gray-800 overflow-hidden">
                                <div className="bg-green-600/80 h-full shadow-[0_0_8px_rgba(22,163,74,0.5)] transition-all" style={{ width: `${activeSlave.conditionStats.stamina}%` }}></div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between text-gray-500 font-bold tracking-widest">
                                <span>{t('stats.stress', '壓力')} (Stress)</span>
                                <span className="text-yellow-500/90">{activeSlave.conditionStats.stress}/100</span>
                             </div>
                             <div className="w-full h-2 bg-gray-900 rounded-sm border border-gray-800 overflow-hidden">
                                <div className="bg-yellow-600/80 h-full shadow-[0_0_8px_rgba(202,138,4,0.5)] transition-all" style={{ width: `${activeSlave.conditionStats.stress}%` }}></div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <div className="flex justify-between text-gray-500 font-bold tracking-widest">
                                <span>{t('stats.rebellion', '反抗')} (Rebellion)</span>
                                <span className="text-red-500/90">{activeSlave.conditionStats.rebellion}/100</span>
                             </div>
                             <div className="w-full h-2 bg-gray-900 rounded-sm border border-gray-800 overflow-hidden">
                                <div className="bg-red-600/80 h-full shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-all" style={{ width: `${activeSlave.conditionStats.rebellion}%` }}></div>
                             </div>
                          </div>
                          <div className="h-px bg-gray-800 my-1"></div>
                          <div className="flex justify-between items-center text-gray-500 font-bold tracking-widest">
                             <span>{t('stats.obedience', '服從度')} (Obedience)</span>
                             <span className={activeSlave.primaryStats.obedience < 20 ? 'text-red-500/90 font-bold animate-pulse' : 'text-indigo-400/90'}>{activeSlave.primaryStats.obedience}/100</span>
                          </div>
                       </div>

                       <div className="flex flex-col gap-3">
                          <div className="bg-black/40 p-3 rounded-lg border border-gray-800/80 text-xs shadow-inner">
                             <div className="text-gray-500 font-bold mb-1.5 tracking-widest border-b border-gray-800 pb-1">{t('slave_panel.weapon', '［當前武裝］')}</div>
                             <span className="text-blue-400/90 font-bold">
                                {activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId] 
                                  ? `【${t(ITEMS_DATA[activeSlave.equipment.weaponId].name)}】`
                                  : t('slave_panel.no_weapon', '［無配戴武器］')}
                             </span>
                          </div>
                          
                          <div className="bg-black/40 p-3 rounded-lg border border-gray-800/80 text-xs shadow-inner">
                             <div className="text-gray-500 font-bold mb-2 tracking-widest border-b border-gray-800 pb-1">{t('slave_panel.record', '［戰鬥履歷］')}</div>
                             <div className="flex justify-around items-center font-mono mt-1">
                                <div className="text-center"><div className="text-[10px] text-gray-600 mb-1">{t('slave_panel.wins', '勝場')}</div><div className="text-green-500/90 font-black text-lg">{activeSlave.combatRecord?.wins || 0}</div></div>
                                <div className="text-gray-800 font-light text-2xl">/</div>
                                <div className="text-center"><div className="text-[10px] text-gray-600 mb-1">{t('slave_panel.losses', '敗場')}</div><div className="text-red-500/90 font-black text-lg">{activeSlave.combatRecord?.losses || 0}</div></div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-600 tracking-widest font-mono p-4 text-center italic bg-black/20">
                {t('slave_panel.select_prompt', '［請選擇成員查看詳細屬性］')}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
