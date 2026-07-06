import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function DispatchView() {
  const slaves = useGameStore((state) => state.slaves);
  const dailyMissions = useGameStore((state) => state.dailyMissions);
  const dispatchSlave = useGameStore((state) => state.dispatchSlave);
  const navigate = useGameStore((state) => state.navigate);
  const activeDispatches = useGameStore((state) => state.activeDispatches);
  const { leaderName, leaderFaintTurns } = useGameStore((state) => state.player);

  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedMission = dailyMissions.find(m => m.id === selectedMissionId);
  
  // 檢查首領狀態
  const isLeaderDispatched = activeDispatches.some(d => d.slaveId === 'LEADER');
  const isLeaderIdle = leaderFaintTurns === 0 && !isLeaderDispatched;

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  
  // ★ V2.9.4 將首領本體加入外派選單，並永久置頂
  const slaveOptions: Option[] = idleSlaves.map(s => ({
    value: s.id,
    label: `${s.name} (武:${s.primaryStats.combat} 智:${s.primaryStats.intelligence} 服從:${s.primaryStats.obedience})`
  }));

  if (isLeaderIdle) {
    slaveOptions.unshift({
      value: 'LEADER',
      label: `⭐【首領】${leaderName} (武:25 智:45)`
    });
  }

  const handleDispatch = () => {
    if (!selectedMission) {
      setSysMessage({ text: '［錯誤］請先在佈告欄上選擇一張懸賞委託。', type: 'error' });
      return;
    }
    if (!selectedSlaveId) {
      setSysMessage({ text: '［錯誤］請選擇要簽署生死契約的代理人。', type: 'error' });
      return;
    }

    if (selectedSlaveId === 'LEADER') {
      const { leaderStamina } = useGameStore.getState().player;
      if (leaderStamina < selectedMission.staminaCost) {
        setSysMessage({ text: `［拒絕］首領的體力不足以應付此高強度的委託。`, type: 'error' });
        return;
      }
    } else {
      const slave = slaves.find(s => s.id === selectedSlaveId);
      if (!slave) return;

      if (slave.activityStatus !== '閒置') {
        setSysMessage({ text: `［拒絕］${slave.name} 目前狀態為「${slave.activityStatus}」，無法重複指派！`, type: 'error' });
        return;
      }
      if (slave.conditionStats.stamina < selectedMission.staminaCost) {
        setSysMessage({ text: `［拒絕］${slave.name} 的體力不足以應付此高強度的委託。`, type: 'error' });
        return;
      }
    }

    dispatchSlave(selectedSlaveId, selectedMission.id);
    setSysMessage({ text: '［系統］外派契約已確立，目標已出發。', type: 'success' });
    setSelectedSlaveId('');
    setSelectedMissionId('');
    
    setTimeout(() => setSysMessage(null), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative min-h-[70vh]">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">深淵酒館</h2>
          <p className="text-2xs text-gray-500 mt-0.5">承接地下委託與黑市暗殺合約</p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［離開酒館］
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-400 border-l-2 border-blood-red pl-2">［任務佈告欄］</h3>
        
        {dailyMissions.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded p-6 text-center">
            <p className="text-xs text-gray-500">［目前佈告欄上沒有任何懸賞委託］</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto scrollbar-none pr-1">
            {dailyMissions.map((mission) => {
              const isSelected = selectedMissionId === mission.id;
              const rankColors = {
                '翠綠': 'text-green-400 border-green-900/50 bg-green-950/10',
                '蔚藍': 'text-blue-400 border-blue-900/50 bg-blue-950/10',
                '紫色': 'text-purple-400 border-purple-900/50 bg-purple-950/10',
                '黃金': 'text-yellow-400 border-yellow-900/50 bg-yellow-950/10'
              };
              const colorClass = rankColors[mission.rank];

              return (
                <button
                  key={mission.id}
                  onClick={() => setSelectedMissionId(mission.id)}
                  className={`text-left p-3 rounded border transition-all text-xs flex flex-col gap-1.5 ${
                    isSelected 
                      ? `border-gray-400 bg-gray-800 shadow-md transform scale-[1.01]` 
                      : `border-gray-800 hover:border-gray-600 bg-gray-900 opacity-80 hover:opacity-100 ${colorClass}`
                  }`}
                >
                  <div className="flex justify-between items-center font-bold">
                    <span className={isSelected ? 'text-gray-100' : ''}>{mission.title}</span>
                    <span className="text-yellow-500 font-mono">${mission.reward}</span>
                  </div>
                  <div className="flex gap-3 text-3xs text-gray-500 font-bold font-mono">
                    <span>耗時: {mission.requiredPhases}時段</span>
                    <span>體力: -{mission.staminaCost}</span>
                    <span>壓力: +{mission.stressGain}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {dailyMissions.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded p-4 flex flex-col gap-3 shadow-lg">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400 font-bold tracking-widest">［委託詳情］</label>
            <div className="bg-black/50 p-2 rounded border border-gray-800 min-h-[3rem] flex items-center">
              {!selectedMission ? (
                <span className="text-xs text-gray-600 italic">尚未選擇任務...</span>
              ) : (
                <p className="text-xs text-gray-300 leading-relaxed">「{selectedMission.description}」</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-800">
            <label className="text-xs text-gray-400 font-bold tracking-widest">［指派執行者］</label>
            {slaveOptions.length > 0 ? (
              <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="blue" />
            ) : (
              <div className="text-xs text-red-500 bg-red-950/20 p-2 border border-red-900/30 rounded">
                目前沒有可供差遣的戰力（首領與奴隸皆不可用）。
              </div>
            )}
          </div>

          <button 
            onClick={handleDispatch}
            disabled={slaveOptions.length === 0}
            className={`mt-2 font-bold py-2.5 rounded border transition-colors shadow text-xs tracking-widest ${
              slaveOptions.length === 0 
                ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500 hover:border-gray-400'
            }`}
          >
            ［簽署生死契約並啟程］
          </button>
        </div>
      )}

      {sysMessage && (
        <div className={`p-3 rounded border text-xs font-bold animate-fade-in text-center tracking-widest ${
          sysMessage.type === 'error' ? 'bg-red-950/80 border-red-900 text-red-400' : 'bg-green-950/80 border-green-900 text-green-400'
        }`}>
          {sysMessage.text}
        </div>
      )}
    </div>
  );
}
