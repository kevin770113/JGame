import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';
import { parseLocalizedName } from '../utils/i18nUtils';
import { getAbyssEnemy } from '../utils/generators';

export default function AbyssView() {
  const { t } = useTranslation();
  const slaves = useGameStore((state) => state.slaves);
  const { actionPoints, abyssFloor } = useGameStore((state) => state.player);
  const executeAbyssBattle = useGameStore((state) => state.executeAbyssBattle);
  const navigate = useGameStore((state) => state.navigate);

  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置' && (s.faintTurns || 0) === 0);
  const activeSlave = slaves.find(s => s.id === selectedSlaveId);
  const currentEnemy = getAbyssEnemy(abyssFloor);

  const handleAbyssFight = () => {
    if (!selectedSlaveId) {
      setSysMessage({ text: t('abyss.err_no_fighter', '［錯誤］請先選擇要上陣的試驗體。'), type: 'error' });
      return;
    }
    if (actionPoints < 1) {
      setSysMessage({ text: t('abyss.err_no_ap', '［系統警告］行動力不足。'), type: 'error' });
      return;
    }

    executeAbyssBattle(selectedSlaveId);
  };

  const slaveOptions: Option[] = idleSlaves.map(s => ({
    value: s.id,
    label: `${parseLocalizedName(s.name)} (${t('stats.combat', '武力')}: ${s.primaryStats.combat} | ${t('stats.intelligence', '智力')}: ${s.primaryStats.intelligence})`,
    disabled: s.conditionStats.stamina < 30
  }));

  let winRate = 0;
  if (activeSlave) {
    const pScore = activeSlave.primaryStats.combat * 1.5 + activeSlave.primaryStats.endurance + (activeSlave.skills.combat * 25) + activeSlave.primaryStats.intelligence;
    const nScore = currentEnemy.stats.combat * 1.5 + currentEnemy.stats.endurance + currentEnemy.stats.intelligence;
    winRate = Math.min(95, Math.max(1, Math.floor((pScore / (pScore + nScore)) * 100)));
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-purple-500 tracking-widest">{t('abyss.title', '［深淵之塔］')}</h2>
          <p className="text-2xs text-gray-500 mt-1">{t('abyss.desc', '無盡的試煉。每一層都潛伏著更致命的深淵畸變體。')}</p>
        </div>
        <button onClick={() => navigate('Town', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          {t('ui.return_town', '［返回城鎮］')}
        </button>
      </div>

      <div className="bg-gray-900/90 p-4 sm:p-5 rounded-lg border border-purple-900/50 shadow-[0_0_20px_rgba(147,51,234,0.15)] flex flex-col gap-5 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none select-none text-6xl font-black italic">
          F{abyssFloor}
        </div>

        <div className="flex flex-col gap-1 border-b border-gray-800 pb-3 relative z-10">
          <span className="text-xs text-gray-400 font-bold tracking-widest">{t('abyss.current_floor', '當前攻略層數：')} <strong className="text-purple-400 text-base font-mono">第 {abyssFloor} 階</strong></span>
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <label className="text-xs text-purple-400 font-bold tracking-widest border-l-2 border-purple-500 pl-2">{t('abyss.select_fighter', '［指派探索鬥士］')}</label>
          {slaveOptions.length > 0 ? (
            <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="purple" />
          ) : (
            <div className="text-xs text-gray-500 bg-gray-950 p-3 rounded border border-gray-800">
              {t('abyss.no_fighter', '目前沒有閒置且有戰鬥力的奴隸。')}
            </div>
          )}
          {activeSlave && (
            <div className="text-3xs text-gray-400 mt-1 flex justify-between px-1">
              <span>{t('stats.stamina', '體力')}: <strong className={activeSlave.conditionStats.stamina < 30 ? 'text-red-400' : 'text-green-400'}>{activeSlave.conditionStats.stamina}/100</strong> (最低需求: 30)</span>
              <span>{t('stats.skill_survival', '生存本能')}: <strong className="text-yellow-400">Lv.{activeSlave.skills.survival}</strong></span>
            </div>
          )}
        </div>

        {sysMessage && (
          <div className={`p-3 rounded border text-xs font-bold text-center tracking-widest relative z-10 ${sysMessage.type === 'error' ? 'bg-red-950/80 border-red-900 text-red-400' : 'bg-green-950/80 border-green-900 text-green-400'}`}>
            {sysMessage.text}
          </div>
        )}

        <div className="bg-black/60 p-4 rounded-lg border border-purple-900/30 flex flex-col gap-3 relative z-10 mt-2">
          <h4 className="text-xs font-bold text-gray-500 tracking-widest mb-1">{t('abyss.enemy_intel', '［深淵守門者情報］')}</h4>
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className={`text-base font-bold tracking-widest ${currentEnemy.isBoss ? 'text-red-500 animate-pulse' : 'text-purple-300'}`}>
                {currentEnemy.isBoss ? `【領主】${t(`npc.${currentEnemy.name}`, currentEnemy.name)}` : t(`npc.${currentEnemy.name}`, currentEnemy.name)}
              </span>
              <span className="text-3xs text-gray-500 italic">「{t(`npc_quote.${currentEnemy.name}`, currentEnemy.quote)}」</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
               <span className="text-3xs text-gray-500 font-bold tracking-widest">{t('abyss.reward', '突破獎勵')}</span>
               <span className="text-yellow-500 font-bold font-mono text-sm">${currentEnemy.rewardGold}</span>
               <span className="text-blue-400 font-bold font-mono text-xs">+{currentEnemy.rewardPrestige}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-gray-900/80 p-2 rounded border border-gray-800 text-center font-mono text-3xs">
            <div className="flex flex-col"><span className="text-gray-600">{t('stats.combat', '武力')}</span><span className="text-red-400 font-bold">{currentEnemy.stats.combat}</span></div>
            <div className="flex flex-col border-l border-gray-800"><span className="text-gray-600">{t('stats.endurance', '體質')}</span><span className="text-green-400 font-bold">{currentEnemy.stats.endurance}</span></div>
            <div className="flex flex-col border-l border-gray-800"><span className="text-gray-600">{t('stats.intelligence', '智力')}</span><span className="text-blue-400 font-bold">{currentEnemy.stats.intelligence}</span></div>
            <div className="flex flex-col border-l border-gray-800"><span className="text-gray-600">{t('stats.luck', '幸運')}</span><span className="text-yellow-400 font-bold">{currentEnemy.stats.luck}</span></div>
          </div>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-800/50">
            <div className="text-xs text-gray-400 font-bold tracking-widest">
              {activeSlave ? (
                <>
                  {t('abyss.win_rate', '存活率預測')}: <strong className={winRate >= 70 ? 'text-green-400' : winRate >= 40 ? 'text-yellow-400' : 'text-red-500'}>{winRate}%</strong>
                </>
              ) : (
                <span className="text-gray-600 italic text-2xs">{t('abyss.select_to_predict', '選擇探索者以預測存活率')}</span>
              )}
            </div>
            <button 
              onClick={handleAbyssFight}
              disabled={!selectedSlaveId || actionPoints < 1}
              className={`px-5 py-2.5 rounded font-bold text-xs tracking-widest transition-all shadow-lg ${
                !selectedSlaveId || actionPoints < 1
                  ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'
                  : currentEnemy.isBoss 
                    ? 'bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 animate-pulse'
                    : 'bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 border border-purple-700'
              }`}
            >
              {currentEnemy.isBoss ? t('abyss.btn_boss', '［挑戰領主］') : t('abyss.btn_challenge', '［踏入深淵］')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
