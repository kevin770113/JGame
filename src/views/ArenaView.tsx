import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // ★ V2.10.0 引入翻譯引擎
import { useGameStore } from '../store/useGameStore';
import WheelPicker, { WheelOption } from '../components/WheelPicker';

export default function ArenaView() {
  const { t } = useTranslation(); // ★ V2.10.0 掛載翻譯函數
  const { location } = useGameStore((state) => state.player);
  const navigate = useGameStore((state) => state.navigate);
  const executeArenaBattle = useGameStore((state) => state.executeArenaBattle);
  const processTurn = useGameStore((state) => state.processTurn);
  
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);
  const slaves = useGameStore((state) => state.slaves);
  const actionPoints = useGameStore((state) => state.player.actionPoints);

  const [selectedFighterId, setSelectedFighterId] = useState<string>('');

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  const arenaNPCs = useGameStore((state) => state.arenaNPCs);
  const targetNPC = arenaNPCs.find(n => n.location === location);

  useEffect(() => {
    if (idleSlaves.length > 0 && !selectedFighterId) {
      setSelectedFighterId(idleSlaves[0].id);
    }
  }, [idleSlaves, selectedFighterId]);

  const currentFighter = slaves.find(s => s.id === selectedFighterId);
  const isStaminaInsufficient = currentFighter ? currentFighter.conditionStats.stamina < 20 : true;

  const startBattle = () => {
    if (!targetNPC || !selectedFighterId) return;
    if (isStaminaInsufficient) return;
    
    if (actionPoints < 1) { 
      setGlobalModal({ title: t('ui.system_warning', '［系統警告］'), message: t('ui.no_ap', '目前行動力不足。'), isConfirm: false }); 
      return; 
    }

    const result = executeArenaBattle(selectedFighterId, targetNPC.id);
    if (result) {
      setSelectedFighterId('');
      processTurn();
    }
  };

  const fighterOptions: WheelOption[] = idleSlaves.map(s => {
    const isExhausted = s.conditionStats.stamina < 20;
    return {
      value: s.id,
      label: `${s.name} (${t('stats.stamina', '體力')}: ${s.conditionStats.stamina}) ${isExhausted ? t('ui.stamina_low', '［體力不足］') : ''}`,
      disabled: isExhausted
    };
  });

  if (!targetNPC) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-gray-500 font-bold tracking-widest animate-pulse">
        {t('arena.no_target', '［該地區尚無可挑戰之目標］')}
      </div>
    );
  }

  const charismaBonusMultiplier = 1 + Math.floor(targetNPC.stats.charisma / 10) * 0.05;
  const expectedReward = Math.floor(targetNPC.rewardGold * charismaBonusMultiplier);
  const isButtonDisabled = !selectedFighterId || actionPoints < 1 || isStaminaInsufficient;

  return (
    <div className="w-full flex flex-col gap-5 pb-32 animate-fade-in relative z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">{t('arena.title', '血腥角鬥場')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t('arena.desc', '殘酷的地下死鬥，活下來的人將獲得榮耀與金錢。')}</p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          {t('ui.return_town', '［返回城鎮］')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-5 mt-2">
        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <div className="bg-gray-900/80 p-4 rounded-lg border border-red-900 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <span className="text-6xl">⚔️</span>
            </div>
            <div className="text-xs text-red-500 font-bold tracking-widest mb-1">{t('arena.current_boss', '［當前地區鎮守者］')}</div>
            <h3 className="text-xl font-black text-gray-200 mb-2 truncate group-hover:text-red-400 transition-colors">
              {targetNPC.name}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed italic mb-3 min-h-[40px]">
              「{targetNPC.description}」
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-950 p-3 rounded border border-gray-800 text-xs">
              <div className="flex justify-between"><span>{t('stats.combat', '武力')}:</span> <span className="text-red-400 font-bold font-mono">{targetNPC.stats.combat}</span></div>
              <div className="flex justify-between"><span>{t('stats.endurance', '體質')}:</span> <span className="text-green-400 font-bold font-mono">{targetNPC.stats.endurance}</span></div>
              <div className="flex justify-between"><span>{t('stats.intelligence', '智力')}:</span> <span className="text-blue-400 font-bold font-mono">{targetNPC.stats.intelligence}</span></div>
              <div className="flex justify-between"><span>{t('stats.charisma', '魅力')}:</span> <span className="text-pink-400 font-bold font-mono">{targetNPC.stats.charisma}</span></div>
              <div className="flex justify-between col-span-2"><span>{t('stats.luck', '幸運')}:</span> <span className="text-yellow-400 font-bold font-mono">{targetNPC.stats.luck}</span></div>
            </div>

            <div className="mt-3 text-xs text-gray-500 tracking-widest">
              {t('arena.expected_reward', '期望賞金:')} <strong className="text-yellow-500">{expectedReward}</strong> {t('ui.gold', '資金')} 
              {charismaBonusMultiplier > 1 && <span className="text-3xs text-gray-600 ml-1">{t('arena.charisma_bonus', '(含魅力加成)')}</span>}
              {targetNPC.rewardPrestige > 0 && <span className="ml-2">| {t('ui.prestige', '威望:')} <strong className="text-blue-400">+{targetNPC.rewardPrestige}</strong></span>}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-4 bg-gray-900/60 p-4 rounded-lg border border-gray-800 justify-between min-h-[220px]">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-bold tracking-widest border-l-2 border-yellow-600 pl-2 mb-1">{t('arena.dispatch_fighter', '［派遣鬥士］')}</label>
            
            {idleSlaves.length > 0 ? (
              <WheelPicker options={fighterOptions} value={selectedFighterId} onChange={setSelectedFighterId} />
            ) : (
              <div className="text-xs text-red-500 p-3 border border-red-900/30 rounded bg-red-950/20 text-center tracking-widest">
                {t('arena.no_idle_fighter', '無閒置成員可參賽。')}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <div className="text-xs text-gray-500 italic leading-relaxed">
              ※ {t('arena.warning_cost_1', '參賽將')} <strong className="text-yellow-500">{t('arena.warning_cost_2', '強制消耗 1 點行動力推進時段')}</strong>{t('arena.warning_cost_3', '，並消耗該鬥士 20 點體力。')}
            </div>
            
            <button 
              onClick={startBattle} 
              disabled={isButtonDisabled} 
              className={`w-full py-3.5 rounded font-bold text-xs tracking-widest border transition-all ${
                isButtonDisabled 
                  ? 'bg-gray-950 text-gray-600 border-gray-850 cursor-not-allowed shadow-none opacity-50' 
                  : 'bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 hover:border-red-600 shadow-md active:scale-98'
              }`}
            >
              {isStaminaInsufficient && idleSlaves.length > 0 ? t('ui.stamina_insufficient', '［體力不足，無法戰鬥］') : t('ui.start_battle', '［開始戰鬥］')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
