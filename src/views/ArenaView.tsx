import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function ArenaView() {
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

  const startBattle = () => {
    if (!targetNPC || !selectedFighterId) return;
    const fighter = slaves.find(s => s.id === selectedFighterId);
    if (!fighter) return;
    
    if (actionPoints < 1) { 
      setGlobalModal({ title: '［系統警告］', message: '目前行動力不足。', isConfirm: false }); 
      return; 
    }
    if (fighter.conditionStats.stamina < 20) { 
      setGlobalModal({ title: '［系統警告］', message: '該成員體力嚴重透支，強行上陣必定暴斃，請先進行療養或賞賜藥劑。', isConfirm: false });
      return; 
    }

    const result = executeArenaBattle(fighter.id, targetNPC.id);
    if (result) {
      setSelectedFighterId('');
      processTurn();
    }
  };

  const fighterOptions: Option[] = idleSlaves.map(s => {
    const isExhausted = s.conditionStats.stamina < 20;
    return {
      value: s.id,
      label: `${s.name} (體力: ${s.conditionStats.stamina}) ${isExhausted ? '［無法參賽］' : ''}`,
      disabled: isExhausted
    };
  });

  if (!targetNPC) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-gray-500 font-bold tracking-widest animate-pulse">
        ［該地區尚無可挑戰之目標］
      </div>
    );
  }

  const charismaBonusMultiplier = 1 + Math.floor(targetNPC.stats.charisma / 10) * 0.05;
  const expectedReward = Math.floor(targetNPC.rewardGold * charismaBonusMultiplier);

  // ★ V2.9.11 加大底部留白 pb-32 以防下拉選單被導航列遮擋
  return (
    <div className="w-full flex flex-col gap-5 pb-32 animate-fade-in relative z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">血腥角鬥場</h2>
          <p className="text-xs text-gray-500 mt-1">殘酷的地下死鬥，活下來的人將獲得榮耀與金錢。</p>
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
          <div className="bg-gray-900/80 p-4 rounded-lg border border-red-900 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <span className="text-6xl">⚔️</span>
            </div>
            <div className="text-xs text-red-500 font-bold tracking-widest mb-1">［當前地區鎮守者］</div>
            <h3 className="text-xl font-black text-gray-200 mb-2 truncate group-hover:text-red-400 transition-colors">
              {targetNPC.name}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed italic mb-3 min-h-[40px]">
              「{targetNPC.description}」
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-950 p-3 rounded border border-gray-800 text-xs">
              <div className="flex justify-between"><span>武力:</span> <span className="text-red-400 font-bold font-mono">{targetNPC.stats.combat}</span></div>
              <div className="flex justify-between"><span>體質:</span> <span className="text-green-400 font-bold font-mono">{targetNPC.stats.endurance}</span></div>
              <div className="flex justify-between"><span>智力:</span> <span className="text-blue-400 font-bold font-mono">{targetNPC.stats.intelligence}</span></div>
              <div className="flex justify-between"><span>魅力:</span> <span className="text-pink-400 font-bold font-mono">{targetNPC.stats.charisma}</span></div>
              <div className="flex justify-between col-span-2"><span>幸運:</span> <span className="text-yellow-400 font-bold font-mono">{targetNPC.stats.luck}</span></div>
            </div>

            <div className="mt-3 text-xs text-gray-500 tracking-widest">
              期望賞金: <strong className="text-yellow-500">{expectedReward}</strong> 資金 
              {charismaBonusMultiplier > 1 && <span className="text-3xs text-gray-600 ml-1">(含魅力加成)</span>}
              {targetNPC.rewardPrestige > 0 && <span className="ml-2">| 威望: <strong className="text-blue-400">+{targetNPC.rewardPrestige}</strong></span>}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-4 bg-gray-900/60 p-4 rounded-lg border border-gray-800">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-bold tracking-widest border-l-2 border-yellow-600 pl-2">［派遣鬥士］</label>
            {idleSlaves.length > 0 ? <CustomSelect options={fighterOptions} value={selectedFighterId} onChange={setSelectedFighterId} focusColor="gray" /> : <div className="text-xs text-red-500 p-2 border border-red-900/30 rounded bg-red-950/20">無閒置成員可參賽。</div>}
          </div>

          <div className="text-xs text-gray-500 italic mt-2">
            ※ 參賽將 <strong className="text-yellow-500">強制消耗 1 點行動力推進時段</strong>，並消耗 20 點體力。
          </div>
          
          <button onClick={startBattle} disabled={!selectedFighterId || actionPoints < 1} className={`w-full py-3 rounded font-bold text-xs tracking-widest border transition-all mt-auto ${(!selectedFighterId || actionPoints < 1) ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed' : 'bg-red-900/40 hover:bg-red-900/60 text-red-400 border-red-800 hover:border-red-600 shadow-md'}`}>
            ［簽署生死狀並開戰］
          </button>
        </div>
      </div>
    </div>
  );
}
