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
      alert('［警告］持有的資金不足以支付這筆交易。');
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
          className="px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest"
        >
          ［返回城鎮］
        </button>
      </div>
      
      <p className="text-xs text-gray-400">
        異域商隊會在破曉時分抵達此處。一旦簽署血契，該名成員將即刻受您支配。
      </p>

      <div className="flex flex-col gap-5 mt-2">
        {isMarketGenerating ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center flex flex-col items-center justify-center gap-4 shadow-lg animate-pulse">
            <div className="w-10 h-10 border-4 border-blood-red border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-300 text-xs font-bold tracking-widest">［商隊正在進行血統建檔與安全檢疫...］</p>
          </div>
        ) : marketSlaves.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-xs text-gray-500 tracking-wider">［今日的貨源已被搶購一空，請等待明日破曉。］</p>
          </div>
        ) : (
          marketSlaves.map((slave) => {
            const price = calculatePrice(slave);
            return (
              <div key={slave.id} className="relative group flex flex-col gap-1.5">
                <SlaveCard slave={slave} />
                
                <div className="bg-gray-950 px-3 py-2 text-3xs sm:text-2xs text-gray-500 italic border-l border-gray-700 bg-gray-950/30 leading-relaxed">
                  檔案紀錄: {slave.backgroundStory}
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
    </div>
  );
}
