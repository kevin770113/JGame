import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import { generateSlaveIdentity } from '../services/aiService'; // 引入您剛剛建立的 AI 通訊層
import { Slave, Race } from '../types';

interface MarketSlave extends Slave {
  price: number;
}

const RACES: Race[] = ['Orc', 'Dwarf', 'Elf', 'Dragon', 'Undead', 'Human'];

const generateMarketSlave = (): MarketSlave => {
  const race = RACES[Math.floor(Math.random() * RACES.length)];
  const id = 'market-' + Math.random().toString(36).substring(2, 9);
  
  return {
    id,
    name: `未知的 ${race}`, 
    race,
    primaryStats: { 
      combat: Math.floor(Math.random() * 60) + 20, 
      endurance: Math.floor(Math.random() * 60) + 20, 
      intelligence: Math.floor(Math.random() * 60) + 20, 
      obedience: Math.floor(Math.random() * 40) + 10 
    },
    conditionStats: { stamina: 100, stress: 0, rebellion: Math.floor(Math.random() * 20) },
    traits: [],
    backgroundStory: '正在等待買家...',
    price: Math.floor(Math.random() * 800) + 200, 
  };
};

export default function MarketView() {
  const gold = useGameStore((state) => state.player.gold);
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  
  const [marketSlaves, setMarketSlaves] = useState<MarketSlave[]>([]);

  useEffect(() => {
    const initMarket = async () => {
      // 1. 先快速生成 3 個基礎商品，保證玩家秒開畫面不卡頓
      const baseSlaves = [generateMarketSlave(), generateMarketSlave(), generateMarketSlave()];
      setMarketSlaves(baseSlaves);

      // 2. 在背景非同步呼叫 AI，為這三個商品賦予有血有肉的靈魂
      const aiEnrichedSlaves = await Promise.all(
        baseSlaves.map(async (slave) => {
          const aiData = await generateSlaveIdentity(slave.race);
          return {
            ...slave,
            name: aiData.name,
            backgroundStory: aiData.story
          };
        })
      );

      // 3. 靜悄悄地把假名稱替換成 AI 生成的精緻文本
      setMarketSlaves(aiEnrichedSlaves);
    };

    initMarket();
  }, []);

  const handleBuy = (slave: MarketSlave) => {
    if (gold >= slave.price) {
      deductGold(slave.price);
      const { price, ...slaveData } = slave;
      addSlave(slaveData);
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
        每次進入市場，AI 均會自動為待售名單注入全新的名字與身世背景。
      </p>

      <div className="flex flex-col gap-6">
        {marketSlaves.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400">市場上的奴隸已被搶購一空。</p>
          </div>
        ) : (
          marketSlaves.map((slave) => (
            <div key={slave.id} className="relative group flex flex-col gap-2">
              <SlaveCard slave={slave} />
              
              {/* 新增身世背景簡介區塊，提升劇情感 */}
              <div className="bg-gray-850 px-4 py-2 text-xs text-gray-400 italic border-l-2 border-gray-600 bg-gray-800/30">
                背景: {slave.backgroundStory}
              </div>

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
