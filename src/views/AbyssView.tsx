import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { getAbyssEnemy } from '../utils/generators'; 
import WheelPicker, { WheelOption } from '../components/WheelPicker';

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

  // ★ V2.9.12 當可用奴隸名冊更新時，若無選擇者則預設指向滾輪首位
  useEffect(() => {
    if (idleSlaves.length > 0 && !selectedFighterId) {
      setSelectedFighterId(idleSlaves[0].id);
    }
  }, [idleSlaves, selectedFighterId]);

  const currentFighter = slaves.find(s => s.id === selectedFighterId);
  const isStaminaInsufficient = currentFighter ? currentFighter.conditionStats.stamina < 30 : true;

  const startBattle = () => {
    if (!selectedFighterId) return;
    if (isStaminaInsufficient) return;
    
    if (actionPoints < 1) { 
      setGlobalModal({ title: '［系統警告］', message: '目前行動力不足。', isConfirm: false }); 
      return; 
    }

    const result = executeAbyssBattle(selectedFighterId);
    if (result) {
      setSelectedFighterId('');
      processTurn();
    }
  };

  // ★ V2.9.12 轉換為符合 3D 滾輪的單行簡潔格式
  const fighterOptions: WheelOption[] = idleSlaves.map(s => {
    const isExhausted = s.conditionStats.stamina < 30;
    return {
      value: s.id,
      label: `${s.name} (體力: ${s.conditionStats.stamina}) ${isExhausted ? '［體力不足］' : ''}`,
      disabled: isExhausted
    };
  });

  const charismaBonusMultiplier = 1 + Math.floor(targetEnemy.stats.charisma / 10) * 0.05;
  const expectedReward = Math.floor(targetEnemy.rewardGold * charismaBonusMultiplier);

  // 判定按鈕是否需要完全反灰鎖死
  const isButtonDisabled = !selectedFighterId || actionPoints < 1 || isStaminaInsufficient;

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

        <div className="w-full md:w-1/2 flex flex-col gap-4 bg-gray-900/60 p-4 rounded-lg border border-gray-800 justify-between min-h-[220px]">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-purple-400 font-bold tracking-widest border-l-2 border-purple-600 pl-2 mb-1">［派遣挑戰者］</label>
            
            {/* ★ V2.9.12 替換為全新 3D 垂直翻轉手勢滾輪 */}
            {idleSlaves.length > 0 ? (
              <WheelPicker options={fighterOptions} value={selectedFighterId} onChange={setSelectedFighterId} />
            ) : (
              <div className="text-xs text-red-500 p-3 border border-red-900/30 rounded bg-red-950/20 text-center tracking-widest">
                無閒置成員可參賽。
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <div className="text-xs text-gray-500 italic mt-1 leading-relaxed">
              ※ 深淵挑戰將 <strong className="text-yellow-500">強制消耗 1 點行動力推進時段</strong>，並消耗該挑戰者 <strong className="text-purple-400">30 點體力</strong>。
            </div>
            
            {/* ★ V2.9.12 簡化按鈕文字，加強體力不足反灰鎖死邏輯 */}
            <button 
              onClick={startBattle} 
              disabled={isButtonDisabled} 
              className={`w-full py-3.5 rounded font-bold text-xs tracking-widest border transition-all ${
                isButtonDisabled 
                  ? 'bg-gray-950 text-gray-600 border-gray-850 cursor-not-allowed shadow-none opacity-50' 
                  : 'bg-purple-900/40 hover:bg-purple-900/60 text-purple-400 border-purple-800 hover:border-purple-600 shadow-md middle:scale-98'
              }`}
            >
              {isStaminaInsufficient && idleSlaves.length > 0 ? '［體力不足，無法戰鬥］' : '［開始戰鬥］'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
