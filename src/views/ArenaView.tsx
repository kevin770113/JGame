import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';
import { parseLocalizedName } from '../utils/i18nUtils';

export default function ArenaView() {
  const { t, i18n } = useTranslation();
  const slaves = useGameStore((state) => state.slaves);
  const arenaNPCs = useGameStore((state) => state.arenaNPCs);
  const { actionPoints, location } = useGameStore((state) => state.player);
  const executeArenaBattle = useGameStore((state) => state.executeArenaBattle);
  const navigate = useGameStore((state) => state.navigate);

  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const isEn = i18n.language?.startsWith('en');
  const localNPCs = arenaNPCs.filter(npc => npc.location === location);
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置' && (s.faintTurns || 0) === 0);

  const handleFight = (npcId: string) => {
    if (!selectedSlaveId) {
      setSysMessage({ text: t('arena.err_no_fighter', '［錯誤］請先選擇要上陣的試驗體。'), type: 'error' });
      return;
    }
    if (actionPoints < 1) {
      setSysMessage({ text: t('arena.err_no_ap', '［系統警告］行動力不足。'), type: 'error' });
      return;
    }
    executeArenaBattle(selectedSlaveId, npcId);
  };

  const slaveOptions: Option[] = idleSlaves.map(s => ({
    value: s.id,
    label: `${parseLocalizedName(s.name)} (${t('stats.combat', '武力')}: ${s.primaryStats.combat} | ${t('stats.endurance', '體質')}: ${s.primaryStats.endurance})`,
    disabled: s.conditionStats.stamina < 20
  }));

  const activeSlave = slaves.find(s => s.id === selectedSlaveId);

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-red-500 tracking-widest">{t('arena.title', '［血腥角鬥場］')}</h2>
          <p className="text-2xs text-gray-500 mt-1">{t('arena.desc', '帝國高層的殘酷娛樂。贏得勝利以獲取資金與威望。')}</p>
        </div>
        <button onClick={() => navigate('Town', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          {t('ui.return_town', '［返回城鎮］')}
        </button>
      </div>

      <div className="bg-gray-900/80 p-4 sm:p-5 rounded-lg border border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.1)] flex flex-col gap-4">
        
        <div className="flex flex-col gap-2">
          <label className="text-xs text-red-400 font-bold tracking-widest border-l-2 border-red-500 pl-2">{t('arena.select_fighter', '［指派上陣鬥士］')}</label>
          {slaveOptions.length > 0 ? (
            <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="gray" />
          ) : (
            <div className="text-xs text-gray-500 bg-gray-950 p-3 rounded border border-gray-800">
              {t('arena.no_fighter', '目前沒有閒置且有戰鬥力的奴隸。')}
            </div>
          )}
          {activeSlave && (
            <div className="text-3xs text-gray-400 mt-1 flex justify-between px-1">
              <span>{t('stats.stamina', '體力')}: <strong className={activeSlave.conditionStats.stamina < 30 ? 'text-red-400' : 'text-green-400'}>{activeSlave.conditionStats.stamina}/100</strong> (Min: 20)</span>
              <span>{t('stats.skill_combat', '戰鬥專精')}: <strong className="text-blue-400">Lv.{activeSlave.skills.combat}</strong></span>
            </div>
          )}
        </div>

        {sysMessage && (
          <div className={`p-3 rounded border text-xs font-bold text-center tracking-widest ${sysMessage.type === 'error' ? 'bg-red-950/80 border-red-900 text-red-400' : 'bg-green-950/80 border-green-900 text-green-400'}`}>
            {sysMessage.text}
          </div>
        )}

        <div className="flex flex-col gap-4 mt-2">
          {localNPCs.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-4">{t('arena.no_npc', '該區域目前沒有可挑戰的對手。')}</div>
          )}
          {localNPCs.map(npc => {
            let winRate = 0;
            if (activeSlave) {
              const pScore = activeSlave.primaryStats.combat * 1.5 + activeSlave.primaryStats.endurance + (activeSlave.skills.combat * 20);
              const nScore = npc.stats.combat * 1.5 + npc.stats.endurance;
              winRate = Math.min(95, Math.max(5, Math.floor((pScore / (pScore + nScore)) * 100)));
            }

            // Fallback translations for NPC descriptions if English
            let npcDesc = npc.description;
            if (isEn) {
              if (npc.id.includes('npc-1')) npcDesc = 'A desperate outlaw covered in mud and blood. Lacks any real technique.';
              else if (npc.id.includes('npc-2')) npcDesc = 'A professional fighter heavily invested by the guild. Well-equipped and trained.';
              else if (npc.id.includes('npc-3')) npcDesc = 'A killing machine of the imperial family, designed to crush challengers.';
            }

            return (
              <div key={npc.id} className="bg-gray-950 p-4 rounded-lg border border-gray-800 flex flex-col gap-3 relative overflow-hidden group hover:border-red-900/50 transition-colors">
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-bold text-gray-200 group-hover:text-red-400 transition-colors tracking-widest">{npc.name}</h4>
                    <p className="text-3xs text-gray-500 leading-relaxed max-w-[200px]">{npcDesc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-3xs text-gray-500 font-bold tracking-widest">{t('arena.reward', '賞金 / 威望')}</span>
                    <span className="text-yellow-500 font-bold font-mono text-sm">${npc.rewardGold}</span>
                    <span className="text-blue-400 font-bold font-mono text-xs">+{npc.rewardPrestige}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 bg-gray-900/50 p-2 rounded border border-gray-800 text-center font-mono text-3xs z-10">
                  <div className="flex flex-col"><span className="text-gray-600">{t('stats.combat', '武力')}</span><span className="text-red-400 font-bold">{npc.stats.combat}</span></div>
                  <div className="flex flex-col border-l border-gray-800"><span className="text-gray-600">{t('stats.endurance', '體質')}</span><span className="text-green-400 font-bold">{npc.stats.endurance}</span></div>
                  <div className="flex flex-col border-l border-gray-800"><span className="text-gray-600">{t('stats.intelligence', '智力')}</span><span className="text-blue-400 font-bold">{npc.stats.intelligence}</span></div>
                  <div className="flex flex-col border-l border-gray-800"><span className="text-gray-600">{t('stats.luck', '幸運')}</span><span className="text-yellow-400 font-bold">{npc.stats.luck}</span></div>
                </div>

                <div className="flex justify-between items-center mt-1 z-10">
                  <div className="text-xs text-gray-400 font-bold tracking-widest">
                    {activeSlave ? (
                      <>
                        {t('arena.win_rate', '系統勝率預測')}: <strong className={winRate >= 70 ? 'text-green-400' : winRate >= 40 ? 'text-yellow-400' : 'text-red-500'}>{winRate}%</strong>
                      </>
                    ) : (
                      <span className="text-gray-600 italic text-2xs">{t('arena.select_to_predict', '選擇鬥士以預測勝率')}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => handleFight(npc.id)}
                    disabled={!selectedSlaveId || actionPoints < 1}
                    className={`px-4 py-2.5 rounded font-bold text-xs tracking-widest transition-all shadow-md ${
                      !selectedSlaveId || actionPoints < 1
                        ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'
                        : 'bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-red-300 border border-red-800'
                    }`}
                  >
                    {t('arena.btn_fight', '［生死狀簽署］')}
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
