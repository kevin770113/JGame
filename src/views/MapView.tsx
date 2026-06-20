import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GAME_CONSTANTS } from '../utils/constants';
import { Location } from '../types';

interface LocationInfo {
  id: Location;
  name: string;
  cost: number;
  description: string;
  perks: string;
}

const LOCATIONS: LocationInfo[] = [
  { 
    id: 'Frontlines', 
    name: '混亂前線邊境', 
    cost: GAME_CONSTANTS.RELOCATION_COST.Frontlines, 
    description: '狼煙四起的邊防交戰區，法外之徒的流放地。',
    perks: '搬遷成本低廉。初始容納上限 5 人。'
  },
  { 
    id: 'NeutralHub', 
    name: '中立貿易核心城', 
    cost: GAME_CONSTANTS.RELOCATION_COST.NeutralHub, 
    description: '三大帝國簽署互不侵犯協議的灰色交易核心。',
    perks: '解鎖商會人口上限至 10 人，環境髒亂汙染累積速度減緩 30%。'
  },
  { 
    id: 'Capital', 
    name: '安逸極樂皇城', 
    cost: GAME_CONSTANTS.RELOCATION_COST.Capital, 
    description: '戒備森嚴的絕對權力王都，極度排外的奢華牢籠。',
    perks: '解鎖極限人口上限至 20 人，基礎設施完美，每日髒亂度累積減緩 60%。'
  },
];

export default function MapView() {
  const { gold, location: currentLocation } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const changeLocation = useGameStore((state) => state.changeLocation);
  const navigate = useGameStore((state) => state.navigate);

  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleRelocate = (targetLocation: LocationInfo) => {
    if (currentLocation === targetLocation.id) {
      setSysMessage({ text: '［提示］您的商會目前已經駐紮在此據點。', type: 'error' });
      return;
    }

    if (gold < targetLocation.cost) {
      setSysMessage({ text: `［拒絕］護送與疏通資金不足。遷移至【${targetLocation.name}】需要 ${targetLocation.cost} 資金。`, type: 'error' });
      return;
    }

    deductGold(targetLocation.cost);
    changeLocation(targetLocation.id);
    setSysMessage({ text: `［系統］遷移協議已生效。整個據點已正式搬遷進駐【${targetLocation.name}】。`, type: 'success' });
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">商會拔營遷移</h2>
          <p className="text-2xs text-gray-500 mt-0.5">可用資產: <span className="text-yellow-500 font-mono font-bold">{gold}</span></p>
        </div>
        <button 
          onClick={() => navigate('Home', 'Main')}
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回大廳］
        </button>
      </div>

      <p className="text-xs text-gray-400">
        更換商會駐紮地將直接改變內政基礎設施，擴展最大居住限額並改寫環境抗汙能力。
      </p>

      {sysMessage && (
        <div className={`p-3 border rounded text-xs leading-relaxed tracking-wide ${
          sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 'bg-gray-900 border-red-900 text-red-500'
        }`}>
          {sysMessage.text}
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2">
        {LOCATIONS.map((loc) => {
          const isCurrent = currentLocation === loc.id;
          const canAfford = gold >= loc.cost;

          return (
            <div 
              key={loc.id} 
              className={`p-4 rounded-lg border flex flex-col gap-3 shadow-md relative overflow-hidden ${
                isCurrent ? 'bg-gray-800 border-blood-red' : 'bg-gray-900 border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 tracking-widest ${isCurrent ? 'text-blood-red' : 'text-gray-200'}`}>
                    【{loc.name}】
                    {isCurrent && <span className="text-3xs bg-blood-red text-white px-1.5 py-0.5 rounded tracking-normal">目前駐紮</span>}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5">{loc.description}</p>
                </div>
              </div>

              <div className="text-2xs text-gray-300 bg-gray-950 p-2.5 rounded border border-gray-800 font-sans leading-relaxed">
                <span className="text-gray-500 font-bold">［解鎖基建特性］</span><br/>{loc.perks}
              </div>

              {!isCurrent && (
                <div className="flex justify-between items-center mt-1 z-10 border-t border-gray-800 pt-3">
                  <span className="text-xs text-gray-400 font-bold tracking-widest">
                    疏通開銷: <strong className={canAfford ? 'text-yellow-500 font-mono' : 'text-red-500 font-mono'}>{loc.cost}</strong>
                  </span>
                  <button
                    onClick={() => handleRelocate(loc)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded font-bold text-xs transition-colors tracking-widest ${
                      canAfford 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-500 hover:border-gray-400' 
                        : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '［下令拔營］' : '［資產不足］'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
