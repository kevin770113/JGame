import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { formatK } from '../types';

const ApCountdown = ({ actionPoints, lastApUpdateTime }: { actionPoints: number, lastApUpdateTime: number }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (actionPoints >= 50) return;
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - lastApUpdateTime;
      const remaining = Math.max(0, 60000 - (elapsed % 60000));
      setTimeLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [actionPoints, lastApUpdateTime]);

  if (actionPoints >= 50) return null;

  const seconds = Math.floor(timeLeft / 1000);
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  
  return <span className="text-gray-500 text-3xs ml-1 font-mono tracking-tighter">({m}:{s})</span>;
};

export default function Header() {
  const { t } = useTranslation();
  const { 
    day, timePhase, gold, food, location, roomDirtiness, maxSlaveCapacity, prestige, actionPoints,
    leaderName, leaderGender, leaderStamina, leaderFaintTurns, lastApUpdateTime
  } = useGameStore((state) => state.player);
  
  const slaves = useGameStore((state) => state.slaves);
  const processTurn = useGameStore((state) => state.processTurn);
  const checkApRecovery = useGameStore((state) => state.checkApRecovery);
  
  const setPlayerNameAndGender = useGameStore((state) => state.setPlayerNameAndGender);
  const useItem = useGameStore((state) => state.useItem);
  const inventory = useGameStore((state) => state.player.inventory);
  
  const [showLeaderPanel, setShowLeaderPanel] = useState(false);
  const [editName, setEditName] = useState('');

  const safeLeaderStamina = isNaN(leaderStamina) ? 100 : leaderStamina;

  useEffect(() => {
    const timer = setInterval(() => {
      checkApRecovery();
    }, 1000);
    return () => clearInterval(timer);
  }, [checkApRecovery]);

  const getLocationName = () => {
    switch (location) {
      case 'Frontlines': return t('location.frontlines', '前線');
      case 'NeutralHub': return t('location.neutral_hub', '中立城');
      case 'Capital': return t('location.capital', '皇城');
      default: return t('location.unknown', '未知');
    }
  };

  const getTimeSlotName = () => {
    switch (timePhase) {
      case '早上': return t('time.morning', '清晨');
      case '中午': return t('time.noon', '正午');
      case '下午': return t('time.evening', '黃昏');
      case '晚上': return t('time.night', '深夜');
      case '深夜': return t('time.late_night', '凌晨');
      default: return t('time.unknown', '時空錯置');
    }
  };

  const getDirtinessDisplay = () => {
    if (roomDirtiness < 20) return <span className="text-green-400">{t('dirtiness.clean', '乾淨')}({roomDirtiness}%)</span>;
    if (roomDirtiness < 50) return <span className="text-yellow-400">{t('dirtiness.normal', '尚可')}({roomDirtiness}%)</span>;
    if (roomDirtiness < 80) return <span className="text-orange-400">{t('dirtiness.dirty', '髒亂')}({roomDirtiness}%)</span>;
    return <span className="text-red-500 font-bold animate-pulse">{t('dirtiness.awful', '惡劣')}({roomDirtiness}%)</span>;
  };

  const openLeaderPanel = () => {
    setEditName(leaderName);
    setShowLeaderPanel(true);
  };

  const handleSaveLeader = () => {
    if (editName.trim()) {
      setPlayerNameAndGender(editName.trim(), leaderGender);
    }
  };

  const handleDrinkPotion = () => {
    if (inventory['potion_heal_small'] > 0) {
      useItem('potion_heal_small', 'LEADER');
    }
  };

  const activeDispatches = useGameStore(state => state.activeDispatches);
  const isLeaderDispatched = activeDispatches.some(d => d.slaveId === 'LEADER');
  const leaderStatus = leaderFaintTurns > 0 ? `${t('leader.faint', '重傷昏厥')} (${leaderFaintTurns})` : isLeaderDispatched ? t('leader.dispatched', '外派中') : t('leader.idle', '閒置');

  return (
    <>
      <div className="bg-gray-950 border-b border-gray-800 p-2 flex items-stretch shadow-md select-none sticky top-0 z-30 min-h-[4rem]">
        
        <div className="flex items-center h-full mr-2 sm:mr-3 shrink-0">
          <div 
            onClick={openLeaderPanel}
            className="aspect-square w-12 sm:w-14 bg-gray-900 border-2 border-gray-700 rounded-md flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors shadow-inner overflow-hidden"
          >
            <span className="text-xs font-bold text-gray-500 text-center leading-tight">
              {leaderGender === 'Male' ? t('leader.male', '首領\n(男)') : t('leader.female', '首領\n(女)')}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between text-[11px] sm:text-xs font-bold tracking-widest py-0.5">
          <div className="flex justify-between items-center text-gray-400 border-b border-gray-800/50 pb-0.5">
            <span className="flex items-center gap-1">
              <span>[{t('ui.day_prefix', '第')}{day}{t('ui.day_suffix', '天')} - <span className="text-gray-200">{getTimeSlotName()}</span>]</span>
              <span className="border-l border-gray-700 h-2.5 mx-0.5 sm:mx-1"></span>
              <span>[{getLocationName()}]</span>
            </span>
            <span>
              {t('stats.prestige', '威望')}: <span className="text-blue-400 font-mono">{formatK(prestige)}</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-gray-500 border-b border-gray-800/50 pb-0.5">
            <span className="flex gap-2 sm:gap-3">
              <span>{t('stats.gold', '資金')}: <span className="text-yellow-500 font-mono">${formatK(gold)}</span></span>
              <span>{t('stats.food', '糧食')}: <span className="text-green-500 font-mono">{formatK(food)}</span></span>
            </span>
            <span>
              {t('ui.population', '人口')}: <span className={slaves.length > maxSlaveCapacity ? 'text-red-500 animate-pulse' : 'text-gray-300'}>{slaves.length}/{maxSlaveCapacity}</span>
            </span>
          </div>

          <div className="flex justify-between items-center text-gray-500">
            <span className="flex items-center gap-1">
              <span>
                {t('stats.ap', 'AP')}: <span className={actionPoints < 10 ? 'text-red-500 font-mono animate-pulse' : 'text-blue-400 font-mono'}>{actionPoints}/50</span>
              </span>
              <ApCountdown actionPoints={actionPoints} lastApUpdateTime={lastApUpdateTime} />
              <button 
                onClick={processTurn}
                disabled={actionPoints < 1}
                className={`ml-1 px-1.5 py-0.5 rounded text-3xs sm:text-2xs transition-colors shadow-sm ${
                  actionPoints >= 1 ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'
                }`}
              >
                {t('ui.advance', '［推進］')}
              </button>
            </span>
            <span>{t('ui.environment', '環境')}: {getDirtinessDisplay()}</span>
          </div>
        </div>
      </div>

      {showLeaderPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-gray-700 rounded-lg shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-slide-up">
            
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-200 tracking-widest">{t('leader.panel_title', '［首領專屬面板］')}</h3>
              <button onClick={() => setShowLeaderPanel(false)} className="text-gray-500 hover:text-white font-bold transition-colors text-lg">×</button>
            </div>

            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-bold tracking-widest">{t('leader.name_label', '首領稱呼')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveLeader}
                    className="flex-1 bg-black/50 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-200 font-bold focus:outline-none focus:border-gray-500"
                    placeholder={t('leader.name_placeholder', '輸入名稱')}
                  />
                  <button 
                    onClick={() => setPlayerNameAndGender(leaderName, leaderGender === 'Male' ? 'Female' : 'Male')}
                    className="px-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded text-xs font-bold transition-colors whitespace-nowrap tracking-widest"
                  >
                    {t('leader.switch_gender', '切換')}: {leaderGender === 'Male' ? t('gender.male', '男性') : t('gender.female', '女性')}
                  </button>
                </div>
              </div>

              <div className="bg-gray-900/50 p-3 rounded border border-gray-800 flex flex-col gap-2 shadow-inner">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-400">{t('leader.current_status', '當前狀態')}: <span className={leaderFaintTurns > 0 ? 'text-red-400 animate-pulse' : isLeaderDispatched ? 'text-yellow-400' : 'text-green-400'}>{leaderStatus}</span></span>
                  <span className="text-gray-400">{t('stats.stamina', '體力')}: <span className={safeLeaderStamina < 30 ? 'text-red-400 font-mono' : 'text-green-400 font-mono'}>{safeLeaderStamina}/100</span></span>
                </div>
                <div className="w-full h-1.5 bg-gray-950 rounded overflow-hidden flex border border-gray-800">
                  <div className={`h-full ${safeLeaderStamina < 30 ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${safeLeaderStamina}%` }}></div>
                </div>
                <div className="flex justify-end mt-1">
                  <button 
                    onClick={handleDrinkPotion}
                    disabled={(inventory['potion_heal_small'] || 0) <= 0}
                    className={`px-3 py-1.5 rounded text-xs font-bold tracking-widest transition-colors shadow ${
                      (inventory['potion_heal_small'] || 0) > 0 
                        ? 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700 active:scale-95' 
                        : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'
                    }`}
                  >
                    {t('leader.drink_potion', '［飲用藥水］')} ({t('ui.remaining', '剩餘')}: {inventory['potion_heal_small'] || 0})
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-bold tracking-widest">{t('leader.stats_label', '首領能力 (不可成長)')}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 flex justify-between">
                    <span className="text-gray-500 font-bold">{t('stats.combat', '武力')}</span><span className="text-red-400 font-mono font-bold">25</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 flex justify-between">
                    <span className="text-gray-500 font-bold">{t('stats.endurance', '體質')}</span><span className="text-green-400 font-mono font-bold">30</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 flex justify-between">
                    <span className="text-gray-500 font-bold">{t('stats.intelligence', '智力')}</span><span className="text-blue-400 font-mono font-bold">45</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 flex justify-between">
                    <span className="text-gray-500 font-bold">{t('stats.charisma', '魅力')}</span><span className="text-pink-400 font-mono font-bold">30</span>
                  </div>
                  <div className="bg-gray-900 p-2 rounded border border-gray-800 flex justify-between col-span-2">
                    <span className="text-gray-500 font-bold">{t('stats.luck', '幸運')}</span><span className="text-yellow-400 font-mono font-bold">50</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded text-3xs font-bold tracking-widest">{t('stats.skill_combat', '戰鬥專精')} Lv.1</span>
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded text-3xs font-bold tracking-widest">{t('stats.skill_survival', '生存本能')} Lv.3</span>
                  <span className="px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded text-3xs font-bold tracking-widest">{t('stats.skill_housework', '內政管家')} Lv.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
