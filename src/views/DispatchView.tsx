import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

type DispatchCandidate = {
  id: string;
  isLeader: boolean;
  name: string;
  stamina: number;
  combat: number;
  intelligence: number;
  isInjured: boolean;
  faintTurns: number;
  race: string;
  gender: string;
};

export default function DispatchView() {
  const slaves = useGameStore((state) => state.slaves);
  const dailyMissions = useGameStore((state) => state.dailyMissions);
  const dispatchSlave = useGameStore((state) => state.dispatchSlave);
  const navigate = useGameStore((state) => state.navigate);
  const activeDispatches = useGameStore((state) => state.activeDispatches);
  const { leaderName, leaderGender, leaderStamina, leaderFaintTurns } = useGameStore((state) => state.player);

  const [selectedMissionId, setSelectedMissionId] = useState<string>('');
  const [isSelectingSlave, setIsSelectingSlave] = useState<boolean>(false);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const safeLeaderStamina = isNaN(leaderStamina) ? 100 : leaderStamina;
  const selectedMission = dailyMissions.find(m => m.id === selectedMissionId);
  
  // 篩選與重構可用人力清單
  const isLeaderDispatched = activeDispatches.some(d => d.slaveId === 'LEADER');
  const isLeaderIdle = leaderFaintTurns === 0 && !isLeaderDispatched;
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  const candidates: DispatchCandidate[] = [];
  if (isLeaderIdle) {
    candidates.push({
      id: 'LEADER', isLeader: true, name: leaderName, stamina: safeLeaderStamina,
      combat: 25, intelligence: 45, isInjured: false, faintTurns: 0, race: '人類(首領)', gender: leaderGender
    });
  }
  idleSlaves.forEach(s => {
    candidates.push({
      id: s.id, isLeader: false, name: s.name, stamina: s.conditionStats.stamina,
      combat: s.primaryStats.combat, intelligence: s.primaryStats.intelligence,
      isInjured: s.isInjured, faintTurns: s.faintTurns || 0, race: s.race, gender: s.gender
    });
  });

  const activeCandidate = candidates[carouselIndex] || null;

  // 避免輪播索引越界
  useEffect(() => {
    if (carouselIndex >= candidates.length) {
      setCarouselIndex(Math.max(0, candidates.length - 1));
    }
  }, [candidates.length, carouselIndex]);

  const handleDispatch = () => {
    if (!selectedMission || !activeCandidate) return;

    if (activeCandidate.stamina < selectedMission.staminaCost) {
      setSysMessage({ text: `［拒絕］${activeCandidate.name} 的體力不足以應付此高強度的委託。`, type: 'error' });
      return;
    }

    dispatchSlave(activeCandidate.id, selectedMission.id);
    setSysMessage({ text: `［系統］已簽署生死契約，【${activeCandidate.name}】已啟程執行委託。`, type: 'success' });
    setIsSelectingSlave(false);
    setSelectedMissionId('');
    setCarouselIndex(0);
    
    setTimeout(() => setSysMessage(null), 3000);
  };

  const prevCarousel = () => setCarouselIndex(prev => (prev === 0 ? candidates.length - 1 : prev - 1));
  const nextCarousel = () => setCarouselIndex(prev => (prev === candidates.length - 1 ? 0 : prev + 1));

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative min-h-[70vh] z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-300">深淵酒館</h2>
          <p className="text-2xs text-gray-500 mt-0.5">承接地下委託與黑市暗殺合約</p>
        </div>
      </div>

      {sysMessage && !isSelectingSlave && (
        <div className={`p-3 rounded border text-xs font-bold animate-fade-in text-center tracking-widest shrink-0 shadow-lg ${
          sysMessage.type === 'error' ? 'bg-red-950/80 border-red-900 text-red-400' : 'bg-green-950/80 border-green-900 text-green-400'
        }`}>
          {sysMessage.text}
        </div>
      )}

      {/* 第一段：懸賞任務清單 (橫向滑動) */}
      <div className="flex flex-col gap-2 shrink-0">
        <h3 className="text-sm font-bold text-gray-400 border-l-2 border-blood-red pl-2 tracking-widest">［今日懸賞佈告欄］</h3>
        
        {dailyMissions.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded p-6 text-center mt-2">
            <p className="text-xs text-gray-500">［目前佈告欄上沒有任何懸賞委託］</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x scrollbar-none py-2 px-1">
            {dailyMissions.map((mission) => {
              const isSelected = selectedMissionId === mission.id;
              const rankColors = {
                '翠綠': 'text-green-400 border-green-900/50 bg-green-950/30',
                '蔚藍': 'text-blue-400 border-blue-900/50 bg-blue-950/30',
                '紫色': 'text-purple-400 border-purple-900/50 bg-purple-950/30',
                '黃金': 'text-yellow-400 border-yellow-900/50 bg-yellow-950/30'
              };
              const colorClass = rankColors[mission.rank];

              return (
                <button
                  key={mission.id}
                  onClick={() => setSelectedMissionId(mission.id)}
                  className={`min-w-[220px] max-w-[260px] text-left p-3 rounded-xl border flex flex-col gap-2 snap-center transition-all duration-300 shrink-0 ${
                    isSelected 
                      ? `border-gray-300 bg-gray-800 shadow-[0_0_15px_rgba(255,255,255,0.1)] transform scale-105` 
                      : `border-gray-800 hover:border-gray-600 bg-gray-900/80 opacity-80 hover:opacity-100 ${colorClass}`
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : ''}`}>{mission.title}</span>
                  </div>
                  <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-800/50">
                    <span className="text-3xs text-gray-500 font-bold tracking-widest">{mission.rank}級委託</span>
                    <span className="text-yellow-500 font-mono text-sm font-black">${mission.reward}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 任務詳細資料面板 */}
      {selectedMission && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-4 shadow-xl animate-fade-in mt-2 shrink-0">
          <div className="flex flex-col gap-1.5 border-b border-gray-800 pb-3">
            <h4 className="text-sm font-bold text-gray-200">{selectedMission.title}</h4>
            <p className="text-xs text-gray-400 leading-relaxed">「{selectedMission.description}」</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
             <div className="bg-gray-950 p-2 rounded border border-gray-800 flex flex-col gap-1">
                <span className="text-3xs text-gray-500">消耗時段</span>
                <span className="font-mono text-gray-300 font-bold">{selectedMission.requiredPhases}</span>
             </div>
             <div className="bg-gray-950 p-2 rounded border border-gray-800 flex flex-col gap-1">
                <span className="text-3xs text-gray-500">扣除體力</span>
                <span className="font-mono text-red-400 font-bold">-{selectedMission.staminaCost}</span>
             </div>
             <div className="bg-gray-950 p-2 rounded border border-gray-800 flex flex-col gap-1">
                <span className="text-3xs text-gray-500">壓力增幅</span>
                <span className="font-mono text-yellow-500 font-bold">+{selectedMission.stressGain}</span>
             </div>
          </div>

          <button 
            onClick={() => setIsSelectingSlave(true)}
            disabled={candidates.length === 0}
            className={`py-3 rounded border font-bold text-xs tracking-widest shadow-md transition-all ${
              candidates.length === 0 
                ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-white text-gray-900 border-gray-300 hover:scale-[1.02]'
            }`}
          >
            {candidates.length === 0 ? '［無可用人力］' : '［準備承接此委託］'}
          </button>
        </div>
      )}

      {/* 第二段：指派人員彈窗 (3D Carousel) */}
      {isSelectingSlave && selectedMission && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
          
          <div className="absolute top-6 right-6 z-[110]">
            <button onClick={() => setIsSelectingSlave(false)} className="text-gray-400 hover:text-white bg-gray-900 border border-gray-700 px-4 py-2 rounded font-bold text-xs shadow-lg tracking-widest transition-colors">
              ［取消外派］
            </button>
          </div>

          <div className="text-center mb-6 z-[110]">
             <h3 className="text-xl font-bold text-gray-200 mb-2 tracking-widest">指派執行者</h3>
             <p className="text-xs text-red-400 font-bold bg-red-950/40 px-3 py-1.5 rounded-full border border-red-900/50 inline-block">
               此委託將強制消耗 <span className="text-base">{selectedMission.staminaCost}</span> 點體力
             </p>
          </div>

          <div className="w-full max-w-lg relative flex flex-col items-center z-[110]">
             
            {/* 3D 輪播區塊 */}
            <div className="flex items-center justify-center w-full h-[240px] relative overflow-hidden perspective-1000 pointer-events-none">
              {candidates.map((cand, index) => {
                const diff = index - carouselIndex;
                const isCenter = diff === 0;
                const isLeft = diff === -1 || (carouselIndex === 0 && index === candidates.length - 1);
                const isRight = diff === 1 || (carouselIndex === candidates.length - 1 && index === 0);
                
                if (!isCenter && !isLeft && !isRight) return null;

                let transformClass = "";
                if (isCenter) transformClass = "translate-x-0 scale-100 z-40 opacity-100 pointer-events-auto shadow-[0_0_30px_rgba(0,0,0,0.8)]";
                if (isLeft) transformClass = "-translate-x-[35%] scale-80 z-20 opacity-40 rotate-y-25 cursor-pointer pointer-events-auto hover:opacity-60";
                if (isRight) transformClass = "translate-x-[35%] scale-80 z-20 opacity-40 -rotate-y-25 cursor-pointer pointer-events-auto hover:opacity-60";

                const isStaminaInsufficient = cand.stamina < selectedMission.staminaCost;

                return (
                  <div 
                    key={cand.id}
                    onClick={() => { if (!isCenter) setCarouselIndex(index); }}
                    className={`absolute w-[220px] sm:w-[260px] h-full bg-gray-900 border ${cand.isLeader ? 'border-yellow-600/50' : 'border-gray-700'} rounded-xl p-4 transition-all duration-500 ease-out flex flex-col justify-between transform ${transformClass} select-none shrink-0`}
                  >
                    {isStaminaInsufficient && isCenter && (
                      <div className="absolute inset-0 bg-red-950/80 z-50 flex flex-col items-center justify-center p-3 text-center backdrop-blur-xs rounded-xl">
                        <span className="text-red-400 font-black tracking-widest text-xs border-y border-red-900 py-2 w-full bg-black/50">
                          ［體力嚴重不足］
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-start w-full border-b border-gray-800 pb-2">
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-black text-sm tracking-widest ${cand.isLeader ? 'text-yellow-500' : 'text-gray-200'}`}>
                          {cand.name}
                        </span>
                        <span className="text-3xs text-gray-500 font-bold">
                           {cand.race} ({cand.gender === 'Male' ? '男' : '女'})
                        </span>
                      </div>
                      {cand.isLeader && <span className="text-4xs px-1.5 py-0.5 bg-yellow-900/40 border border-yellow-700/50 text-yellow-500 font-bold rounded">首領</span>}
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-2 text-xs">
                       <div className="flex justify-between items-center bg-gray-950 p-2 rounded border border-gray-800">
                          <span className="text-gray-500 text-3xs font-bold">武力</span>
                          <span className="text-red-400 font-bold font-mono">{cand.combat}</span>
                       </div>
                       <div className="flex justify-between items-center bg-gray-950 p-2 rounded border border-gray-800">
                          <span className="text-gray-500 text-3xs font-bold">智力</span>
                          <span className="text-blue-400 font-bold font-mono">{cand.intelligence}</span>
                       </div>
                    </div>

                    <div className="w-full flex flex-col gap-1 mt-2">
                      <div className="flex justify-between text-4xs text-gray-500">
                        <span>當前體力</span>
                        <span className={isStaminaInsufficient ? 'text-red-500 font-bold font-mono' : 'font-mono text-green-400'}>{cand.stamina}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                         <div className={`h-full transition-all duration-300 ${isStaminaInsufficient ? 'bg-red-600' : 'bg-green-600'}`} style={{ width: `${cand.stamina}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-8 mt-5 z-[110] relative">
              <button onClick={prevCarousel} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors active:scale-95 shadow-md cursor-pointer">
                〈 上一位
              </button>
              <button onClick={nextCarousel} className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-colors active:scale-95 shadow-md cursor-pointer">
                下一位 〉
              </button>
            </div>

            {sysMessage && isSelectingSlave && (
              <div className="mt-4 p-2 w-full text-center text-xs font-bold text-red-400 bg-red-950/80 border border-red-900 rounded animate-fade-in z-[110]">
                {sysMessage.text}
              </div>
            )}

            <button 
              onClick={handleDispatch}
              disabled={!activeCandidate || activeCandidate.stamina < selectedMission.staminaCost}
              className={`w-full mt-6 py-3.5 rounded-lg border font-bold text-sm tracking-widest shadow-xl transition-all z-[110] ${
                !activeCandidate || activeCandidate.stamina < selectedMission.staminaCost
                  ? 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
                  : 'bg-blood-red/80 hover:bg-blood-red text-white border-red-900 hover:scale-[1.02]'
              }`}
            >
              ［簽署生死契約並啟程］
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
