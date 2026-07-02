import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import CustomSelect, { Option } from '../components/CustomSelect';
import { ITEMS_DATA } from '../utils/gameData';

interface ConfirmModalData {
  title: string;
  action: () => void;
}

export default function InteractionView() {
  const slaves = useGameStore((state) => state.slaves);
  const { gold, roomDirtiness, actionPoints, inventory } = useGameStore((state) => state.player);
  const updateSlave = useGameStore((state) => state.updateSlave);
  const deductGold = useGameStore((state) => state.deductGold);
  const navigate = useGameStore((state) => state.navigate);
  const processTurn = useGameStore((state) => state.processTurn);
  
  // ★ 掛載道具系統
  const useItem = useGameStore((state) => state.useItem);
  const equipWeapon = useGameStore((state) => state.equipWeapon);

  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dialogue' | 'clean' | 'train' | 'inventory'>('dialogue');
  const [currentQuote, setCurrentQuote] = useState<string>('［等待傳喚中...］');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);

  const selectedSlave = slaves.find(s => s.id === selectedSlaveId);
  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');

  useEffect(() => {
    setCurrentQuote('［等待傳喚中...］');
    setSysMessage(null);
  }, [selectedSlaveId, activeTab]);

  const slaveOptions: Option[] = idleSlaves.map(s => ({
    value: s.id,
    label: `${s.name} (體力: ${s.conditionStats.stamina})`
  }));

  const handleTalk = () => {
    if (!selectedSlave) return;
    const DIALOGUES = [ '深淵的凝視未曾移開，主人。', '我會將那些敵人的骨頭磨成粉末。', '這裡的氣息……令人感到窒息卻又沉迷。', '只要您下令，我隨時準備赴死。', '生存或是毀滅，都不過是您一句話的恩賜。' ];
    setCurrentQuote(`「${DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)]}」`);
  };

  const requestTimeSkipAction = (title: string, actionFn: () => void) => {
    if (actionPoints < 1) { setSysMessage({ text: '［警告］行動力不足，無法執行耗時指令。', type: 'error' }); return; }
    setConfirmModal({ title, action: actionFn });
  };

  const confirmAndExecute = () => { if (confirmModal) { confirmModal.action(); processTurn(); setConfirmModal(null); } };

  const executeClean = () => {
    if (!selectedSlave) return;
    if (roomDirtiness === 0) { setSysMessage({ text: '［提示］目前環境已十分整潔，無需過度打掃。', type: 'error' }); return; }
    if (selectedSlave.conditionStats.stamina < 15) { setSysMessage({ text: '［警告］該成員體力不足以負擔內政勞動。', type: 'error' }); return; }

    const cleanPower = 10 + (selectedSlave.skills.housework * 8);
    const newDirtiness = Math.max(0, roomDirtiness - cleanPower);
    const newStamina = Math.max(0, selectedSlave.conditionStats.stamina - 15);

    useGameStore.setState((state) => ({ player: { ...state.player, roomDirtiness: newDirtiness } }));
    updateSlave(selectedSlave.id, { conditionStats: { ...selectedSlave.conditionStats, stamina: newStamina } });
    setSysMessage({ text: `［結算］${selectedSlave.name} 執行了環境整理。髒亂度大幅下降。`, type: 'success' });
  };

  const executeTrain = (skillType: 'combat' | 'housework' | 'survival') => {
    if (!selectedSlave) return;
    const costGold = 500; const costStamina = 40;

    if (gold < costGold) { setSysMessage({ text: '［警告］特訓需要耗費大量資源，目前資金不足。', type: 'error' }); return; }
    if (selectedSlave.conditionStats.stamina < costStamina) { setSysMessage({ text: '［警告］該成員體力透支，無法承受殘酷特訓。', type: 'error' }); return; }

    const currentLevel = selectedSlave.skills[skillType];
    if (currentLevel >= 10) { setSysMessage({ text: '［提示］該項技能已達凡人極限，無法再透過常規特訓提升。', type: 'error' }); return; }

    deductGold(costGold);
    updateSlave(selectedSlave.id, {
      skills: { ...selectedSlave.skills, [skillType]: currentLevel + 1 },
      conditionStats: { ...selectedSlave.conditionStats, stamina: selectedSlave.conditionStats.stamina - costStamina, stress: Math.min(100, selectedSlave.conditionStats.stress + 10) }
    });

    const skillName = skillType === 'combat' ? '戰鬥專精' : skillType === 'housework' ? '內政管家' : '生存本能';
    setSysMessage({ text: `［突破］殘酷特訓結束。${selectedSlave.name} 的【${skillName}】已提升至 Lv.${currentLevel + 1}。`, type: 'success' });
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">互動與管理</h2>
          <p className="text-xs text-gray-500 mt-1">凝視深淵，並將您的意志強加於他們之上。</p>
        </div>
        <button onClick={() => navigate('Home', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          ［返回大廳］
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-400 font-bold tracking-widest border-l-2 border-blood-red pl-2">［傳喚成員］</label>
        {idleSlaves.length > 0 ? <CustomSelect options={slaveOptions} value={selectedSlaveId} onChange={setSelectedSlaveId} focusColor="gray" /> : <div className="text-xs text-red-500 bg-red-950/20 p-2 border border-red-900/30 rounded">目前據點內沒有處於「閒置」狀態的成員可供傳喚。</div>}
      </div>

      {selectedSlave && (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-800">
            {[ { id: 'dialogue', label: '［深淵對話］' }, { id: 'clean', label: '［內政指派］' }, { id: 'train', label: '［殘酷特訓］' }, { id: 'inventory', label: '［道具裝備］' } ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`whitespace-nowrap px-4 py-2 text-xs font-bold transition-colors tracking-widest ${ activeTab === tab.id ? 'text-white border-b-2 border-blood-red' : 'text-gray-500 hover:text-gray-300' }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[160px]">
            {activeTab === 'dialogue' && (
              <div className="flex flex-col gap-4 h-full justify-between"><div className="text-sm text-gray-300 italic leading-relaxed bg-gray-950 p-4 rounded border border-gray-800 min-h-[80px] flex items-center justify-center text-center">{currentQuote}</div><button onClick={handleTalk} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded font-bold text-xs tracking-widest transition-colors">［要求發言］</button></div>
            )}

            {activeTab === 'clean' && (
              <div className="flex flex-col gap-4"><div className="text-xs text-gray-400 bg-gray-950 p-3 rounded border border-gray-800"><div className="flex justify-between mb-1"><span>當前據點髒亂度：</span> <span className={roomDirtiness > 50 ? 'text-yellow-500' : 'text-green-500'}>{roomDirtiness}%</span></div><div className="flex justify-between"><span>成員內政管家等級：</span> <span className="text-blue-400">Lv.{selectedSlave.skills.housework}</span></div><div className="text-yellow-600 font-bold mt-2 border-t border-gray-800 pt-2 tracking-widest">⚠️ 執行此命令將消耗 1 點行動力並推進 1 個時段。</div></div><button onClick={() => requestTimeSkipAction('下令整頓環境', executeClean)} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 rounded font-bold text-xs tracking-widest transition-colors">［下令整頓環境］</button></div>
            )}

            {activeTab === 'train' && (
              <div className="flex flex-col gap-3">
                <div className="text-xs text-yellow-600 font-bold mb-1 tracking-widest bg-gray-950 p-2 rounded border border-gray-800">⚠️ 每次特訓將消耗 1 點行動力並推進 1 個時段。<br/><span className="text-gray-500 font-normal">固定消耗資金: 500、體力: 40、壓力增加: 10</span></div>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => requestTimeSkipAction('戰鬥專精特訓', () => executeTrain('combat'))} className="flex justify-between items-center p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded transition-colors group"><span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-widest">［戰鬥專精特訓］</span><span className="text-xs text-blue-400 font-mono">目前: Lv.{selectedSlave.skills.combat}</span></button>
                  <button onClick={() => requestTimeSkipAction('內政管家特訓', () => executeTrain('housework'))} className="flex justify-between items-center p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded transition-colors group"><span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-widest">［內政管家特訓］</span><span className="text-xs text-blue-400 font-mono">目前: Lv.{selectedSlave.skills.housework}</span></button>
                  <button onClick={() => requestTimeSkipAction('生存本能特訓', () => executeTrain('survival'))} className="flex justify-between items-center p-3 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded transition-colors group"><span className="text-sm font-bold text-gray-300 group-hover:text-white tracking-widest">［生存本能特訓］</span><span className="text-xs text-blue-400 font-mono">目前: Lv.{selectedSlave.skills.survival}</span></button>
                </div>
              </div>
            )}

            {/* ★ 新增裝備與道具介面 */}
            {activeTab === 'inventory' && (
              <div className="flex flex-col gap-3 animate-fade-in">
                {selectedSlave.equipment?.weaponId && (
                   <div className="text-xs text-blue-400 font-bold bg-blue-950/30 p-2.5 rounded border border-blue-900/50 shadow-inner flex justify-between items-center tracking-widest">
                     目前武器裝備：{ITEMS_DATA[selectedSlave.equipment.weaponId]?.name}
                   </div>
                )}
                {Object.entries(inventory).length === 0 ? (
                   <div className="text-xs text-gray-500 text-center py-6">［商會庫房空無一物］</div>
                ) : (
                   Object.entries(inventory).map(([itemId, qty]) => {
                      if (qty <= 0) return null;
                      const item = ITEMS_DATA[itemId];
                      if (!item) return null;
                      return (
                         <div key={itemId} className="flex justify-between items-center bg-gray-950 p-3 border border-gray-800 rounded shadow-sm">
                            <div className="flex flex-col gap-1">
                               <span className="text-sm font-bold text-gray-200">{item.name} <span className="text-xs text-gray-500 font-mono ml-1">x{qty}</span></span>
                               <span className="text-xs text-gray-500">{item.desc}</span>
                            </div>
                            <button onClick={() => {
                               if (item.type === 'potion') { useItem(itemId, selectedSlave.id); setSysMessage({ text: `［系統］${selectedSlave.name} 消耗了 ${item.name}。`, type: 'success' }); } 
                               else { equipWeapon(itemId, selectedSlave.id); setSysMessage({ text: `［系統］${selectedSlave.name} 裝備了 ${item.name}。`, type: 'success' }); }
                            }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs font-bold text-gray-300 transition-colors tracking-widest shrink-0 shadow">
                               {item.type === 'potion' ? '［使用］' : '［裝備］'}
                            </button>
                         </div>
                      )
                   })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {sysMessage && (
        <div className={`p-3 border rounded text-xs leading-relaxed tracking-wide ${ sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 'bg-gray-900 border-red-900 text-red-500' }`}>
          {sysMessage.text}
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gray-900 border-t-2 border-blood-red rounded-lg p-5 max-w-sm w-full shadow-2xl border-x border-b border-gray-700">
            <h3 className="text-lg font-bold text-red-500 mb-2 tracking-widest flex items-center gap-2">［時光流逝警告］</h3>
            <div className="text-sm text-gray-300 leading-relaxed mb-6 bg-gray-950 p-3 rounded border border-gray-800">即將執行：<strong className="text-white">{confirmModal.title}</strong><div className="h-px bg-gray-800 my-2"></div>此行動將消耗 <strong className="text-yellow-500">1 點行動力</strong>，並推進 <strong className="text-blue-400">1 個時段</strong>。<br/><br/><span className="text-xs text-gray-500 italic">隨著時間推進，據點的環境髒亂度與外派任務的進度都會隨之變化。是否確認執行？</span></div>
            <div className="flex gap-3"><button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded border border-gray-600 transition-colors text-sm tracking-widest">［重新考慮］</button><button onClick={confirmAndExecute} className="flex-1 py-2.5 bg-blood-red/80 hover:bg-blood-red text-white font-bold rounded border border-red-900 transition-all text-sm tracking-widest shadow-lg">［確認下達］</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
