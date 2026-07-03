import { useState } from 'react';
import { useGameStore, getAbyssEnemy } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function AbyssView() {
  const { actionPoints, abyssFloor } = useGameStore((state) => state.player);
  const navigate = useGameStore((state) => state.navigate);
  const executeAbyssBattle = useGameStore((state) => state.executeAbyssBattle);
  
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

    // ★ V2.5 呼叫底層函數錄製影帶，劇場將自動接管畫面
    executeAbyssBattle(selectedFighterId);
  };

  const fighterOptions: Option[] = idleSlaves.map(s => ({ 
    value: s.id, 
    label: `${s.name} (武力: ${s.primaryStats.combat} | 體力: ${s.conditionStats.stamina})` 
  }));

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative">
      <div className="absolute inset-0 bg-purple-900/10 z-0 pointer-events-none rounded-xl blur-3xl"></div>
      
      <div className="flex justify-between items-center border-b border-purple-900/50 pb-2 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-purple-300 tracking-widest">深淵之塔</h2>
          <p className="text-2xs text-purple-500 mt-0.5">無盡的階梯與古代的狂魂，每一步都是邁向死亡的榮耀。</p>
        </div>
        <button onClick={() => navigate('Town', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-purple-800/50 hover:bg-purple-900/30 text-purple-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          ［撤出深淵］
        </button>
      </div>

      <div className="flex flex-col gap-5 mt-2 relative z-10">
        <div className={`p-5 rounded-lg border shadow-xl flex flex-col items-center justify-center relative overflow-hidden ${targetEnemy.isBoss ? 'bg-gradient-to-b from-red-950/40 to-gray-900 border-red-900/50' : 'bg-gray-900 border-purple-900/30'}`}>
          <div className="absolute top-2 left-3 text-xs font-bold text-purple-500 tracking-widest opacity-50">FLOOR {abyssFloor}</div>
          
          <h3 className={`text-xl font-bold tracking-widest mb-1 mt-4 ${targetEnemy.isBoss ? 'text-red-500' : 'text-gray-300'}`}>
            {targetEnemy.isBoss ? '【英靈首領】' : ''}{targetEnemy.name}
          </h3>
          <p className="text-xs text-gray-500 italic mb-6">「{targetEnemy.quote}」</p>
          
          <div className="grid grid-cols-2 gap-3 w-full text-xs font-mono text-gray-300 bg-gray-950/80 p-4 rounded border border-gray-800 shadow-inner">
            <div className="flex justify-between"><span>深淵血量:</span> <span className="text-green-500">{targetEnemy.stats.hp}</span></div>
            <div className="flex justify-between"><span>深淵防禦:</span> <span className="text-blue-400">{targetEnemy.stats.defense}</span></div>
            <div className="flex justify-between"><span>深淵攻擊:</span> <span className="text-red-400">{targetEnemy.stats.attack}</span></div>
            <div className="flex justify-between"><span>深淵速度:</span> <span className="text-yellow-400">{targetEnemy.stats.speed}</span></div>
          </div>
          
          <div className="mt-4 text-xs text-purple-400 tracking-widest bg-purple-950/20 px-4 py-2 rounded border border-purple-900/30 w-full text-center">
            突破獎金: <strong className="text-yellow-500">${targetEnemy.rewardGold}</strong> 
            {targetEnemy.rewardPrestige > 0 && <span className="ml-2">| 威望: <strong className="text-blue-400">+{targetEnemy.rewardPrestige}</strong></span>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-purple-400 font-bold tracking-widest border-l-2 border-purple-600 pl-2">［派遣挑戰者］</label>
          {idleSlaves.length > 0 ? <CustomSelect options={fighterOptions} value={selectedFighterId} onChange={setSelectedFighterId} focusColor="purple" /> : <div className="text-xs text-red-500 p-2 border border-red-900/30 rounded bg-red-950/20">無閒置成員可參賽。</div>}
        </div>

        <div className="text-xs text-gray-500 italic mt-1 leading-relaxed">※ 深淵挑戰將消耗 1 點行動力與 <strong className="text-purple-400">30 點體力</strong>。請確保您的試驗體配有精良的武器裝備。</div>
        
        <button onClick={startBattle} disabled={!selectedFighterId || actionPoints < 1} className={`w-full py-3.5 rounded font-bold text-xs tracking-widest border transition-all shadow-lg ${!selectedFighterId || actionPoints < 1 ? 'bg-gray-800 text-gray-600 border-gray-700' : 'bg-purple-900/30 text-purple-300 border-purple-700/50 hover:bg-purple-900/50 active:scale-98'}`}>
          ［開啟深淵之門］
        </button>
      </div>
    </div>
  );
}
