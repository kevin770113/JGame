import { useState, useRef, useEffect } from 'react';
import { useGameStore, ARENA_NPCS } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';
import { CombatLog } from '../types';

export default function ArenaView() {
  const { location } = useGameStore((state) => state.player);
  const navigate = useGameStore((state) => state.navigate);
  const executeArenaBattle = useGameStore((state) => state.executeArenaBattle);
  
  const slaves = useGameStore((state) => state.slaves);
  const actionPoints = useGameStore((state) => state.player.actionPoints);

  const [selectedFighterId, setSelectedFighterId] = useState<string>('');
  const [combatResult, setCombatResult] = useState<{ logs: CombatLog[], isWin: boolean, npcName: string } | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (combatResult) logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combatResult]);

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  const targetNPC = ARENA_NPCS.find(n => n.location === location);

  const startBattle = () => {
    if (!targetNPC || !selectedFighterId) return;
    const fighter = slaves.find(s => s.id === selectedFighterId);
    if (!fighter) return;
    if (actionPoints < 1) { alert('［警告］行動力不足。'); return; }
    if (fighter.conditionStats.stamina < 20) { alert('［警告］該成員體力嚴重透支，無法上場。'); return; }

    const result = executeArenaBattle(selectedFighterId, targetNPC.id);
    if (result) setCombatResult({ logs: result.logs, isWin: result.isWin, npcName: targetNPC.name });
  };

  const getArenaTitle = () => {
    switch (location) {
      case 'Frontlines': return '地下賽場';
      case 'NeutralHub': return '公會角鬥場';
      case 'Capital': return '皇家競技場';
      default: return '血腥賽場';
    }
  };

  const fighterOptions: Option[] = idleSlaves.map(s => ({ 
    value: s.id, 
    label: `${s.name} (武力: ${s.primaryStats.combat} | 體質: ${s.primaryStats.endurance})` 
  }));

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">{getArenaTitle()}</h2>
          <p className="text-2xs text-gray-500 mt-0.5">派遣最強的試驗體，在生死邊緣博取財富與名望。</p>
        </div>
        {/* ★ 已加入 whitespace-nowrap shrink-0 確保按鈕不被擠壓斷行 */}
        <button onClick={() => navigate('Town', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          ［返回城鎮］
        </button>
      </div>

      <div className="flex flex-col gap-5 mt-2">
        {combatResult ? (
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex flex-col gap-4">
             <h3 className={`text-lg font-bold tracking-widest text-center ${combatResult.isWin ? 'text-yellow-500' : 'text-red-600'}`}>
               {combatResult.isWin ? '［競技勝利］' : '［競技戰敗］'}
             </h3>
             <div className="bg-gray-950 p-3 rounded border border-gray-800 h-64 overflow-y-auto font-mono text-xs flex flex-col gap-2 scrollbar-none">
               {combatResult.logs.map((log, idx) => (
                 <div key={idx} className={`${log.type === 'system' ? 'text-gray-500 italic border-b border-gray-900 pb-1' : log.type === 'skill' ? 'text-yellow-400 font-bold' : log.type === 'heal' ? 'text-green-400' : log.type === 'damage' ? 'text-red-400' : 'text-gray-300'}`}>
                   {log.round > 0 && <span className="text-gray-600 mr-2">R{log.round}</span>}{log.message}
                 </div>
               ))}
               <div ref={logEndRef} />
             </div>
             <button onClick={() => setCombatResult(null)} className="w-full py-2.5 bg-gray-800 text-gray-300 border border-gray-600 rounded font-bold text-xs tracking-widest">［清理賽場並離開］</button>
          </div>
        ) : targetNPC ? (
          <>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-md">
              <h3 className="text-lg font-bold text-yellow-600 tracking-widest mb-1">【{targetNPC.name}】</h3>
              <p className="text-xs text-gray-400 italic mb-4">{targetNPC.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-300 bg-gray-950 p-3 rounded border border-gray-800">
                <div>血量估值: <span className="text-green-500">{targetNPC.stats.hp}</span></div>
                <div>防禦估值: <span className="text-blue-400">{targetNPC.stats.defense}</span></div>
                <div>攻擊估值: <span className="text-red-400">{targetNPC.stats.attack}</span></div>
                <div>速度估值: <span className="text-yellow-400">{targetNPC.stats.speed}</span></div>
              </div>
              <div className="mt-3 text-xs text-gray-500 tracking-widest">
                獲勝獎金: <strong className="text-yellow-500">{targetNPC.rewardGold}</strong> 資金 
                {targetNPC.rewardPrestige > 0 && <span className="ml-2">| 威望: <strong className="text-blue-400">+{targetNPC.rewardPrestige}</strong></span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-400 font-bold tracking-widest border-l-2 border-yellow-600 pl-2">［派遣鬥士］</label>
              {idleSlaves.length > 0 ? <CustomSelect options={fighterOptions} value={selectedFighterId} onChange={setSelectedFighterId} focusColor="gray" /> : <div className="text-xs text-red-500 p-2 border border-red-900/30 rounded bg-red-950/20">無閒置成員可參賽。</div>}
            </div>

            <div className="text-xs text-gray-500 italic mt-2">※ 參賽將消耗 1 點行動力與 20 點體力。戰鬥中最大血量與防禦力受體質與生存技能折算，進場血量受當前體力百分比限制。</div>
            
            <button onClick={startBattle} disabled={!selectedFighterId || actionPoints < 1} className={`w-full py-3 rounded font-bold text-xs tracking-widest border transition-colors shadow ${!selectedFighterId || actionPoints < 1 ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-red-900/20 text-red-400 border-red-900/50 hover:bg-red-900/40'}`}>
              ［開始決鬥］
            </button>
          </>
        ) : (
          <div className="text-xs text-gray-500 text-center mt-10">此據點目前未開放賽場。</div>
        )}
      </div>
    </div>
  );
}
