import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function HousekeepingView() {
  const { roomDirtiness, actionPoints, leaderName, leaderStamina, leaderFaintTurns } = useGameStore((state) => state.player);
  const slaves = useGameStore((state) => state.slaves);
  const activeDispatches = useGameStore((state) => state.activeDispatches);
  const performHousekeeping = useGameStore((state) => state.performHousekeeping);
  const navigate = useGameStore((state) => state.navigate);

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  const isLeaderDispatched = activeDispatches.some(d => d.slaveId === 'LEADER');
  const isLeaderIdle = leaderFaintTurns === 0 && !isLeaderDispatched;

  const safeLeaderStamina = isNaN(leaderStamina) ? 100 : leaderStamina;

  const workerOptions: Option[] = [];

  // 首領選項
  if (isLeaderIdle) {
    const leaderExhausted = safeLeaderStamina < 20;
    workerOptions.push({
      value: 'LEADER',
      label: `［首領］${leaderName} (體力: ${safeLeaderStamina}/100) ${leaderExhausted ? '［體力不足］' : ''}`,
      disabled: leaderExhausted
    });
  }

  // 奴隸選項
  idleSlaves.forEach(s => {
    const isExhausted = s.conditionStats.stamina < 15;
    workerOptions.push({
      value: s.id,
      label: `［成員］${s.name} (體力: ${s.conditionStats.stamina}/100 | 內政: ${s.skills.housework}) ${isExhausted ? '［體力不足］' : ''}`,
      disabled: isExhausted
    });
  });

  const handleConfirm = () => {
    if (!selectedWorkerId) {
      setSysMessage({ text: '［錯誤］請先選擇要指派的清潔負責人。', type: 'error' });
      return;
    }
    if (actionPoints < 1) {
      setSysMessage({ text: '［系統警告］行動力不足，無法下達命令。', type: 'error' });
      return;
    }

    performHousekeeping(selectedWorkerId);
    setSysMessage({ text: '［系統］已完成據點清潔工作並推進時段。', type: 'success' });
    setSelectedWorkerId('');
    setTimeout(() => setSysMessage(null), 3000);
  };

  const staminaCost = selectedWorkerId === 'LEADER' ? 20 : (selectedWorkerId ? 15 : '--');

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative min-h-[70vh]">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">家政管理</h2>
          <p className="text-2xs text-gray-500 mt-0.5">指派成員打掃據點，維持環境整潔以保障恢復效率。</p>
        </div>
        <button 
          onClick={() => navigate('Home', 'Main')}
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回大廳］
        </button>
      </div>

      <div className="bg-gray-900/80 p-4 sm:p-5 rounded-lg border border-gray-800 shadow-lg flex flex-col gap-5 mt-2">
        
        {/* 完美適配截圖 6216.png 的警告區塊 */}
        <div className="bg-gray-950 p-4 rounded border border-gray-800 flex flex-col gap-3">
          <div className="text-gray-400 text-sm font-bold tracking-widest">
            當前據點環境總髒亂度：<span className="text-yellow-500 ml-1">{roomDirtiness}%</span>
          </div>
          <div className="text-gray-400 text-sm font-bold tracking-widest mt-1">
            下達此命令將強制消耗該成員 <span className="text-red-400 text-base mx-1">{staminaCost}</span> 點體力。
          </div>
          <div className="text-yellow-600 text-sm font-bold tracking-widest mt-3">
            [注意] 消耗 1 點行動力並推進 1 個時段。
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs text-gray-400 font-bold tracking-widest border-l-2 border-blue-500 pl-2">［指派清潔負責人］</label>
          {workerOptions.length > 0 ? (
            <CustomSelect options={workerOptions} value={selectedWorkerId} onChange={setSelectedWorkerId} focusColor="blue" />
          ) : (
            <div className="text-xs text-red-500 bg-red-950/20 p-2 border border-red-900/30 rounded">
              目前沒有可供差遣的人力（首領與奴隸體力皆不足或正忙碌中）。
            </div>
          )}
        </div>

        <button 
          onClick={handleConfirm}
          disabled={workerOptions.length === 0 || !selectedWorkerId || actionPoints < 1}
          className={`mt-4 font-bold py-3 rounded border transition-colors shadow text-xs tracking-widest ${
            workerOptions.length === 0 || !selectedWorkerId || actionPoints < 1
              ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
              : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500 hover:border-gray-400'
          }`}
        >
          ［確認指派並推進時間］
        </button>

        {sysMessage && (
          <div className={`p-3 rounded border text-xs font-bold animate-fade-in text-center tracking-widest mt-2 ${
            sysMessage.type === 'error' ? 'bg-red-950/80 border-red-900 text-red-400' : 'bg-green-950/80 border-green-900 text-green-400'
          }`}>
            {sysMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
