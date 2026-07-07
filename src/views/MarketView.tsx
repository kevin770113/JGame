import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import { Slave } from '../types';
import { ITEMS_DATA } from '../utils/gameData';

export default function MarketView() {
  const { gold, maxSlaveCapacity, location, shopStock } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  const sellSlave = useGameStore((state) => state.sellSlave);
  
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const slaves = useGameStore((state) => state.slaves);
  const isMarketGenerating = useGameStore((state) => state.isMarketGenerating);

  const buyItem = useGameStore((state) => state.buyItem);
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);

  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'shop'>('buy');

  const isFull = slaves.length >= maxSlaveCapacity;
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  const calculateBuyPrice = (slave: Slave) => 150 + Math.floor((slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience) * 3.5) + ((slave.skills?.combat || 1) + (slave.skills?.housework || 1) + (slave.skills?.survival || 1)) * 150;
  const calculateSellPrice = (slave: Slave) => 50 + Math.floor((slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience) * 1.5) + ((slave.skills?.combat || 1) + (slave.skills?.housework || 1) + (slave.skills?.survival || 1)) * 200;

  const handleBuy = (slave: Slave, price: number) => {
    if (isFull) { setGlobalModal({ title: '［系統警告］', message: '據點已達人口上限，無法容納新的血脈。', isConfirm: false }); return; }
    if (gold >= price) { 
      deductGold(price); 
      addSlave(slave);
      useGameStore.setState((state) => ({ marketSlaves: state.marketSlaves.filter(s => s.id !== slave.id) }));
    } else { 
      setGlobalModal({ title: '［系統警告］', message: '持有的資金不足以支付商隊報價。', isConfirm: false }); 
    }
  };

  const handleSell = (slave: Slave, price: number) => { 
    setGlobalModal({
      title: '［黑市交易確認］',
      message: `是否確定將代號【${slave.name}】拋售至黑市？\n此舉將為您換取 ${price} 資金，但成員將永遠消失。`,
      isConfirm: true,
      action: () => sellSlave(slave.id)
    });
  };

  const tabs = [
    { id: 'buy', label: '［商隊進貨］', color: 'border-blood-red' },
    { id: 'sell', label: '［黑市變現］', color: 'border-blue-500' }
  ];

  if (location !== 'Frontlines') {
    tabs.push({ id: 'shop', label: '［道具黑市］', color: 'border-purple-500' });
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative z-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-300">地下市集</h2>
          <p className="text-2xs text-gray-500 mt-0.5">持有資金: <span className="text-yellow-500 font-mono font-bold">${gold}</span></p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-800 pb-1 overflow-x-auto scrollbar-none shrink-0">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 text-xs font-bold transition-colors tracking-widest whitespace-nowrap ${ activeTab === tab.id ? `text-white border-b-2 ${tab.color} bg-gray-800/50` : 'text-gray-500 hover:text-gray-300' }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'buy' && (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-gray-400 italic border-l-2 border-blood-red pl-2">「未經訓練的原生屬性索取極高溢價。」</p>
          {isMarketGenerating ? (
            <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-8 text-center flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-blood-red border-t-transparent rounded-full animate-spin"></div><p className="text-gray-300 text-xs font-bold">［商隊正在進行血統建檔...］</p></div>
          ) : marketSlaves.length === 0 ? (
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center"><p className="text-xs text-gray-500">［今日貨源已空。］</p></div>
          ) : (
            marketSlaves.map((slave) => {
              const price = calculateBuyPrice(slave);
              return (
                <div key={slave.id} className="relative group flex flex-col gap-1.5 animate-slide-up">
                  <SlaveCard slave={slave} />
                  <div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 rounded border border-gray-700">
                    <span className="text-gray-400 text-xs font-bold">商隊報價: <strong className="text-yellow-500 text-base ml-2">${price}</strong></span>
                    <button onClick={() => handleBuy(slave, price)} className={`px-4 py-2 rounded font-bold text-xs tracking-widest cursor-pointer shadow-sm ${isFull ? 'bg-gray-800 text-gray-600 border-gray-700' : gold >= price ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500' : 'bg-gray-900 text-gray-700 border-gray-800'}`} disabled={isFull || gold < price}>
                      {isFull ? '［據點已滿］' : gold >= price ? '［簽署血契］' : '［資金不足］'}
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
          <p className="text-xs text-gray-400 italic border-l-2 border-blue-500 pl-2">「將閒置成員拋售至黑市變現。」</p>
          {idleSlaves.length === 0 ? <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center"><p className="text-xs text-gray-500">［目前沒有閒置成員。］</p></div> : idleSlaves.map((slave) => {
            const price = calculateSellPrice(slave);
            return (
              <div key={slave.id} className="relative group flex flex-col gap-1.5 animate-slide-up"><SlaveCard slave={slave} /><div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 rounded border border-gray-700"><span className="text-gray-400 text-xs font-bold">黑市估值: <strong className="text-yellow-500 text-base ml-2">${price}</strong></span><button onClick={() => handleSell(slave, price)} className="px-4 py-2 bg-blue-900/20 text-blue-400 border border-blue-900/50 hover:bg-blue-900/40 rounded font-bold text-xs cursor-pointer tracking-widest transition-colors shadow-sm">［拋售資產］</button></div></div>
            );
          })}
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <p className="text-xs text-gray-400 italic border-l-2 border-purple-500 pl-2">「這裡流通著帝國明令禁止的特種物資與軍械。」</p>
          <div className="flex flex-col gap-3">
            {Object.entries(ITEMS_DATA).map(([id, item]) => {
              const currentStock = shopStock[id] || 0;
              const isSoldOut = currentStock <= 0;
              
              return (
                <div key={id} className={`bg-gray-950 border p-3 rounded flex justify-between items-center shadow-inner ${isSoldOut ? 'border-gray-800 opacity-60' : 'border-purple-900/30'}`}>
                   <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-bold text-gray-200">
                        {item.name} 
                        <span className={`text-xs font-mono ml-2 ${isSoldOut ? 'text-red-500' : 'text-purple-400'}`}>(剩餘: {currentStock})</span>
                      </h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                   </div>
                   <button onClick={() => {
                      if (isSoldOut) return;
                      if (gold >= item.price) { 
                        buyItem(id);
                        setGlobalModal({ title: '［購入成功］', message: `已成功引進 ${item.name} 入庫。`, isConfirm: false });
                      } else {
                        setGlobalModal({ title: '［系統警告］', message: '持有的資金不足。', isConfirm: false });
                      }
                   }} disabled={isSoldOut} className={`px-4 py-2.5 rounded font-bold text-xs shrink-0 tracking-widest shadow transition-colors ${isSoldOut ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 cursor-pointer'}`}>
                     {!isSoldOut && <span className="text-yellow-600 font-mono mr-1.5">${item.price}</span>}
                     {isSoldOut ? '［明日補貨］' : '［購買］'}
                   </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
