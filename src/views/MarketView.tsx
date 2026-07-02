import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';
import CustomSelect from '../components/CustomSelect';
import { Slave } from '../types';
import { ITEMS_DATA } from '../utils/gameData';

export default function MarketView() {
  const { gold, maxSlaveCapacity, location, shopStock } = useGameStore((state) => state.player); // ★ 讀取商店庫存
  const deductGold = useGameStore((state) => state.deductGold);
  const addSlave = useGameStore((state) => state.addSlave);
  const sellSlave = useGameStore((state) => state.sellSlave);
  const navigate = useGameStore((state) => state.navigate);
  
  const marketSlaves = useGameStore((state) => state.marketSlaves);
  const slaves = useGameStore((state) => state.slaves);
  const isMarketGenerating = useGameStore((state) => state.isMarketGenerating);

  const buyItem = useGameStore((state) => state.buyItem);
  const activeEvent = useGameStore((state) => state.activeEvent);
  const fulfillEvent = useGameStore((state) => state.fulfillEvent);
  const triggerQuest = useGameStore((state) => state.triggerQuest);
  
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);

  // ★ 移除 arena 頁籤
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'shop'>('buy');
  const [eventSlaveId, setEventSlaveId] = useState<string>('');

  useEffect(() => {
    triggerQuest('q_first_blood');
  }, [triggerQuest]);

  const isFull = slaves.length >= maxSlaveCapacity;
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  const calculateBuyPrice = (slave: Slave) => 150 + Math.floor((slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience) * 3.5) + ((slave.skills?.combat || 1) + (slave.skills?.housework || 1) + (slave.skills?.survival || 1)) * 150;
  const calculateSellPrice = (slave: Slave) => 50 + Math.floor((slave.primaryStats.combat + slave.primaryStats.endurance + slave.primaryStats.intelligence + slave.primaryStats.obedience) * 1.5) + ((slave.skills?.combat || 1) + (slave.skills?.housework || 1) + (slave.skills?.survival || 1)) * 200;

  const handleBuy = (slave: Slave, price: number) => {
    if (isFull) { setGlobalModal({ title: '［系統警告］', message: '據點已達人口上限，無法容納新的血脈。', isConfirm: false }); return; }
    if (gold >= price) { deductGold(price); addSlave(slave); useGameStore.setState((state) => ({ marketSlaves: state.marketSlaves.filter(s => s.id !== slave.id) })); } 
    else { setGlobalModal({ title: '［系統警告］', message: '持有的資金不足以支付商隊報價。', isConfirm: false }); }
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
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">地下奴隸市場</h2>
          <p className="text-2xs text-gray-500 mt-0.5">持有資金: <span className="text-yellow-500 font-mono font-bold">{gold}</span></p>
        </div>
        <button onClick={() => navigate('Town', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          ［返回城鎮］
        </button>
      </div>

      {activeEvent && (
        <div className="bg-yellow-950/40 border border-yellow-800 rounded p-3 mb-2 animate-fade-in shadow-lg">
           <h3 className="text-sm font-bold text-yellow-500 mb-1 tracking-widest flex items-center gap-2">
             <span>⚠️</span> ［突發懸賞］
           </h3>
           <p className="text-xs text-gray-300 leading-relaxed mb-3">{activeEvent.desc}</p>
           <div className="flex gap-2">
              <div className="flex-1">
                 <CustomSelect options={idleSlaves.map(s => ({ value: s.id, label: s.name }))} value={eventSlaveId} onChange={setEventSlaveId} focusColor="yellow" />
              </div>
              <button onClick={() => {
                 if (!eventSlaveId) return;
                 if (fulfillEvent(eventSlaveId)) { 
                   setGlobalModal({ title: '［交易完成］', message: '已滿足權貴要求，成功獲取高額報酬！', isConfirm: false }); 
                   setEventSlaveId(''); 
                 } else {
                   setGlobalModal({ title: '［拒絕交易］', message: '該名成員的素質不符合權貴的嚴苛要求！', isConfirm: false });
                 }
              }} className="px-4 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-700 text-yellow-400 font-bold rounded text-xs transition-colors shrink-0 tracking-widest shadow">
                 ［交付交易］
              </button>
           </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-800 pb-1 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 text-xs font-bold transition-colors tracking-widest whitespace-nowrap ${ activeTab === tab.id ? `text-white border-b-2 ${tab.color}` : 'text-gray-500 hover:text-gray-300' }`}>
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
                  <div className="bg-gray-950 px-3 py-2 text-2xs text-gray-500 italic border-l border-gray-800 leading-relaxed">［檔案紀錄］{slave.backgroundStory}</div>
                  <div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 rounded border border-gray-700"><span className="text-gray-400 text-xs font-bold">商隊報價: <strong className="text-yellow-500 text-base ml-2">{price}</strong></span><button onClick={() => handleBuy(slave, price)} className={`px-4 py-2 rounded font-bold text-xs ${isFull ? 'bg-gray-800 text-gray-600 border-gray-700' : gold >= price ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500' : 'bg-gray-900 text-gray-700 border-gray-800'}`} disabled={isFull || gold < price}>{isFull ? '［據點已滿］' : gold >= price ? '［簽署血契］' : '［資金不足］'}</button></div>
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
              <div key={slave.id} className="relative group flex flex-col gap-1.5 animate-slide-up"><SlaveCard slave={slave} /><div className="flex justify-between items-center bg-gray-900 px-4 py-2.5 rounded border border-gray-700"><span className="text-gray-400 text-xs font-bold">黑市估值: <strong className="text-yellow-500 text-base ml-2">{price}</strong></span><button onClick={() => handleSell(slave, price)} className="px-4 py-2 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded font-bold text-xs">［拋售資產］</button></div></div>
            );
          })}
        </div>
      )}

      {/* ★ 道具黑市加入庫存 UI 顯示與控管 */}
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
                   }} disabled={isSoldOut} className={`px-4 py-2 rounded font-bold text-xs shrink-0 tracking-widest shadow transition-colors ${isSoldOut ? 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700'}`}>
                     {!isSoldOut && <span className="text-yellow-600 font-mono mr-1">${item.price}</span>}
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
