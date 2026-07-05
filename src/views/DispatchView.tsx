import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';

export default function DispatchView() {
  const slaves = useGameStore((state) => state.slaves);
  const dailyMissions = useGameStore((state) => state.dailyMissions);
  const dispatchSlave = useGameStore((state) => state.dispatchSlave);
  const navigate = useGameStore((state) => state.navigate);

  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedMission = dailyMissions.find(m => m.id === selectedMissionId);

  const handleDispatch = () => {
    if (!selectedMission) {
      setSysMessage({ text: '［錯誤］請先在佈告欄上選擇一張懸賞委託。', type: 'error' });
      return;
    }
    if (!selectedSlaveId) {
      setSysMessage({ text: '［錯誤］請選擇要簽署生死契約的代理人。', type: 'error' });
      return;
    }

    const slave = slaves.find(s => s.id === selectedSlaveId);
    if (!slave) return;

    if (slave.activityStatus !== '閒置') {
      setSysMessage({ text: `［拒絕］${slave.name} 目前狀態為「${slave.activityStatus}」，無法接取新委託。`, type: 'error' });
      return;
    }

    if (slave.conditionStats.stamina < selectedMission.staminaCost) {
      setSysMessage({ text: `［警告］${slave.name} 體力嚴重透支，強行指派將導致在任務中暴斃。`, type: 'error' });
      return;
    }

    dispatchSlave(slave.id, selectedMission.id);
    setSysMessage({ 
      text: `［系統］契約成立。${slave.name} 已啟程執行【${selectedMission.title}】，預計將於 ${selectedMission.requiredPhases} 個時段後歸來並結算賞金。`, 
      type: 'success' 
    });
    setSelectedMissionId('');
    setSelectedSlaveId('');
  };

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  // ★ V2.8.0 強化：下拉選單同步顯示目前服從度，方便玩家挑選需要洗服從的成員
  const slaveOptions: Option[] = idleSlaves.map(s => {
    const isExhausted = selectedMission ? s.conditionStats.stamina < selectedMission.staminaCost : false;
    return {
      value: s.id,
      label: `${s.name} (體力: ${s.conditionStats.stamina} | 服從: ${s.primaryStats.obedience}) ${isExhausted ? '［體力透支］' : ''}`,
      disabled: isExhausted
    };
  });

  const getRankStyle = (rank: string) => {
    if (rank === '黃金') return 'text-yellow-500 border-yellow-700 bg-yellow-950/30';
    if (rank === '紫色') return 'text-purple-400 border-purple-700 bg-purple-950/30'; 
    if (rank === '蔚藍') return 'text-blue-400 border-blue-700 bg-blue-950/30';
    return 'text-green-500 border-green-700 bg-green-950/30';
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-48 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">深淵酒館</h2>
          <p className="text-xs text-gray-500 mt-1">充斥著劣質麥酒與血腥味的地下酒館。佈告欄上釘滿了以生命為籌碼的委託。</p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回城鎮］
        </button>
      </div>

      {dailyMissions.length === 0 ? (
        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-lg text-center my-4 text-gray-500 text-sm tracking-wide">
          ［告示］今日的懸賞委託已被清空。請等待明日破曉時的商會更新。
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="text-xs text-gray-500 font-bold border-b border-gray-800 pb-1">［懸賞佈告欄］</div>
          <div className="flex flex-col gap-2">
            {dailyMissions.map(m => {
              // ★ V2.8.0 兼容舊存檔：若無機率屬性則預設為 100%
              const successRate = m.successRate ?? 1.0;
              const rateColor = successRate >= 1 ? 'text-green-500' : successRate >= 0.8 ? 'text-yellow-500' : 'text-red-500';

              return (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMissionId(m.id); setSysMessage(null); }}
                  className={`text-left p-3 rounded border transition-all ${
                    selectedMissionId === m.id 
                      ? 'border-gray-400 bg-gray-800 shadow-md' 
                      : 'border-gray-800 bg-gray-900 hover:bg-gray-800/80 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-2xs font-bold px-1.5 py-0.5 rounded border ${getRankStyle(m.rank)} tracking-widest`}>
                      {m.rank}級委託
                    </span>
                    <span className="text-gray-400 text-xs font-mono">耗時: {m.requiredPhases} 時段</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-200">{m.title}</h4>
                  
                  {/* ★ V2.8.0 介面升級：加入機率與服從度回報顯示 */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 text-xs font-mono bg-gray-950 p-2 rounded border border-gray-800">
                    <span className="text-yellow-600">賞金: {m.reward}</span>
                    <span className="text-green-600">體力: -{m.staminaCost}</span>
                    <span className="text-red-400">壓力: +{m.stressGain}</span>
                    <span className={`font-bold ${rateColor}`}>
                      成功率: {(successRate * 100).toFixed(0)}%
                    </span>
                    {(m.obedienceReward || 0) > 0 && (
                      <span className="text-blue-400 font-bold">服從: +{m.obedienceReward}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedMission && (
        <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 flex flex-col gap-4 shadow-lg animate-slide-up mt-2">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 border-l-2 border-blood-red pl-2">{selectedMission.title}</h3>
            {/* ★ V2.8.0 血紅警告：若說明中包含「失敗懲罰」，將其獨立標紅加粗 */}
            <div className="text-xs text-gray-400 leading-relaxed mt-2">
              {selectedMission.description.includes('［失敗懲罰］') ? (
                <>
                  <p className="italic">「{selectedMission.description.split('［失敗懲罰］')[0]}」</p>
                  <div className="mt-2 p-2 bg-red-950/30 border border-red-900/50 rounded">
                    <span className="text-red-500 font-black tracking-widest block mb-0.5">［失敗懲罰］</span>
                    <span className="text-red-400">{selectedMission.description.split('［失敗懲罰］')[1]}</span>
                  </div>
                </>
              ) : (
                <p className="italic">「{selectedMission.description}」</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-800">
            <label className="text-xs text-gray-400 font-bold tracking-widest">［指派執行者］</label>
            {idleSlaves.length > 0 ? (
              <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="blue" />
            ) : (
              <div className="text-xs text-red-500 bg-red-950/20 p-2 border border-red-900/30 rounded">
                目前據點內沒有處於「閒置」狀態的成員可供差遣。
              </div>
            )}
          </div>

          <button 
            onClick={handleDispatch}
            disabled={idleSlaves.length === 0}
            className={`mt-2 font-bold py-2.5 rounded border transition-colors shadow text-xs tracking-widest ${
              idleSlaves.length === 0 
                ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500 hover:border-gray-400'
            }`}
          >
            ［簽署生死契約並啟程］
          </button>
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
