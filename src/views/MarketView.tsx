import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import { Slave } from '../types';

export default function MarketView() {
  const { gold } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  const navigate = useGameStore((state) => state.navigate);
  
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const isMarketGenerating = useGameStore((state) => state.isMarketGenerating);

  const calculatePrice = (slave: Slave) => {
    const sum = slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience;
    return Math.floor(sum * 3.5) + 150; 
  };

  const handleBuy = (slave: Slave, price: number) => {
    if (gold >= price) {
      deductGold(price);
      addSlave(slave);
      useGameStore.setState((state) => ({
        marketSlaves: state.marketSlaves.filter(s => s.id !== slave.id)
      }));
    } else {
      alert('資金不足！');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">地下奴隸市場</h2>
          <p className="text-2xs text-gray-500 mt-0.5">持有資金: <span className="text-yellow-500 font-mono font-bold">{gold}</span></p>
        </div>
        <button 
          onClick={() => navigate('Town', 'Main')}
          className="px-3 py-1 bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm"
        >
          🔙 返回城鎮
        </button>
      </div>
      
      <p className="text-xs text-gray-400">
        異域奴隸商隊會在每天早上抵達交易所。購買的血統會即刻送往據點大廳。
      </p>

      <div className="flex flex-col gap-5">
        {isMarketGenerating ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-4 shadow-lg animate-pulse">
            <div className="w-10 h-10 border-4 border-blood-red border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 text-xs font-bold">商隊正在進行血統建檔與安全檢疫...</p>
          </div>
        ) : marketSlaves.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-xs text-gray-500">今日商品已全數被本地豪強搶購一空，請等待明天早市。</p>
          </div>
        ) : (
          marketSlaves.map((slave) => {
            const price = calculatePrice(slave);
            return (
              <div key={slave.id} className="relative group flex flex-col gap-1.5">
                <SlaveCard slave={slave} />
                
                <div className="bg-gray-950 px-3 py-2 text-3xs sm:text-2xs text-gray-500 italic border-l border-gray-700 bg-gray-950/30">
                  身世描述: {slave.backgroundStory}
                </div>

                <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded border border-gray-700 shadow-inner">
                  <span className="text-gray-400 text-xs">
                    商隊報價: <strong className="text-yellow-500 font-mono text-base ml-1">{price}</strong> 
                  </span>
                  <button 
                    onClick={() => handleBuy(slave, price)}
                    className={`px-3 py-1.5 rounded font-bold transition-colors text-xs ${
                      gold >= price 
                        ? 'bg-blood-red hover:bg-red-700 text-white' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={gold < price}
                  >
                    {gold >= price ? '簽約買下' : '資金不足'}
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
