import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { GAME_CONSTANTS } from '../utils/constants';
import { Location } from '../types';

// 定義地圖據點的擴充資訊
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
    name: '混亂前線', 
    cost: GAME_CONSTANTS.RELOCATION_COST.Frontlines, 
    description: '戰火連天的荒蕪邊境，充斥著危險與機遇。',
    perks: '維持成本極低，奴隸市場常有便宜的戰俘。'
  },
  { 
    id: 'NeutralHub', 
    name: '中立貿易城', 
    cost: GAME_CONSTANTS.RELOCATION_COST.NeutralHub, 
    description: '各方勢力交匯的灰色地帶，商業極度繁榮。',
    perks: '擁有最齊全的物資與穩定的市場交易。'
  },
  { 
    id: 'Capital', 
    name: '安逸皇城', 
    cost: GAME_CONSTANTS.RELOCATION_COST.Capital, 
    description: '絕對安全的權力中心，奢華且排外。',
    perks: '毫無戰亂壓力，能接觸到極其稀有的頂級血統。'
  },
];

export default function MapView() {
  const { gold, location: currentLocation } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const changeLocation = useGameStore((state) => state.changeLocation);

  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleRelocate = (targetLocation: LocationInfo) => {
    if (currentLocation === targetLocation.id) {
      setSysMessage({ text: '您目前已經在此據點！', type: 'error' });
      return;
    }

    if (gold < targetLocation.cost) {
      setSysMessage({ text: `資金不足！遷移至【${targetLocation.name}】需要 ${targetLocation.cost} 資金。`, type: 'error' });
      return;
    }

    // 扣除資金並變更據點
    deductGold(targetLocation.cost);
    changeLocation(targetLocation.id);
    
    setSysMessage({ text: `遷移成功！您的商隊已正式進駐【${targetLocation.name}】。`, type: 'success' });
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">據點遷移</h2>
        <span className="text-sm text-yellow-500">持有資金: {gold}</span>
      </div>

      <p className="text-sm text-gray-400">
        不同的據點會影響未來的市場物價與日常消耗。遷移需要支付高昂的商隊護送與打點費用。
      </p>

      {sysMessage && (
        <div className={`p-3 border rounded text-sm text-center animate-pulse ${
          sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-400' : 'bg-gray-900 border-red-800 text-blood-red'
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
              className={`p-4 rounded-lg border flex flex-col gap-3 shadow-lg relative overflow-hidden ${
                isCurrent ? 'bg-gray-800 border-blood-red' : 'bg-gray-900 border-gray-700'
              }`}
            >
              {/* 當前據點的背景光暈提示 */}
              {isCurrent && <div className="absolute -right-10 -top-10 w-32 h-32 bg-blood-red opacity-10 blur-3xl pointer-events-none"></div>}

              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isCurrent ? 'text-blood-red' : 'text-white'}`}>
                    {loc.name}
                    {isCurrent && <span className="text-xs bg-blood-red text-white px-2 py-0.5 rounded">當前所在</span>}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">{loc.description}</p>
                </div>
              </div>

              <div className="text-sm text-gray-300 bg-gray-800 p-2 rounded z-10">
                <span className="text-gray-500">據點特性：</span>{loc.perks}
              </div>

              {!isCurrent && (
                <div className="flex justify-between items-center mt-2 z-10 border-t border-gray-700 pt-3">
                  <span className="text-sm text-gray-400">
                    遷移費用: <strong className={canAfford ? 'text-yellow-500' : 'text-red-500'}>{loc.cost}</strong>
                  </span>
                  <button
                    onClick={() => handleRelocate(loc)}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                      canAfford 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-500' 
                        : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '拔營遷移' : '資金不足'}
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
