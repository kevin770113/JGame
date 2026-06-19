import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import { Slave } from '../types';

export default function MarketView() {
  const { gold } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  
  // 直接從大腦讀取市場名單與載入狀態
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const isMarketGenerating = useGameStore((state) => state.isMarketGenerating);

  // 動態計算奴隸售價 (依據能力值總和)
  const calculatePrice = (slave: Slave) => {
    const sum = slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience;
    return Math.floor(sum * 3.5) + 150; 
  };

  const handleBuy = (slave: Slave, price: number) => {
    if (gold >= price) {
      deductGold(price);
      addSlave(slave);
      // 從大腦的市場陣列中移除該商品
      useGameStore.setState((state) => ({
        marketSlaves: state.marketSlaves.filter(s => s.id !== slave.id)
      }));
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
        商隊會在每天早上帶來新的貨源。購買的成員會立刻加入您的基地排程。
      </p>

      <div className="flex flex-col gap-6">
        {/* 過場等待畫面 */}
        {isMarketGenerating ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-4 shadow-lg animate-pulse">
            <div className="w-12 h-12 border-4 border-blood-red border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 font-bold">奴隸商隊正在前往據點的路上...</p>
            <p className="text-sm text-gray-500">AI 正在為商品進行血統認證與建檔</p>
          </div>
        ) : marketSlaves.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400">市場上的奴隸已被搶購一空，請等待明天早市開張。</p>
          </div>
        ) : (
          marketSlaves.map((slave) => {
            const price = calculatePrice(slave);
            return (
              <div key={slave.id} className="relative group flex flex-col gap-2">
                <SlaveCard slave={slave} />
                
                <div className="bg-gray-850 px-4 py-2 text-xs text-gray-400 italic border-l-2 border-gray-600 bg-gray-800/30">
                  背景: {slave.backgroundStory}
                </div>

                <div className="flex justify-between items-center bg-gray-900 px-4 py-3 rounded-lg border border-gray-700 shadow-inner">
                  <span className="text-gray-300 text-sm">
                    售價: <strong className="text-yellow-500 text-lg ml-1">{price}</strong> 
                  </span>
                  <button 
                    onClick={() => handleBuy(slave, price)}
                    className={`px-4 py-2 rounded font-bold transition-colors text-sm sm:text-base ${
                      gold >= price 
                        ? 'bg-blood-red hover:bg-red-700 text-white' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={gold < price}
                  >
                    {gold >= price ? '確認購買' : '資金不足'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
