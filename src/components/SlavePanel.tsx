import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { Slave } from '../types';
import { ITEMS_DATA, getSlavePortraitUrl } from '../utils/gameData';
import { parseLocalizedName } from '../utils/i18nUtils';

// ★ 雷達圖專業化：移除 SVG 文字，純繪製幾何網格，留待外部 HTML 標籤定位
const renderRadar = (slave: Slave) => {
  const weaponAtk = (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) 
    ? (ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0) : 0;

  // 中心點為 60,60，最大半徑 45
  const getP = (val: number, angleIndex: number, maxR = 45) => {
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
    <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
      <polygon points={bg100} fill="rgba(17, 24, 39, 0.7)" stroke="#374151" strokeWidth="1" />
      <polygon points={bg75} fill="none" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
      <polygon points={bg50} fill="none" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
      <polygon points={bg25} fill="none" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
      
      <line x1="60" y1="60" x2={getP(100,0).split(',')[0]} y2={getP(100,0).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
      <line x1="60" y1="60" x2={getP(100,1).split(',')[0]} y2={getP(100,1).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
      <line x1="60" y1="60" x2={getP(100,2).split(',')[0]} y2={getP(100,2).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
      <line x1="60" y1="60" x2={getP(100,3).split(',')[0]} y2={getP(100,3).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
      <line x1="60" y1="60" x2={getP(100,4).split(',')[0]} y2={getP(100,4).split(',')[1]} stroke="#374151" strokeWidth="0.75" />

      <polygon points={statPoints} fill="rgba(147, 51, 234, 0.45)" stroke="#a855f7" strokeWidth="1.2" className="transition-all duration-700 ease-out" />
    </svg>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => setActiveWindow(null)}></div>
      )}

      <div className={`fixed right-0 top-0 h-full w-full max-w-lg sm:max-w-2xl bg-gray-950 border-l border-purple-900/40 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-3 sm:p-4 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest">{t('slave_panel.title', '［商隊成員總覽看板］')}</h3>
          <button onClick={() => setActiveWindow(null)} className="text-gray-500 hover:text-red-400 text-xl font-bold border border-gray-800 bg-gray-950/50 w-7 h-7 flex items-center justify-center rounded">×</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左側高密度名單欄位 - 極簡壓縮 */}
          <div className="w-[85px] sm:w-[100px] border-r border-gray-900 bg-gray-950 flex flex-col overflow-y-auto scrollbar-none divide-y divide-gray-900 shrink-0">
            {slaves.map((slave) => {
              const isSelected = slave.id === activeSlaveId;
              const localizedName = parseLocalizedName(slave.name);
              return (
                <button
                  key={slave.id}
                  onClick={() => setActiveSlaveId(slave.id)}
                  className={`w-full p-2 flex flex-col items-left text-left gap-0.5 transition-all relative overflow-hidden border-l-2 ${isSelected ? 'bg-purple-950/15 border-l-purple-500' : 'border-l-transparent hover:bg-gray-900/30'}`}
                >
                  <span className={`text-[11px] font-bold truncate block w-full ${isSelected ? 'text-purple-400' : 'text-gray-400'}`}>
                    {localizedName}
                  </span>
                  <span className={`text-[9px] font-mono font-bold truncate block w-full ${slave.gender === 'Male' ? 'text-blue-500/80' : 'text-red-500/80'}`}>
                    {t(`race.${slave.race}`, slave.race)}
                  </span>
                </button>
              );
            })}
            {slaves.length === 0 && (
              <div className="p-4 text-center text-3xs text-gray-700 tracking-widest leading-relaxed">
                {t('slave_panel.empty_roster', '目前麾下空無一人')}
              </div>
            )}
          </div>

          {/* 右側詳細資料面板 */}
          <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden relative">
            {activeSlave ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* 高張力英雄式橫幅 (Hero Banner) */}
                <div className="relative w-full h-48 sm:h-56 shrink-0 bg-black border-b border-gray-900">
                  <img 
                    src={getSlavePortraitUrl(activeSlave)} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover object-[center_15%] opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-10">
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-xl sm:text-2xl font-bold text-gray-200 tracking-wider drop-shadow-lg">{parseLocalizedName(activeSlave.name)}</h4>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                        <span className="bg-black/80 px-2 py-0.5 rounded text-gray-400 border border-gray-800">{t('stats.gender', '性別')}: {activeSlave.gender === 'Male' ? t('gender.male_short', '男') : t('gender.female_short', '女')}</span>
                        <span className="bg-black/80 px-2 py-0.5 rounded text-gray-400 border border-gray-800">{t('stats.race', '種族')}: {t(`race.${activeSlave.race}`, activeSlave.race)}</span>
                        {activeSlave.activityStatus !== '閒置' && (
                          <span className="bg-yellow-950/90 border border-yellow-900 text-yellow-500 font-bold px-2 py-0.5 rounded shadow-sm">
                            {t(`activity_status.${activeSlave.activityStatus}`, activeSlave.activityStatus)}
                          </span>
                        )}
                        {activeSlave.isInjured && (
                          <span className="bg-red-950/90 border border-red-900 text-red-500 font-bold px-2 py-0.5 rounded animate-pulse shadow-sm">
                            {t('status.injured_short', '負傷')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-900 shrink-0 bg-gray-900/30 font-mono">
                  <button onClick={() => setSlaveTab('ability')} className={`flex-1 py-2.5 text-xs font-bold tracking-widest transition-colors ${slaveTab === 'ability' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-950/15' : 'text-gray-500'}`}>{t('slave_panel.tab_ability', '［戰鬥能力］')}</button>
                  <button onClick={() => setSlaveTab('status')} className={`flex-1 py-2.5 text-xs font-bold tracking-widest transition-colors ${slaveTab === 'status' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-950/15' : 'text-gray-500'}`}>{t('slave_panel.tab_status', '［綜合狀態］')}</button>
                </div>

                {/* 數據滾動區 */}
                <div className="flex-1 overflow-y-auto scrollbar-none p-3 pb-6 flex flex-col gap-4">
                  {slaveTab === 'ability' && (
                    <div className="flex flex-col gap-4 animate-fade-in">
                      
                      {/* ★ 強制左右並排的高密度金融資料區 */}
                      <div className="flex flex-row gap-3 sm:gap-4 items-center bg-black/30 rounded-lg border border-gray-800/80 p-3 shadow-inner">
                        
                        {/* 左側：精準 HTML 定位的雷達圖 */}
                        <div className="relative w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] shrink-0 mx-auto sm:mx-0">
                          {renderRadar(activeSlave)}
                          
                          {/* HTML 絕對定位文字，不受 SVG 縮放影響，字體大小永遠清晰一致 */}
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] text-red-400/90 font-mono font-bold leading-none">{t('stats.combat', '武')}</span>
                          <span className="absolute top-[28%] -right-2 text-[9px] text-blue-400/90 font-mono font-bold leading-none">{t('stats.intelligence', '智')}</span>
                          <span className="absolute bottom-2 -right-1 text-[9px] text-pink-400/90 font-mono font-bold leading-none">{t('stats.charisma', '魅')}</span>
                          <span className="absolute bottom-2 -left-1 text-[9px] text-yellow-400/90 font-mono font-bold leading-none">{t('stats.luck', '幸')}</span>
                          <span className="absolute top-[28%] -left-2 text-[9px] text-green-400/90 font-mono font-bold leading-none">{t('stats.endurance', '體')}</span>
                        </div>
                        
                        {/* 右側：緊密型鍵值對資料列 (Compact Data Rows) */}
                        <div className="flex-1 flex flex-col gap-0.5 justify-center min-w-0">
                          <div className="flex justify-between items-center border-b border-gray-800/60 pb-1">
                            <span className="text-[10px] text-gray-500 font-bold truncate pr-1">{t('stats.combat', '武力')}</span>
                            {activeSlave.isInjured ? (
                              <div className="flex items-center gap-1">
                                <span className="text-gray-600 text-[9px]">({activeSlave.primaryStats.combat})</span>
                                <span className="text-red-500 font-bold text-xs font-mono">{Math.floor(activeSlave.primaryStats.combat * 0.5)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                {activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId] && <span className="text-green-500/80 mr-1 text-[10px] font-mono">+{ITEMS_DATA[activeSlave.equipment.weaponId].effect.attack}</span>}
                                <span className="text-red-400/90 font-bold text-xs font-mono">{activeSlave.primaryStats.combat + ((activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId]) ? (ITEMS_DATA[activeSlave.equipment.weaponId].effect.attack || 0) : 0)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-800/60 py-1">
                            <span className="text-[10px] text-gray-500 font-bold truncate pr-1">{t('stats.endurance', '體質')}</span>
                            {activeSlave.isInjured ? (
                               <div className="flex items-center gap-1"><span className="text-gray-600 text-[9px]">({activeSlave.primaryStats.endurance})</span><span className="text-red-500 font-bold text-xs font-mono">{Math.floor(activeSlave.primaryStats.endurance * 0.5)}</span></div>
                            ) : (<span className="text-green-400/90 font-bold text-xs font-mono">{activeSlave.primaryStats.endurance}</span>)}
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-800/60 py-1">
                            <span className="text-[10px] text-gray-500 font-bold truncate pr-1">{t('stats.intelligence', '智力')}</span>
                            {activeSlave.isInjured ? (
                               <div className="flex items-center gap-1"><span className="text-gray-600 text-[9px]">({activeSlave.primaryStats.intelligence})</span><span className="text-red-500 font-bold text-xs font-mono">{Math.floor(activeSlave.primaryStats.intelligence * 0.5)}</span></div>
                            ) : (<span className="text-blue-400/90 font-bold text-xs font-mono">{activeSlave.primaryStats.intelligence}</span>)}
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-800/60 py-1">
                            <span className="text-[10px] text-gray-500 font-bold truncate pr-1">{t('stats.charisma', '魅力')}</span>
                            <span className="text-pink-400/90 font-bold text-xs font-mono">{activeSlave.primaryStats.charisma ?? 10}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-800/60 py-1">
                            <span className="text-[10px] text-gray-500 font-bold truncate pr-1">{t('stats.luck', '幸運')}</span>
                            <span className="text-yellow-400/90 font-bold text-xs font-mono">{activeSlave.primaryStats.luck ?? 10}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-[10px] text-gray-500 font-bold truncate pr-1">{t('stats.obedience', '服從度')}</span>
                            <span className="text-indigo-400/90 font-bold text-xs font-mono">{activeSlave.primaryStats.obedience}</span>
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-col gap-1.5 font-mono text-3xs">
                        <div className="text-gray-500 font-bold border-b border-gray-900 pb-1">{t('slave_panel.skills', '［掌握技能］')}</div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-black/40 border border-gray-800/80 p-2 rounded-lg shadow-inner">
                            <div className="text-gray-600 mb-1">{t('stats.skill_combat', '戰鬥專精')}</div>
                            <div className="text-blue-400/90 font-bold text-sm">Lv.{activeSlave.isInjured ? Math.floor((activeSlave.skills?.combat || 1) * 0.5) : (activeSlave.skills?.combat || 1)}</div>
                          </div>
                          <div className="bg-black/40 border border-gray-800/80 p-2 rounded-lg shadow-inner">
                            <div className="text-gray-600 mb-1">{t('stats.skill_housework', '內政管家')}</div>
                            <div className="text-green-400/90 font-bold text-sm">Lv.{activeSlave.isInjured ? Math.floor((activeSlave.skills?.housework || 1) * 0.5) : (activeSlave.skills?.housework || 1)}</div>
                          </div>
                          <div className="bg-black/40 border border-gray-800/80 p-2 rounded-lg shadow-inner">
                            <div className="text-gray-600 mb-1">{t('stats.skill_survival', '生存本能')}</div>
                            <div className="text-yellow-400/90 font-bold text-sm">Lv.{activeSlave.isInjured ? Math.floor((activeSlave.skills?.survival || 1) * 0.5) : (activeSlave.skills?.survival || 1)}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 font-mono text-3xs">
                         <div className="text-gray-500 font-bold border-b border-gray-900 pb-1">{t('slave_panel.passive', '［血脈被動］')}</div>
                         <div className="bg-black/40 p-3 rounded-lg border border-gray-800/80 text-[10px] leading-relaxed text-yellow-600/90 font-bold shadow-inner">
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
                    <div className="flex flex-col gap-3 animate-fade-in">
                       <div className="flex flex-col gap-3 bg-black/40 p-4 rounded-lg border border-gray-800/80 font-mono text-[11px] shadow-inner">
                          <div className="flex flex-col gap-1">
                             <div className="flex justify-between text-gray-500 font-bold">
                                <span>{t('stats.stamina', '體力')}</span>
                                <span className="text-green-500/90 font-mono">{activeSlave.conditionStats.stamina}/100</span>
                             </div>
                             <div className="w-full h-2 bg-gray-900 rounded border border-gray-800 overflow-hidden">
                                <div className="bg-green-600/80 h-full transition-all shadow-[0_0_8px_rgba(22,163,74,0.4)]" style={{ width: `${activeSlave.conditionStats.stamina}%` }}></div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-1">
                             <div className="flex justify-between text-gray-500 font-bold">
                                <span>{t('stats.stress', '壓力')}</span>
                                <span className="text-yellow-500/90 font-mono">{activeSlave.conditionStats.stress}/100</span>
                             </div>
                             <div className="w-full h-2 bg-gray-900 rounded border border-gray-800 overflow-hidden">
                                <div className="bg-yellow-600/80 h-full transition-all shadow-[0_0_8px_rgba(202,138,4,0.4)]" style={{ width: `${activeSlave.conditionStats.stress}%` }}></div>
                             </div>
                          </div>
                          <div className="flex flex-col gap-1">
                             <div className="flex justify-between text-gray-500 font-bold">
                                <span>{t('stats.rebellion', '反抗')}</span>
                                <span className="text-red-500/90 font-mono">{activeSlave.conditionStats.rebellion}/100</span>
                             </div>
                             <div className="w-full h-2 bg-gray-900 rounded border border-gray-800 overflow-hidden">
                                <div className="bg-red-600/80 h-full transition-all shadow-[0_0_8px_rgba(220,38,38,0.4)]" style={{ width: `${activeSlave.conditionStats.rebellion}%` }}></div>
                             </div>
                          </div>
                          <div className="h-px bg-gray-800/80 my-1"></div>
                          <div className="flex justify-between items-center text-gray-400 font-bold">
                             <span>{t('stats.obedience', '服從度')}</span>
                             <span className={activeSlave.primaryStats.obedience < 20 ? 'text-red-400 font-bold animate-pulse font-mono text-sm' : 'text-indigo-400/90 font-mono text-sm'}>{activeSlave.primaryStats.obedience}/100</span>
                          </div>
                       </div>

                       <div className="bg-black/40 p-3.5 rounded-lg border border-gray-800/80 text-xs font-mono shadow-inner flex flex-col gap-2">
                          <div className="text-gray-500 font-bold tracking-widest">{t('slave_panel.weapon', '［當前武裝］')}</div>
                          <span className="text-blue-400/90 font-bold">
                             {activeSlave.equipment?.weaponId && ITEMS_DATA[activeSlave.equipment.weaponId] 
                               ? `【${t(ITEMS_DATA[activeSlave.equipment.weaponId].name)}】`
                               : t('slave_panel.no_weapon', '［無配戴武器］')}
                          </span>
                       </div>
                       
                       <div className="bg-black/40 p-3.5 rounded-lg border border-gray-800/80 text-xs font-mono shadow-inner flex flex-col gap-2">
                          <div className="text-gray-500 font-bold tracking-widest">{t('slave_panel.record', '［戰鬥履歷］')}</div>
                          <div className="flex justify-around items-center font-mono py-1">
                             <div className="text-center"><div className="text-[10px] text-gray-600 mb-1">{t('slave_panel.wins', '勝場')}</div><div className="text-green-500/90 font-bold text-lg font-mono">{activeSlave.combatRecord?.wins || 0}</div></div>
                             <div className="text-gray-800 font-light text-xl">/</div>
                             <div className="text-center"><div className="text-[10px] text-gray-600 mb-1">{t('slave_panel.losses', '敗場')}</div><div className="text-red-500/90 font-bold text-lg font-mono">{activeSlave.combatRecord?.losses || 0}</div></div>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-600 tracking-widest font-mono p-4 text-center italic bg-black/10">
                {t('slave_panel.select_prompt', '［請選擇成員查看詳細屬性］')}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
