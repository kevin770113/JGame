import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

const DIALOGUES = [
  '深淵的凝視未曾移開，主人。',
  '我會將那些敵人的骨頭磨成粉末。',
  '這裡的氣息……令人感到窒息卻又沉迷。',
  '只要您下令，我隨時準備赴死。',
  '生存或是毀滅，都不過是您一句話的恩賜。',
  '鮮血的味道能讓我保持清醒。',
  '請盡情使用我，直到這具軀殼破碎為止。'
];

export default function InteractionView() {
  const slaves = useGameStore((state) => state.slaves);
  const { gold, roomDirtiness } = useGameStore((state) => state.player);
  const updateSlave = useGameStore((state) => state.updateSlave);
  const deductGold = useGameStore((state) => state.deductGold);
  const navigate = useGameStore((state) => state.navigate);

  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dialogue' | 'clean' | 'train'>('dialogue');
  const [currentQuote, setCurrentQuote] = useState<string>('［等待傳喚中...］');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedSlave = slaves.find(s => s.id === selectedSlaveId);
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  useEffect(() => {
    setCurrentQuote('［等待傳喚中...］');
    setSysMessage(null);
  }, [selectedSlaveId, activeTab]);

  const slaveOptions: Option[] = idleSlaves.map(s => ({
    value: s.id,
    label: `${s.name} (體力: ${s.conditionStats.stamina})`
  }));

  const handleTalk = () => {
    if (!selectedSlave) return;
    const randomQuote = DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)];
    setCurrentQuote(`「${randomQuote}」`);
  };

  const handleClean = () => {
    if (!selectedSlave) return;
    if (roomDirtiness === 0) {
      setSysMessage({ text: '［提示］目前環境已十分整潔，無需過度打掃。', type: 'error' });
      return;
    }
    if (selectedSlave.conditionStats.stamina < 15) {
      setSysMessage({ text: '［警告］該成員體力不足以負擔內政勞動。', type: 'error' });
      return;
    }

    // 根據內政管家技能計算清潔力：基礎 10 + (技能等級 * 8)
    const cleanPower = 10 + (selectedSlave.skills.housework * 8);
    const newDirtiness = Math.max(0, roomDirtiness - cleanPower);
    const newStamina = Math.max(0, selectedSlave.conditionStats.stamina - 15);

    useGameStore.setState((state) => ({ player: { ...state.player, roomDirtiness: newDirtiness } }));
    updateSlave(selectedSlave.id, { conditionStats: { ...selectedSlave.conditionStats, stamina: newStamina } });

    setSysMessage({ text: `［結算］${selectedSlave.name} 執行了環境整理。髒亂度下降 ${cleanPower}%。`, type: 'success' });
  };

  const handleTrain = (skillType: 'combat' | 'housework' | 'survival') => {
    if (!selectedSlave) return;
    const costGold = 500;
    const costStamina = 40;

    if (gold < costGold) {
      setSysMessage({ text: '［警告］特訓需要耗費大量資源，目前資金不足。', type: 'error' });
      return;
    }
    if (selectedSlave.conditionStats.stamina < costStamina) {
      setSysMessage({ text: '［警告］該成員體力透支，無法承受殘酷特訓。', type: 'error' });
      return;
    }

    const currentLevel = selectedSlave.skills[skillType];
    if (currentLevel >= 10) {
      setSysMessage({ text: '［提示］該項技能已達凡人極限，無法再透過常規特訓提升。', type: 'error' });
      return;
    }

    deductGold(costGold);
    updateSlave(selectedSlave.id, {
      skills: { ...selectedSlave.skills, [skillType]: currentLevel + 1 },
      conditionStats: { ...selectedSlave.conditionStats, stamina: selectedSlave.conditionStats.stamina - costStamina, stress: Math.min(100, selectedSlave.conditionStats.stress + 10) }
    });

    const skillName = skillType === 'combat' ? '戰鬥專精' : skillType === 'housework' ? '內政管家' : '生存本能';
    setSysMessage({ text: `［突破］殘酷的特訓結束。${selectedSlave.name} 的【${skillName}】提升至 Lv.${currentLevel + 1}。`, type: 'success' });
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">互動與管理</h2>
          <p className="text-xs text-gray-500 mt-1">凝視深淵，並將您的意志強加於他們之上。</p>
        </div>
        <button 
          onClick={() => navigate('Home', 'Main')}
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回大廳］
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400 font-bold tracking-widest border-l-2 border-blood-red pl-2">［傳喚成員］</label>
        {idleSlaves.length > 0 ? (
          <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="gray" />
        ) : (
          <div className="text-xs text-red-500 bg-red-950/20 p-2 border border-red-900/30 rounded">
            目前據點內沒有處於「閒置」狀態的成員可供傳喚。
          </div>
        )}
      </div>

      {selectedSlave && (
        <div className="flex flex-col gap-4 mt-2">
          {/* 橫向功能分頁切換 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-800">
            {[
              { id: 'dialogue', label: '［深淵對話］' },
              { id: 'clean', label: '［內政指派］' },
              { id: 'train', label: '［殘酷特訓］' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold transition-colors ${
                  activeTab === tab.id 
                    ? 'text-white border-b-2 border-blood-red' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 動態渲染面板 */}
          <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[160px]">
            
            {activeTab === 'dialogue' && (
              <div className="flex flex-col gap-4 h-full justify-between">
                <div className="text-sm text-gray-300 italic leading-relaxed bg-gray-950 p-4 rounded border border-gray-800 min-h-[80px] flex items-center justify-center text-center">
                  {currentQuote}
                </div>
                <button onClick={handleTalk} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded font-bold text-xs tracking-widest transition-colors">
                  ［要求發言］
                </button>
              </div>
            )}

            {activeTab === 'clean' && (
              <div className="flex flex-col gap-4">
                <div className="text-xs text-gray-400 bg-gray-950 p-3 rounded border border-gray-800">
                  <div className="flex justify-between mb-1"><span>當前據點髒亂度：</span> <span className={roomDirtiness > 50 ? 'text-yellow-500' : 'text-green-500'}>{roomDirtiness}%</span></div>
                  <div className="flex justify-between"><span>成員內政管家等級：</span> <span className="text-blue-400">Lv.{selectedSlave.skills.housework}</span></div>
                  <div className="text-gray-600 mt-2 border-t border-gray-800 pt-2">消耗體力: 15 / 依據技能等級決定打掃成效。</div>
                </div>
                <button onClick={handleClean} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded font-bold text-xs tracking-widest transition-colors">
                  ［下令整頓環境］
                </button>
              </div>
            )}

            {activeTab === 'train' && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-gray-500 mb-1">每次特訓固定消耗資金: 500、體力: 40、壓力增加: 10</div>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => handleTrain('combat')} className="flex justify-between items-center p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded transition-colors group">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-widest">［戰鬥專精特訓］</span>
                    <span className="text-xs text-blue-400 font-mono">目前: Lv.{selectedSlave.skills.combat}</span>
                  </button>
                  <button onClick={() => handleTrain('housework')} className="flex justify-between items-center p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded transition-colors group">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-widest">［內政管家特訓］</span>
                    <span className="text-xs text-blue-400 font-mono">目前: Lv.{selectedSlave.skills.housework}</span>
                  </button>
                  <button onClick={() => handleTrain('survival')} className="flex justify-between items-center p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded transition-colors group">
                    <span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-widest">［生存本能特訓］</span>
                    <span className="text-xs text-blue-400 font-mono">目前: Lv.{selectedSlave.skills.survival}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {sysMessage && (
        <div className={`p-3 border rounded text-xs leading-relaxed tracking-wide ${
          sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 'bg-gray-900 border-red-900 text-red-500'
        }`}>
          {sysMessage.text}
        </div>
      )}
    </div>
  );
}
