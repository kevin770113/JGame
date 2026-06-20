import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import { Slave } from '../types';

export default function MarketView() {
  const { gold } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  const sellSlave = useGameStore((state) => state.sellSlave);
  const navigate = useGameStore((state) => state.navigate);
  
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const slaves = useGameStore((state) => state.slaves);
  const isMarketGenerating = useGameStore((state) => state.isMarketGenerating);

  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // ［買入］商隊報價公式：基礎 150 + 屬性*3.5 + 技能*150 (溢價極高)
  const calculateBuyPrice = (slave: Slave) => {
    const statsSum = slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience;
    const skillsSum = (slave.skills?.combat || 1) + (slave.skills?.housework || 1) + (slave.skills?.survival || 1);
    return 150 + Math.floor(statsSum * 3.5) + (skillsSum * 150); 
  };

  // ［賣出］黑市回收公式：基礎 50 + 屬性*1.5 + 技能*200 (屬性血虧，技能暴利)
  const calculateSellPrice = (slave: Slave) => {
    const statsSum = slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience;
    const skillsSum = (slave.skills?.combat || 1) + (slave.skills?.housework || 1) + (slave.skills?.survival || 1);
    return 50 + Math.floor(statsSum * 1.5) + (skillsSum * 200);
  };

  const handleBuy = (slave: Slave, price: number) => {
    if (gold >= price) {
      deductGold(price);
      addSlave(slave);
      useGameStore.setState((state) => ({
        marketSlaves: state.marketSlaves.filter(s => s.id !== slave.id)
      }));
    } else {
      alert('［警告］持有的資金不足以支付這筆交易。');
    }
  };

  const handleSell = (slave: Slave, price: number) => {
    if (confirm(`［確認］是否確定以 ${price} 資金將 ${slave.name} 永遠拋售至黑市？此動作無法復原。`)) {
      sellSlave(slave.id);
    }
  };

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">地下奴隸市場</h2>
          <p className="text-2xs text-gray-500 mt-0.5">持有資金: <span className="text-yellow-500 font-mono font-bold">{gold}</span></p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回城鎮］
        </button>
      </div>

      {/* 雙向交易分頁切換 */}
      <div className="flex gap-2 border-b border-gray-800 pb-1">
        <button
          onClick={() => setActiveTab('buy')}
          className={`px-4 py-2 text-xs font-bold transition-colors tracking-widest ${
            activeTab === 'buy' ? 'text-white border-b-2 border-blood-red' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          ［商隊進貨］
        </button>
        <button
          onClick={() => setActiveTab('sell')}
          className={`px-4 py-2 text-xs font-bold transition-colors tracking-widest ${
            activeTab === 'sell' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          ［黑市變現］
        </button>
      </div>

      {activeTab === 'buy' && (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-gray-400 italic border-l-2 border-blood-red pl-2 leading-relaxed">
            「來自異域的活體資產。商隊對未經訓練的原生屬性索取極高的溢價，若不自行栽培極難回本。」
          </p>

          {isMarketGenerating ? (
            <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-4 shadow-lg animate-pulse">
              <div className="w-10 h-10 border-4 border-blood-red border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-300 text-xs font-bold tracking-widest">［商隊正在進行血統建檔與安全檢疫...］</p>
            </div>
          ) : marketSlaves.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center">
              <p className="text-xs text-gray-500 tracking-wider">［今日的貨源已被搶購一空，請等待明日破曉。］</p>
            </div>
          ) : (
            marketSlaves.map((slave) => {
              const price = calculateBuyPrice(slave);
              return (
                <div key={slave.id} className="relative group flex flex-col gap-1.5 animate-slide-up">
                  <SlaveCard slave={slave} />
                  <div className="bg-gray-950 px-3 py-2 text-3xs sm:text-2xs text-gray-500 italic border-l border-gray-800 bg-gray-950/40 leading-relaxed">
                    ［檔案紀錄］{slave.backgroundStory}
                  </div>
                  <div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 rounded border border-gray-700 shadow-inner">
                    <span className="text-gray-400 text-xs font-bold tracking-widest">
                      商隊報價: <strong className="text-yellow-500 font-mono text-base ml-2">{price}</strong> 
                    </span>
                    <button 
                      onClick={() => handleBuy(slave, price)}
                      className={`px-4 py-2 rounded font-bold transition-colors text-xs tracking-widest ${
                        gold >= price 
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-500 hover:border-gray-400' 
                          : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed'
                      }`}
                      disabled={gold < price}
                    >
                      {gold >= price ? '［簽署血契］' : '［資金不足］'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'sell' && (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-gray-400 italic border-l-2 border-blue-500 pl-2 leading-relaxed">
            「將閒置的成員拋售給地下黑市。基礎屬性將面臨極其嚴苛的折價，唯有高階技能能賣出暴利。」
          </p>

          {idleSlaves.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center mt-2">
              <p className="text-xs text-gray-500 tracking-wider">［目前沒有處於閒置狀態的成員可供拋售。］</p>
            </div>
          ) : (
            idleSlaves.map((slave) => {
              const price = calculateSellPrice(slave);
              return (
                <div key={slave.id} className="relative group flex flex-col gap-1.5 animate-slide-up">
                  <SlaveCard slave={slave} />
                  <div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 rounded border border-gray-700 shadow-inner mt-1">
                    <span className="text-gray-400 text-xs font-bold tracking-widest">
                      黑市估值: <strong className="text-yellow-500 font-mono text-base ml-2">{price}</strong> 
                    </span>
                    <button 
                      onClick={() => handleSell(slave, price)}
                      className="px-4 py-2 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-900/50 hover:border-blue-700 rounded font-bold transition-colors text-xs tracking-widest"
                    >
                      ［拋售資產］
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
