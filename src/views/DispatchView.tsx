import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

interface Mission {
  id: string;
  title: string;
  risk: string;
  staminaCost: number;
  stressGain: number;
  reward: number;
  description: string;
}

const MISSIONS: Mission[] = [
  { id: 'm1', title: '黑市私掠物資護送', risk: '低', staminaCost: 20, stressGain: 10, reward: 300, description: '為地下商會提供暗夜物資押運，道路沉悶，但基本沒有生命危险。' },
  { id: 'm2', title: '深淵晶石礦脈採掘', risk: '中', staminaCost: 50, stressGain: 30, reward: 800, description: '前往充斥致命瓦斯的高壓密閉深淵勞役，極度折損精神與骨血。' },
  { id: 'm3', title: '帝國突擊敢死隊奇襲', risk: '高', staminaCost: 80, stressGain: 60, reward: 2000, description: '加入九死一生的死地伏擊敢死作戰，高致殘風險伴隨極其瘋狂的暴利。' },
];

export default function DispatchView() {
  const slaves = useGameStore((state) => state.slaves);
  const addGold = useGameStore((state) => state.addGold);
  const updateCondition = useGameStore((state) => state.updateCondition);
  const navigate = useGameStore((state) => state.navigate);

  const [selectedMissionId, setSelectedMissionId] = useState<string>(MISSIONS[0].id);
  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedMission = MISSIONS.find(m => m.id === selectedMissionId);

  const handleDispatch = () => {
    if (!selectedSlaveId) {
      setSysMessage({ text: '請先選擇要派遣的代理人！', type: 'error' });
      return;
    }
    const slave = slaves.find(s => s.id === selectedSlaveId);
    if (!selectedMission || !slave) return;

    if (slave.conditionStats.stamina < selectedMission.staminaCost) {
      setSysMessage({ text: `派遣失敗！${slave.name} 體力過低，會死在半路上。`, type: 'error' });
      return;
    }

    const newStamina = Math.max(0, slave.conditionStats.stamina - selectedMission.staminaCost);
    const newStress = Math.min(100, slave.conditionStats.stress + selectedMission.stressGain);

    updateCondition(slave.id, { stamina: newStamina, stress: newStress });
    addGold(selectedMission.reward);

    setSysMessage({ text: `派遣契約簽署！${slave.name} 已順利交貨，賺回賞金 🪙 ${selectedMission.reward}。`, type: 'success' });
    setSelectedSlaveId('');
  };

  const slaveOptions: Option[] = slaves.map(s => {
    const isExhausted = selectedMission ? s.conditionStats.stamina < selectedMission.staminaCost : false;
    return {
      value: s.id,
      label: `${s.name} (體力: ${s.conditionStats.stamina}) ${isExhausted ? '- 體力透支' : ''}`,
      disabled: isExhausted
    };
  });

  const handleMissionChange = (mId: string) => {
    setSelectedMissionId(mId);
    setSelectedSlaveId('');
    setSysMessage(null);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">喧鬧酒館</h2>
          <p className="text-2xs text-gray-500 mt-0.5">城鎮邊陲的灰色酒館，公佈欄上掛滿了刀口舔血的懸賞委託。</p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="px-3 py-1 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm"
        >
          🔙 返回城鎮
        </button>
      </div>

      {/* 橫向懸賞板切換 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {MISSIONS.map(m => (
          <button
            key={m.id}
            onClick={() => handleMissionChange(m.id)}
            className={`shrink-0 px-4 py-2 rounded-lg border transition-colors text-xs font-bold ${
              selectedMissionId === m.id 
                ? 'bg-blue-900 border-blue-500 text-white' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {m.title}
          </button>
        ))}
      </div>

      {selectedMission && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-4 shadow-md">
          <div>
            <h3 className="text-base font-bold text-white mb-1">{selectedMission.title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{selectedMission.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs bg-gray-950 p-3 rounded border border-gray-800 font-mono">
            <div className="text-gray-400">委託風險: <span className={selectedMission.risk === '高' ? 'text-red-400 font-bold animate-pulse' : 'text-yellow-500'}>{selectedMission.risk}</span></div>
            <div className="text-gray-400">預期賞金: <span className="text-yellow-500 font-bold">🪙 {selectedMission.reward}</span></div>
            <div className="text-gray-400">扣除體力: <span className="text-green-500">-{selectedMission.staminaCost}</span></div>
            <div className="text-gray-400">累積壓力: <span className="text-red-400">+{selectedMission.stressGain}</span></div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-2xs text-gray-400 font-bold">撕下懸賞並指派代理人：</label>
            <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="blue" />
          </div>

          <button 
            onClick={handleDispatch}
            className="mt-1 bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded border border-blue-700 transition-colors shadow text-xs sm:text-sm"
          >
            派遣成員執行悬赏
          </button>

          {sysMessage && (
            <div className={`p-2 border rounded text-xs text-center ${
              sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-400' : 'bg-gray-900 border-red-800 text-blood-red'
            }`}>
              {sysMessage.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
