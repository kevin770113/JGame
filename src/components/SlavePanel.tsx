import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { Slave } from '../types';
import { ITEMS_DATA, getSlavePortraitUrl } from '../utils/gameData';
import { parseLocalizedName } from '../utils/i18nUtils';

const renderRadar = (slave: Slave, t: any) => {
  const weaponAtk = (slave.equipment?.weaponId && ITEMS_DATA[slave.equipment.weaponId]) 
    ? (ITEMS_DATA[slave.equipment.weaponId].effect.attack || 0) : 0;

  const getP = (val: number, angleIndex: number, maxR = 38) => {
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
    <div className="relative w-44 h-44 sm:w-52 sm:h-52 shrink-0 flex items-center justify-center mx-auto overflow-visible">
       <svg viewBox="-20 -20 160 160" className="w-full h-full drop-shadow-md overflow-visible">
          <polygon points={bg100} fill="rgba(17, 24, 39, 0.6)" stroke="#374151" strokeWidth="1" />
          <polygon points={bg75} fill="none" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
          <polygon points={bg50} fill="none" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
          <polygon points={bg25} fill="none" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2 2" />
          
          <line x1="60" y1="60" x2={getP(100,0).split(',')[0]} y2={getP(100,0).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
          <line x1="60" y1="60" x2={getP(100,1).split(',')[0]} y2={getP(100,1).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
          <line x1="60" y1="60" x2={getP(100,2).split(',')[0]} y2={getP(100,2).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
          <line x1="60" y1="60" x2={getP(100,3).split(',')[0]} y2={getP(100,3).split(',')[1]} stroke="#374151" strokeWidth="0.75" />
          <line x1="60" y1="60" x2={getP(100,4).split(',')[0]} y2={getP(100,4).split(',')[1]} stroke="#374151" strokeWidth="0.75" />

          <polygon points={statPoints} fill="rgba(147, 51, 234, 0.45)" stroke="#a855f7" strokeWidth="1.25" className="transition-all duration-700 ease-out" />

          {/* 數值資訊直接掛載至網格頂點，外推排版極致硬朗 */}
          <text x="60" y="-4" fontSize="9" fill="#f87171" textAnchor="middle" fontWeight="bold" className="font-mono">{t('stats.combat', '武')}:{slave.primaryStats.combat + weaponAtk}</text>
          <text x="106" y="46" fontSize="9" fill="#60a5fa" textAnchor="start" fontWeight="bold" className="font-mono">{t('stats.intelligence', '智')}:{slave.primaryStats.intelligence}</text>
          <text x="92" y="106" fontSize="9" fill="#f472b6" textAnchor="start" fontWeight="bold" className="font-mono">{t('stats.charisma', '魅')}:{slave.primaryStats.charisma ?? 10}</text>
          <text x="28" y="106" fontSize="9" fill="#facc15" textAnchor="end" fontWeight="bold" className="font-mono">{t('stats.luck', '幸')}:{slave.primaryStats.luck ?? 10}</text>
          <text x="14" y="46" fontSize="9" fill="#4ade80" textAnchor="end" fontWeight="bold" className="font-mono">{t('stats.體', '體')}:{slave.primaryStats.endurance}</text>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity" onClick={() => setActiveWindow(null)}></div>
      )}

      <div className={`fixed right-0 top-0 h-full w-full max-w-lg sm:max-w-2xl bg-gray-950 border-l border-purple-900/40 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest">{t('slave_panel.title', '［商隊成員總覽看板］')}</h3>
          <button onClick={() => setActiveWindow(null)} className="text-gray-500 hover:text-white text-xl font-bold border border-gray-800 bg-gray-950/50 w-7 h-7 flex items-center justify-center rounded">×</button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左側高密度清單欄位 - 大幅限縮節省空間 */}
          <div className="w-[95px] sm:w-[110px] border-r border-gray-900 bg-gray-950 flex flex-col overflow-y-auto scrollbar-none divide-y divide-gray-900 shrink-0">
            {slaves.map((slave) => {
              const isSelected = slave.id === activeSlaveId;
              const localizedName = parseLocalizedName(slave.name);
              return (
                <button
                  key={slave.id}
                  onClick={() => setActiveSlaveId(slave.id)}
                  className={`w-full p-2 flex flex-col items-left text-left gap-0.5 transition-all relative overflow-hidden border-l-2 ${isSelected ? 'bg-purple-950/15 border-l-purple-500' : 'border-l-transparent hover:bg-gray-900/30'}`}
                >
                  <span className={`text-2xs font-bold truncate block w-full ${isSelected ? 'text-purple-400' : 'text-gray-400'}`}>
                    {localizedName}
                  </span>
                  {/* 種族文字顏色深度綁定性別：男顯示深藍，女顯示深紅 */}
                  <span className={`text-[9px] font-mono font-bold truncate block w-full ${slave.gender === 'Male' ? 'text-blue-500/80' : 'text-red-500/80'}`}>
                    {t(`race.${slave.race}`, slave.race)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 右側詳細專業面板 */}
          <div className="flex-1 flex flex-col bg-gray-950 overflow-hidden relative">
            {activeSlave ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 滿版英雄式橫幅 (Hero Banner) */}
                <div className="relative w-full h-36 sm:h-44 shrink-0 bg-black border-b border-gray-900">
                  <img src={getSlavePortraitUrl(activeSlave)} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_15%] opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent"></div>
                  <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-lg sm:text-xl font-bold text-gray-200 tracking-wider drop-shadow-md">{parseLocalizedName(activeSlave.name)}</h4>
                      <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                        <span className="bg-black/60 px-1.5 py-0.5 rounded text-gray-400 border border-gray-800">{t('stats.gender', '性別')}: {activeSlave.gender === 'Male' ? t('gender.male', '男性') : t('gender.female', '女性')}</span>
                        <span className="bg-black/60 px-1.5 py-0.5 rounded text-gray-400 border border-gray-800">{t('stats.race', '種族')}: {t(`race.${activeSlave.race}`, activeSlave.race)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-900 shrink-0 bg-gray-900/30 font-mono">
                  <button onClick={() => setSlaveTab('ability')} className={`flex-1 py-2 text-2xs font-bold tracking-widest transition-colors ${slaveTab === 'ability' ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-950/10' : 'text-gray-500'}`}>{t('slave_panel.tab_ability', '［戰鬥能力］')}</button>
                  <button onClick={() => setSlaveTab('status')} className={`flex-1 py-2 text-2xs font-bold tracking-widest transition-colors ${slaveTab === 'status' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-950/10' : 'text-gray-500'}`}>{t('slave_panel.tab_status', '［綜合狀態］')}</button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none p-3 flex flex-col gap-3">
                  {slaveTab === 'ability' && (
                    <div className="flex flex-col gap-3 animate-fade-in">
                      <div className="bg-black/20 rounded border border-gray-900 p-1">{renderRadar(activeSlave, t)}</div>
                      
                      {/* 金融級一體化緊密格線數據表 - 數據全面右對齊 */}
                      <div className="grid grid-cols-2 border border-gray-800 rounded bg-black/40 text-2xs font-mono overflow-hidden shadow-inner">
                        <div className="border-r border-b border-gray-800 p-2 flex justify-between items-center">
                          <span className="text-gray-500 font-bold">{t('stats.combat', '武力')}</span>
                          <span className="text-red-400 font-bold text-right font-mono">{activeSlave.primaryStats.combat}</span>
                        </div>
                        <div className="border-b border-gray-800 p-2 flex justify-between items-center">
                          <span className="text-gray-500 font-bold">{t('stats.endurance', '體質')}</span>
                          <span className="text-green-400 font-bold text-right font-mono">{activeSlave.primaryStats.endurance}</span>
                        </div>
                        <div className="border-r border-b border-gray-800 p-2 flex justify-between items-center">
                          <span className="text-gray-500 font-bold">{t('stats.intelligence', '智力')}</span>
                          <span className="text-blue-400 font-bold text-right font-mono">{activeSlave.primaryStats.intelligence}</span>
                        </div>
                        <div className="border-b border-gray-800 p-2 flex justify-between items-center">
                          <span className="text-gray-500 font-bold">{t('stats.charisma', '魅力')}</span>
                          <span className="text-pink-400 font-bold text-right font-mono">{activeSlave.primaryStats.charisma ?? 10}</span>
                        </div>
                        <div className="border-r border-gray-800 p-2 flex justify-between items-center">
                          <span className="text-gray-500 font-bold">{t('stats.luck', '幸運')}</span>
                          <span className="text-yellow-400 font-bold text-right font-mono">{activeSlave.primaryStats.luck ?? 10}</span>
                        </div>
                        <div className="p-2 flex justify-between items-center bg-gray-900/20">
                          <span className="text-gray-500 font-bold">{t('stats.obedience', '服從度')}</span>
                          <span className="text-indigo-400 font-bold text-right font-mono">{activeSlave.primaryStats.obedience}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 font-mono text-3xs">
                        <div className="text-gray-500 font-bold border-b border-gray-900 pb-0.5">{t('slave_panel.skills', '［掌握技能］')}</div>
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-black/30 border border-gray-900 p-1 rounded">
                            <div className="text-gray-600 scale-90">{t('stats.skill_combat', '戰鬥')}</div>
                            <div className="text-blue-400 font-bold">Lv.{activeSlave.skills.combat}</div>
                          </div>
                          <div className="bg-black/30 border border-gray-900 p-1 rounded">
                            <div className="text-gray-600 scale-90">{t('stats.skill_housework', '內政')}</div>
                            <div className="text-green-400 font-bold">Lv.{activeSlave.skills.housework}</div>
                          </div>
                          <div className="bg-black/30 border border-gray-900 p-1 rounded">
                            <div className="text-gray-600 scale-90">{t('stats.skill_survival', '生存')}</div>
                            <div className="text-yellow-400 font-bold">Lv.{activeSlave.skills.survival}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {slaveTab === 'status' && (
                    <div className="flex flex-col gap-3 animate-fade-in text-2xs font-mono">
                       <div className="flex flex-col gap-2 bg-black/40 p-3 rounded border border-gray-800">
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t('stats.stamina', '體力')}</span>
                            <span className="text-green-400 font-bold">{activeSlave.conditionStats.stamina}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t('stats.stress', '壓力')}</span>
                            <span className="text-yellow-500 font-bold">{activeSlave.conditionStats.stress}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">{t('stats.rebellion', '反抗')}</span>
                            <span className="text-red-500 font-bold">{activeSlave.conditionStats.rebellion}/100</span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-3xs text-gray-600 tracking-widest font-mono p-4 text-center italic">{t('slave_panel.select_prompt', '［請選擇成員查看詳細屬性］')}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
