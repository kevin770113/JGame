import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import CustomSelect from '../components/CustomSelect';
import { parseLocalizedName } from '../utils/i18nUtils';

export default function TownMainView() {
  const { t } = useTranslation();
  const activeEvent = useGameStore((state) => state.activeEvent);
  const fulfillEvent = useGameStore((state) => state.fulfillEvent);
  const slaves = useGameStore((state) => state.slaves);
  const setGlobalModal = useGameStore((state) => state.setGlobalModal);
  const triggerQuest = useGameStore((state) => state.triggerQuest);

  const [eventSlaveId, setEventSlaveId] = useState<string>('');
  const [selectedNpc, setSelectedNpc] = useState<'merchant' | 'event' | null>(null);
  const [merchantQuote, setMerchantQuote] = useState(t('town.quote_default', '「新鮮的血肉，還是冰冷的鋼鐵？只要你出得起價錢，地下商隊隨時為你敞開大門。」'));

  useEffect(() => {
    triggerQuest('q_first_blood');
  }, [triggerQuest]);

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  const handleMerchantTalk = () => {
    const quotes = [
      t('town.quote_1', '「新鮮的血肉，還是冰冷的鋼鐵？只要你出得起價錢，地下商隊隨時為你敞開大門。」'),
      t('town.quote_2', '「嘿嘿……聽說最近前線的耗損很大？我這裡剛進了一批『耐用』的貨色。」'),
      t('town.quote_3', '「不要盯著我的面具看，這會惹來不必要的殺身之禍。」'),
      t('town.quote_4', '「金幣的聲音，是這深淵裡唯一美妙的樂章。」'),
      t('town.quote_5', '「真正的交易不在街上進行，市集裡才有你想要的東西。」')
    ];
    setMerchantQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-10 animate-fade-in relative z-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-300">{t('town.title', '城鎮街道')}</h2>
          <p className="text-2xs text-gray-500 mt-0.5">{t('town.desc', '龍蛇雜處的灰色地帶，各路人馬在此匯聚。')}</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-none py-2 px-1 shrink-0">
        <div onClick={() => setSelectedNpc('merchant')} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
          <div className={`w-16 sm:w-18 aspect-square rounded-md border-2 ${selectedNpc === 'merchant' ? 'border-purple-500' : 'border-gray-600'} bg-gray-900 flex items-center justify-center shadow-lg group-hover:border-purple-400 transition-colors relative overflow-hidden`}>
             <span className="text-sm font-bold text-gray-400 group-hover:text-gray-200 tracking-widest">{t('town.npc_merchant_short', '黑商')}</span>
             <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-50"></div>
          </div>
          <span className="text-3xs text-gray-400 font-bold bg-gray-950 px-2 py-0.5 rounded border border-gray-800 tracking-widest group-hover:text-gray-200">{t('town.npc_merchant', '神祕黑商')}</span>
        </div>

        {activeEvent && (
          <div onClick={() => setSelectedNpc('event')} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group relative">
            <div className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 bg-red-600 border border-red-800 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]">
               <span className="text-white text-xs font-black">!</span>
            </div>
            <div className={`w-16 sm:w-18 aspect-square rounded-md border-2 ${selectedNpc === 'event' ? 'border-yellow-400' : 'border-yellow-600/50'} bg-gray-900 flex items-center justify-center shadow-lg group-hover:border-yellow-400 transition-colors relative overflow-hidden`}>
               <span className="text-sm font-bold text-yellow-600 group-hover:text-yellow-400 tracking-widest">{activeEvent.type === 'noble' ? t('town.npc_noble_short', '權貴') : t('town.npc_thug_short', '地痞')}</span>
               <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-50"></div>
            </div>
            <span className="text-3xs text-yellow-500 font-bold bg-yellow-950 px-2 py-0.5 rounded border border-yellow-900/50 tracking-widest group-hover:text-yellow-300">
               {activeEvent.type === 'noble' ? t('town.npc_noble', '血族伯爵') : t('town.npc_thug', '地頭蛇')}
            </span>
          </div>
        )}
      </div>

      {selectedNpc === 'merchant' && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 animate-fade-in shadow-xl relative">
           <div className="absolute top-0 left-4 -translate-y-full w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-gray-700"></div>
           <h3 className="text-sm font-bold text-gray-300 mb-2 border-b border-gray-800 pb-2 tracking-widest">{t('town.npc_merchant', '神祕黑商')}</h3>
           <div className="text-xs text-gray-300 italic text-center py-4 px-2 bg-gray-950/60 rounded border border-gray-800 min-h-[60px] flex items-center justify-center mb-4">
             {merchantQuote}
           </div>
           <button onClick={handleMerchantTalk} className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-bold rounded text-xs transition-colors tracking-widest shadow">
             {t('town.btn_talk', '［搭話］')}
           </button>
        </div>
      )}

      {selectedNpc === 'event' && activeEvent && (
        <div className="bg-yellow-950/40 border border-yellow-800 rounded-xl p-4 animate-fade-in shadow-xl relative">
           <div className="absolute top-0 left-[5.5rem] sm:left-[6rem] -translate-y-full w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-yellow-800"></div>
           <h3 className="text-sm font-bold text-yellow-500 mb-2 tracking-widest flex items-center gap-2 border-b border-yellow-900/50 pb-2">
             {t('town.event_title', '［突發懸賞］')}
           </h3>
           <p className="text-xs text-gray-300 leading-relaxed mb-4">{activeEvent.desc}</p>
           <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-3xs text-yellow-600 font-bold">{t('town.event_assign', '請指派符合條件的成員：')}</label>
                <CustomSelect options={idleSlaves.map(s => ({ value: s.id, label: parseLocalizedName(s.name) }))} value={eventSlaveId} onChange={setEventSlaveId} focusColor="yellow" />
              </div>
              <button onClick={() => {
                 if (!eventSlaveId) return;
                 if (fulfillEvent(eventSlaveId)) { 
                   setGlobalModal({ title: t('town.event_success_title', '［交易完成］'), message: t('town.event_success_msg', '已滿足要求，成功獲取高額報酬！'), isConfirm: false });
                   setEventSlaveId('');
                   setSelectedNpc(null);
                 } else {
                   setGlobalModal({ title: t('town.event_fail_title', '［拒絕交易］'), message: t('town.event_fail_msg', '該名成員的素質不符合權貴的嚴苛要求！'), isConfirm: false });
                 }
              }} className="w-full py-3 bg-yellow-900/50 hover:bg-yellow-800 border border-yellow-700 text-yellow-400 font-bold rounded text-xs transition-colors tracking-widest shadow mt-2">
                 {t('town.btn_fulfill', '［交付此交易］')}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
