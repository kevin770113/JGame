import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import { Slave, Race } from '../types';

// 擴充一個帶有價格的型別，專供市場使用
interface MarketSlave extends Slave {
  price: number;
}

const RACES: Race[] = ['Orc', 'Dwarf', 'Elf', 'Dragon', 'Undead', 'Human'];

// 簡易亂數產生器：生成隨機待售奴隸
const generateMarketSlave = (): MarketSlave => {
  const race = RACES[Math.floor(Math.random() * RACES.length)];
  const id = 'market-' + Math.random().toString(36).substring(2, 9);
  
  return {
    id,
    name: `未知的 ${race}`, // 之後這部分會串接 AI 來生成專屬名字
    race,
    primaryStats: { 
      combat: Math.floor(Math.random() * 60) + 20, 
      endurance: Math.floor(Math.random() * 60) + 20, 
      intelligence: Math.floor(Math.random() * 60) + 20, 
      obedience: Math.floor(Math.random() * 40) + 10 
    },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [],
    backgroundStory: '在戰亂中流離失所的流民，正在等待買家。',
    price: Math.floor(Math.random() * 800) + 200, // 價格介於 200~1000
  };
};

export default function MarketView() {
  // 從狀態機讀取金錢與動作
  const gold = useGameStore((state) => state.player.gold);
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  
  const [marketSlaves, setMarketSlaves] = useState<MarketSlave[]>([]);

  // 畫面初次載入時，生成 3 名待售奴隸
  useEffect(() => {
    setMarketSlaves([generateMarketSlave(), generateMarketSlave(), generateMarketSlave()]);
  }, []);

  // 處理購買邏輯
  const handleBuy = (slave: MarketSlave) => {
    if (gold >= slave.price) {
      // 1. 扣錢
      deductGold(slave.price);
      // 2. 拔除 price 屬性後，將純淨的 slave 資料加入玩家陣列
      const { price, ...slaveData } = slave;
      addSlave(slaveData);
      // 3. 從市場的架上移除已購買的奴隸
      setMarketSlaves(marketSlaves.filter(s => s.id !== slave.id));
    } else {
      alert('資金不足！');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">奴隸市場</h2>
        <span className="text-sm text-yellow-500">持有資金: {gold}</span>
      </div>
      
      <p className="text-sm text-gray-400 mb-2">
        這裡充斥著來自前線的戰俘與流民。每次進入市場，待售名單都會更新。
      </p>

      <div className="flex flex-col gap-6">
        {marketSlaves.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400">市場上的奴隸已被搶購一空。</p>
          </div>
        ) : (
          marketSlaves.map((slave) => (
            <div key={slave.id} className="relative group flex flex-col gap-2">
              {/* 重複利用我們先前刻好的精美卡片 */}
              <SlaveCard slave={slave} />
              
              {/* 購買按鈕面板 */}
              <div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded-lg border border-gray-700 shadow-inner">
                <span className="text-gray-300 text-sm">
                  售價: <strong className="text-yellow-500 text-lg ml-1">{slave.price}</strong> 
                </span>
                <button 
                  onClick={() => handleBuy(slave)}
                  className={`px-4 py-2 rounded font-bold transition-colors text-sm sm:text-base ${
                    gold >= slave.price 
                      ? 'bg-blood-red hover:bg-red-700 text-white' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={gold < slave.price}
                >
                  {gold >= slave.price ? '確認購買' : '資金不足'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
