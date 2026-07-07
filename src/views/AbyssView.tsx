import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getAbyssEnemy } from '../utils/generators'; 
import CustomSelect, { Option } from '../components/CustomSelect';

export default function AbyssView() {
  const { actionPoints, abyssFloor } = useGameStore((state) => state.player);
  const navigate = useGameStore((state) => state.navigate);
  const executeAbyssBattle = useGameStore((state) => state.executeAbyssBattle);
  const processTurn = useGameStore((state) => state.processTurn);
  
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);
  const slaves = useGameStore((state) => state.slaves);

  const [selectedFighterId, setSelectedFighterId] = useState<string>('');

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  const targetEnemy = getAbyssEnemy(abyssFloor);

  const startBattle = () => {
    if (!selectedFighterId) return;
    const fighter = slaves.find(s => s.id === selectedFighterId);
    if (!fighter) return;
    
    if (actionPoints < 1) { 
      setGlobalModal({ title: '［系統警告］', message: '目前行動力不足。', isConfirm: false }); 
      return; 
    }
    if (fighter.conditionStats.stamina < 30) { 
      setGlobalModal({ title: '［系統警告］', message: '深淵極度消耗體力，該成員體力不足 30，強行進入將會暴斃。', isConfirm: false });
      return; 
    }

    const result = executeAbyssBattle(fighter.id);
    if (result) {
      setSelectedFighterId('');
      processTurn();
    }
  };

  const fighterOptions: Option[] = idleSlaves.map(s => {
    const isExhausted = s.conditionStats.stamina < 30;
    return {
      value: s.id,
      label: `${s.name} (體力: ${s.conditionStats.stamina}) ${isExhausted ? '［體力透支］' : ''}`,
      disabled: isExhausted
    };
  });

  const charismaBonusMultiplier = 1 + Math.floor(targetEnemy.stats.charisma / 10) * 0.05;
  const expectedReward = Math.floor(targetEnemy.rewardGold * charismaBonusMultiplier);

  // ★ V2.9.11 加大底部留白 pb-32 以防下拉選單被導航列遮擋
  return (
    <div className="w-full flex flex-col gap-5 pb-32 animate-fade-in relative z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-purple-400">深淵之塔</h2>
          <p className="text-xs text-gray-500 mt-1">無盡的黑暗階梯，埋藏著古代的英靈與無盡的財富。</p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回城鎮］
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-5 mt-2">
        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <div className="bg-gray-900/80 p-5 rounded-lg border border-purple-900/50 shadow-xl relative overflow-hidden group flex flex-col items-center text-center">
        
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <span className="text-6xl text-purple-500">🌀</span>
            </div>
            
            <div className="w-16 h-16 rounded-full bg-purple-950 border-2 border-purple-800 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <span className="text-2xl font-black text-purple-400">{abyssFloor}</span>
            </div>

            <div className="text-xs text-purple-500 font-bold tracking-widest mb-1">
              {targetEnemy.isBoss ? '［鎮守英靈］' : '［深淵魔物］'}
            </div>
            <h3 className={`text-xl font-black mb-2 truncate transition-colors ${targetEnemy.isBoss ? 'text-red-400 group-hover:text-red-300' : 'text-gray-200 group-hover:text-purple-300'}`}>
              {targetEnemy.name}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed italic mb-4 min-h-[40px]">
              「{targetEnemy.quote}」
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-950 p-3 rounded border border-gray-800 text-xs w-full text-left">
              <div className="flex justify-between"><span>武力:</span> <span className="text-red-400 font-bold font-mono">{targetEnemy.stats.combat}</span></div>
              <div className="flex justify-between"><span>體質:</span> <span className="text-green-400 font-bold font-mono">{targetEnemy.stats.endurance}</span></div>
              <div className="flex justify-between"><span>智力:</span> <span className="text-blue-400 font-bold font-mono">{targetEnemy.stats.intelligence}</span></div>
              <div className="flex justify-between"><span>魅力:</span> <span className="text-pink-400 font-bold font-mono">{targetEnemy.stats.charisma}</span></div>
              <div className="flex justify-between col-span-2"><span>幸運:</span> <span className="text-yellow-400 font-bold font-mono">{targetEnemy.stats.luck}</span></div>
            </div>

            <div className="mt-4 text-xs text-purple-400 tracking-widest bg-purple-950/20 px-4 py-2 rounded border border-purple-900/30 w-full text-center">
              期望賞金: <strong className="text-yellow-500">${expectedReward}</strong> 
              {charismaBonusMultiplier > 1 && <span className="text-3xs text-gray-600 ml-1">(含魅力)</span>}
              {targetEnemy.rewardPrestige > 0 && <span className="ml-2">| 威望: <strong className="text-blue-400">+{targetEnemy.rewardPrestige}</strong></span>}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-4 bg-gray-900/60 p-4 rounded-lg border border-gray-800">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-purple-400 font-bold tracking-widest border-l-2 border-purple-600 pl-2">［派遣挑戰者］</label>
            {idleSlaves.length > 0 ? <CustomSelect options={fighterOptions} value={selectedFighterId} onChange={setSelectedFighterId} focusColor="purple" /> : <div className="text-xs text-red-500 p-2 border border-red-900/30 rounded bg-red-950/20">無閒置成員可參賽。</div>}
          </div>

          <div className="text-xs text-gray-500 italic mt-1 leading-relaxed">
            ※ 深淵挑戰將 <strong className="text-yellow-500">強制消耗 1 點行動力推進時段</strong>，並消耗 <strong className="text-purple-400">30 點體力</strong>。
          </div>
          
          <button onClick={startBattle} disabled={!selectedFighterId || actionPoints < 1} className={`w-full py-3 rounded font-bold text-xs tracking-widest border transition-all mt-auto ${(!selectedFighterId || actionPoints < 1) ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed' : 'bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border-purple-800 hover:border-purple-600 shadow-md'}`}>
            ［踏入深淵階梯］
          </button>
        </div>
      </div>
    </div>
  );
}
