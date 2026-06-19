import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

// 定義任務的資料結構
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
  { id: 'm1', title: '黑市護送', risk: '低', staminaCost: 20, stressGain: 10, reward: 300, description: '保護黑市商人的貨物，風險低但耗時。' },
  { id: 'm2', title: '礦場勞役', risk: '中', staminaCost: 50, stressGain: 30, reward: 800, description: '前往高壓礦場進行重勞力開採，極度消耗體力。' },
  { id: 'm3', title: '前線突襲', risk: '高', staminaCost: 80, stressGain: 60, reward: 2000, description: '參與極度危險的邊境突襲行動，高報酬伴隨極高壓力。' },
];

export default function DispatchView() {
  const slaves = useGameStore((state) => state.slaves);
  const addGold = useGameStore((state) => state.addGold);
  const updateCondition = useGameStore((state) => state.updateCondition);

  // 記錄使用者選擇的任務與奴隸
  const [selectedMissionId, setSelectedMissionId] = useState<string>(MISSIONS[0].id);
  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleDispatch = () => {
    if (!selectedSlaveId) {
      setSysMessage({ text: '請先選擇要派遣的成員！', type: 'error' });
      return;
    }

    const mission = MISSIONS.find(m => m.id === selectedMissionId);
    const slave = slaves.find(s => s.id === selectedSlaveId);

    if (!mission || !slave) return;

    // 邏輯防呆：檢查體力是否足夠
    if (slave.conditionStats.stamina < mission.staminaCost) {
      setSysMessage({ text: `派遣失敗！${slave.name} 的體力不足 (需 ${mission.staminaCost}，當前 ${slave.conditionStats.stamina})。`, type: 'error' });
      return;
    }

    // 進行數學運算與狀態更新
    const newStamina = Math.max(0, slave.conditionStats.stamina - mission.staminaCost);
    const newStress = Math.min(100, slave.conditionStats.stress + mission.stressGain);

    updateCondition(slave.id, { stamina: newStamina, stress: newStress });
    addGold(mission.reward);

    setSysMessage({ text: `派遣成功！${slave.name} 完成了【${mission.title}】，獲得資金 ${mission.reward}。`, type: 'success' });
    
    // 操作完畢後清空選擇
    setSelectedSlaveId('');
  };

  const selectedMission = MISSIONS.find(m => m.id === selectedMissionId);

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">外部派遣</h2>
        <span className="text-sm text-gray-500">消耗體力換取資金</span>
      </div>

      {/* 任務選擇面板 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {MISSIONS.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMissionId(m.id)}
            className={`shrink-0 px-4 py-2 rounded-lg border transition-colors text-sm ${
              selectedMissionId === m.id 
                ? 'bg-blue-900 border-blue-500 text-white' 
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {m.title}
          </button>
        ))}
      </div>

      {/* 任務詳情與執行面板 */}
      {selectedMission && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col gap-4 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{selectedMission.title}</h3>
            <p className="text-sm text-gray-400">{selectedMission.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm bg-gray-900 p-3 rounded border border-gray-700">
            <div className="text-gray-300">風險: <span className={selectedMission.risk === '高' ? 'text-blood-red' : 'text-yellow-500'}>{selectedMission.risk}</span></div>
            <div className="text-gray-300">預期報酬: <span className="text-yellow-500 font-bold">+{selectedMission.reward}</span></div>
            <div className="text-gray-300">體力消耗: <span className="text-green-500">-{selectedMission.staminaCost}</span></div>
            <div className="text-gray-300">壓力增加: <span className="text-red-400">+{selectedMission.stressGain}</span></div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm text-gray-300 font-bold">選擇派遣成員：</label>
            <select 
              className="bg-gray-900 border border-gray-600 text-gray-200 p-3 rounded outline-none focus:border-blue-500"
              value={selectedSlaveId}
              onChange={(e) => setSelectedSlaveId(e.target.value)}
            >
              <option value="">-- 請選擇 --</option>
              {slaves.map(s => (
                <option key={s.id} value={s.id} disabled={s.conditionStats.stamina < selectedMission.staminaCost}>
                  {s.name} (體力: {s.conditionStats.stamina} / 壓力: {s.conditionStats.stress}) 
                  {s.conditionStats.stamina < selectedMission.staminaCost ? ' - 體力不足' : ''}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleDispatch}
            className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-lg border border-blue-700 transition-colors shadow-md"
          >
            確認派遣
          </button>

          {sysMessage && (
            <div className={`p-3 border rounded text-sm text-center animate-pulse ${
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
