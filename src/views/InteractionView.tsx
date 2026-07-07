import { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ITEMS_DATA } from '../utils/gameData';
import { Slave } from '../types';

interface ConfirmModalData {
  title: string;
  action: () => void;
}

type TaskType = 'none' | 'dialogue' | 'clean' | 'train' | 'inventory' | 'role';

export default function InteractionView() {
  const slaves = useGameStore((state) => state.slaves);
  const { gold, roomDirtiness, actionPoints, inventory } = useGameStore((state) => state.player);
  const updateSlave = useGameStore((state) => state.updateSlave);
  const deductGold = useGameStore((state) => state.deductGold);
  const navigate = useGameStore((state) => state.navigate);
  const processTurn = useGameStore((state) => state.processTurn);
  
  const useItem = useGameStore((state) => state.useItem);
  const equipWeapon = useGameStore((state) => state.equipWeapon);
  const unequipWeapon = useGameStore((state) => state.unequipWeapon);
  const appointRole = useGameStore((state) => state.appointRole);

  const [currentTask, setCurrentTask] = useState<TaskType>('none');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const [currentQuote, setCurrentQuote] = useState<string>('［等待傳喚中...］');
  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);

  const idleSlaves = slaves.filter(s => s.activityStatus === '閒置');
  const activeSlave = idleSlaves[carouselIndex];
  
  const isFainted = activeSlave ? (activeSlave.faintTurns || 0) > 0 : false;

  useEffect(() => {
    setSysMessage(null);
    if (currentTask === 'dialogue') {
      setCurrentQuote('［等待傳喚中...］');
    }
  }, [carouselIndex, currentTask]);

  const handleTalk = () => {
    if (!activeSlave) return;
    const DIALOGUES = [
      '深淵的凝視未曾移開，主人。',
      '我會將那些敵人的骨頭磨成粉末。',
      '這裡的氣息……令人感到窒息卻又沉迷。',
      '只要您下令，我隨時準備赴死。',
      '生存或是毀滅，都不過是您一句話的恩賜。'
    ];
    setCurrentQuote(`「${DIALOGUES[Math.floor(Math.random() * DIALOGUES.length)]}」`);
  };

  const requestTimeSkipAction = (title: string, actionFn: () => void) => {
    if (actionPoints < 1) {
      setSysMessage({ text: '［警告］行動力不足，無法執行耗時指令。', type: 'error' });
      return;
    }
    setConfirmModal({ title, action: actionFn });
  };

  const confirmAndExecute = () => {
    if (confirmModal) {
      confirmModal.action();
      processTurn();
      setConfirmModal(null);
    }
  };

  const executeClean = () => {
    if (!activeSlave) return;
    if (roomDirtiness === 0) {
      setSysMessage({ text: '［提示］目前環境已十分整潔，無需過度打掃。', type: 'error' });
      return;
    }
    if (activeSlave.conditionStats.stamina < 15) {
      setSysMessage({ text: '［警告］該成員體力不足以負擔內政勞動。', type: 'error' });
      return;
    }

    const effectiveHousework = activeSlave.isInjured 
      ? Math.floor((activeSlave.skills.housework || 1) * 0.5) 
      : activeSlave.skills.housework;
    const cleanPower = 10 + (effectiveHousework * 8);
    const newDirtiness = Math.max(0, roomDirtiness - cleanPower);
    const newStamina = Math.max(0, activeSlave.conditionStats.stamina - 15);

    let updates: Partial<Slave> = {
      conditionStats: { ...activeSlave.conditionStats, stamina: newStamina }
    };
    let msg = `［結算］${activeSlave.name} 執行了環境整理。髒亂度大幅下降。`;
    let msgType: 'success' | 'error' = 'success';

    if (newStamina <= 0) {
      updates.faintTurns = 5;
      updates.primaryStats = { ...activeSlave.primaryStats, obedience: Math.max(0, activeSlave.primaryStats.obedience - 5) };
      updates.conditionStats!.stress = Math.min(100, activeSlave.conditionStats.stress + 15);
      msg = `［嚴重警告］${activeSlave.name} 執行打掃後體力徹底透支，當場倒地陷入昏厥！`;
      msgType = 'error';
    }

    useGameStore.setState((state) => ({ player: { ...state.player, roomDirtiness: newDirtiness } }));
    updateSlave(activeSlave.id, updates);
    setSysMessage({ text: msg, type: msgType });
  };

  const executeTrain = (skillType: 'combat' | 'housework' | 'survival') => {
    if (!activeSlave) return;
    const costGold = 500;
    const costStamina = 40;

    if (gold < costGold) {
      setSysMessage({ text: '［警告］特訓需要耗費大量資源，目前資金不足。', type: 'error' });
      return;
    }
    if (activeSlave.conditionStats.stamina < costStamina) {
      setSysMessage({ text: '［警告］該成員體力透支，無法承受殘酷特訓。', type: 'error' });
      return;
    }

    const currentLevel = activeSlave.skills[skillType];
    if (currentLevel >= 10) {
      setSysMessage({ text: '［提示］該項技能已達凡人極限，無法再透過常規特訓提升。', type: 'error' });
      return;
    }

    deductGold(costGold);
    const newStamina = Math.max(0, activeSlave.conditionStats.stamina - costStamina);
    const newStress = Math.min(100, activeSlave.conditionStats.stress + 10);
    let updates: Partial<Slave> = {
      skills: { ...activeSlave.skills, [skillType]: currentLevel + 1 },
      conditionStats: { ...activeSlave.conditionStats, stamina: newStamina, stress: newStress }
    };

    const skillName = skillType === 'combat' ? '戰鬥專精' : skillType === 'housework' ? '內政管家' : '生存本能';
    let msg = `［突破］殘酷特訓結束。${activeSlave.name} 的【${skillName}】已提升至 Lv.${currentLevel + 1}。`;
    let msgType: 'success' | 'error' = 'success';

    if (newStamina <= 0) {
      updates.faintTurns = 5;
      updates.primaryStats = { ...activeSlave.primaryStats, obedience: Math.max(0, activeSlave.primaryStats.obedience - 5) };
      updates.conditionStats!.stress = Math.min(100, newStress + 15);
      msg = `［嚴重警告］殘酷特訓使 ${activeSlave.name} 體力徹底透支，當場倒地陷入昏厥！【${skillName}】提升至 Lv.${currentLevel + 1}。`;
      msgType = 'error';
    }

    updateSlave(activeSlave.id, updates);
    setSysMessage({ text: msg, type: msgType });
  };

  const prevCarousel = () => {
    setCarouselIndex(prev => (prev === 0 ? idleSlaves.length - 1 : prev - 1));
  };

  const nextCarousel = () => {
    setCarouselIndex(prev => (prev === idleSlaves.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative font-mono z-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-300">互動與管理中心</h2>
          <p className="text-xs text-gray-500 mt-1">
            {currentTask === 'none' ? '請先選擇欲下達的商會命令類型。' : '滑動挑選執行命令的試驗體。'}
          </p>
        </div>
        <button 
          onClick={() => {
            if (currentTask !== 'none') {
              setCurrentTask('none');
              setSelectedItemId('');
            } else {
              navigate('Home', 'Main');
            }
          }} 
          className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest relative z-30"
        >
          {currentTask !== 'none' ? '［重選指令］' : '［返回大廳］'}
        </button>
      </div>

      {currentTask === 'none' && (
        <div className="grid grid-cols-1 gap-3 mt-2 animate-fade-in w-full max-w-md mx-auto relative z-20">
          <button onClick={() => setCurrentTask('dialogue')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-left px-5 flex justify-between items-center group transition-all shadow-md active:scale-98">
            <span className="text-gray-300 group-hover:text-white font-bold tracking-widest text-sm">［深淵對話］</span>
            <span className="text-3xs text-gray-500 font-normal">探聽精神思緒狀態</span>
          </button>
          <button onClick={() => setCurrentTask('clean')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-left px-5 flex justify-between items-center group transition-all shadow-md active:scale-98">
            <span className="text-gray-300 group-hover:text-white font-bold tracking-widest text-sm">［內政指派］</span>
            <span className="text-3xs text-gray-500 font-normal">手動進行大廳環境整頓</span>
          </button>
          <button onClick={() => setCurrentTask('train')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-left px-5 flex justify-between items-center group transition-all shadow-md active:scale-98">
            <span className="text-gray-300 group-hover:text-white font-bold tracking-widest text-sm">［殘酷特訓］</span>
            <span className="text-3xs text-gray-500 font-normal">消耗資金永久突破技能層級</span>
          </button>
          <button onClick={() => setCurrentTask('inventory')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-left px-5 flex justify-between items-center group transition-all shadow-md active:scale-98">
            <span className="text-gray-300 group-hover:text-white font-bold tracking-widest text-sm">［道具裝備］</span>
            <span className="text-3xs text-gray-500 font-normal">賞賜魔藥恢復或更替兵刃</span>
          </button>
          <button onClick={() => setCurrentTask('role')} className="py-4 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-left px-5 flex justify-between items-center group transition-all shadow-md active:scale-98">
            <span className="text-gray-300 group-hover:text-white font-bold tracking-widest text-sm">［職務任免］</span>
            <span className="text-3xs text-gray-500 font-normal">指派高級守衛與管家</span>
          </button>
        </div>
      )}

      {currentTask === 'inventory' && !selectedItemId && (
        <div className="w-full max-w-md mx-auto bg-gray-900/80 p-4 border border-gray-700 rounded-lg shadow-xl animate-fade-in flex flex-col gap-3 relative z-20">
          <div className="text-xs text-gray-400 font-bold border-b border-gray-800 pb-2 tracking-widest">［請先選取商會庫房資產］</div>
          {Object.entries(inventory).length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-8">［商會庫房目前空無一物］</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-none">
              {Object.entries(inventory).map(([itemId, qty]) => {
                if (qty <= 0) return null;
                const item = ITEMS_DATA[itemId];
                if (!item) return null;
                return (
                  <div key={itemId} onClick={() => setSelectedItemId(itemId)} className="flex justify-between items-center bg-gray-950 p-3 border border-gray-800 rounded hover:border-gray-600 transition-colors cursor-pointer group relative z-30">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-gray-200 group-hover:text-white">{item.name} <span className="text-xs text-gray-500 font-mono ml-1">x{qty}</span></span>
                      <span className="text-2xs text-gray-500">{item.desc}</span>
                    </div>
                    <span className="text-3xs text-gray-500 font-bold tracking-widest shrink-0">［點擊選定］</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {currentTask !== 'none' && (currentTask !== 'inventory' || selectedItemId) && (
        <div className="w-full flex flex-col gap-5 mt-2 animate-fade-in relative z-20">
          {idleSlaves.length === 0 ? (
            <div className="text-xs text-red-500 bg-red-950/20 p-4 border border-red-900/30 rounded text-center max-w-sm mx-auto">
              目前據點內沒有任何處於「閒置」狀態的成員可供指派。
            </div>
          ) : (
            <div className="flex flex-col items-center w-full relative z-20">
              
              {/* ★ V2.9.7 修正點擊被吃掉的 Bug，為外層加上 pointer-events-none，內層開放 */}
              <div className="flex items-center justify-center w-full h-[260px] md:h-[280px] relative overflow-hidden perspective-1000 z-30 pointer-events-none">
                {idleSlaves.map((slave, index) => {
                  const diff = index - carouselIndex;
                  const isCenter = diff === 0;
                  const isLeft = diff === -1 || (carouselIndex === 0 && index === idleSlaves.length - 1);
                  const isRight = diff === 1 || (carouselIndex === idleSlaves.length - 1 && index === 0);
                  
                  if (!isCenter && !isLeft && !isRight) return null;

                  let transformClass = "";
                  if (isCenter) transformClass = "translate-x-0 scale-100 z-40 opacity-100 pointer-events-auto cursor-default";
                  if (isLeft) transformClass = "-translate-x-[32%] md:-translate-x-[40%] scale-80 z-20 opacity-30 rotate-y-25 cursor-pointer pointer-events-auto hover:opacity-50";
                  if (isRight) transformClass = "translate-x-[32%] md:translate-x-[40%] scale-80 z-20 opacity-30 -rotate-y-25 cursor-pointer pointer-events-auto hover:opacity-50";

                  const isSlaveFainted = (slave.faintTurns || 0) > 0;

                  return (
                    <div 
                      key={slave.id}
                      onClick={() => { if (!isCenter) setCarouselIndex(index); }}
                      className={`absolute w-[240px] md:w-[280px] h-full bg-gray-900/95 border ${slave.isInjured ? 'border-red-900/80' : 'border-gray-700'} rounded-xl p-4 shadow-2xl transition-all duration-500 ease-out flex flex-col justify-between transform ${transformClass} select-none shrink-0`}
                    >
                      {isSlaveFainted && isCenter && (
                        <div className="absolute inset-0 bg-gray-950/90 z-50 flex flex-col items-center justify-center p-3 text-center backdrop-blur-xs rounded-xl">
                          <span className="text-red-500 font-black tracking-widest text-2xs animate-pulse border border-red-900/60 bg-red-950/40 px-2 py-1 rounded">
                            ［昏厥鎖死］
                          </span>
                          <p className="text-3xs text-gray-500 mt-2 leading-relaxed">
                            大腦休克。尚需 <strong className="text-gray-300 font-mono">{slave.faintTurns}</strong> 個時段甦醒。
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-start w-full shrink-0">
                        <div className="flex flex-col gap-0.5">
                          <span className={`font-black text-sm tracking-widest truncate max-w-[140px] ${slave.isInjured ? 'text-red-400' : 'text-blue-400'}`}>
                            {slave.name}
                          </span>
                          <span className="text-3xs text-gray-500 font-bold">
                             種族：{slave.race} ({slave.gender === 'Male' ? '男' : '女'})
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          {slave.role === 'maid' && <span className="text-4xs px-1.5 py-0.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 font-bold rounded">管家</span>}
                          {slave.role === 'security' && <span className="text-4xs px-1.5 py-0.5 bg-purple-900/40 border border-purple-700/50 text-purple-300 font-bold rounded">守衛</span>}
                          {slave.isInjured && <span className="text-4xs px-1.5 py-0.5 bg-red-950 border border-red-800 text-red-400 font-black animate-pulse rounded">負傷</span>}
                        </div>
                      </div>

                      <div className="flex-1 my-3 bg-gray-950/80 rounded-lg p-2.5 border border-gray-800 flex flex-col justify-center gap-1.5 text-3xs shrink-0">
                        {currentTask === 'train' && (
                          <>
                            <div className="text-4xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-0.5 tracking-widest">［培育特訓現況］</div>
                            <div className="flex justify-between"><span>戰鬥專精:</span> <span className="text-blue-400 font-bold font-mono">Lv.{slave.skills.combat}</span></div>
                            <div className="flex justify-between"><span>內政管家:</span> <span className="text-blue-400 font-bold font-mono">Lv.{slave.skills.housework}</span></div>
                            <div className="flex justify-between"><span>生存本能:</span> <span className="text-blue-400 font-bold font-mono">Lv.{slave.skills.survival}</span></div>
                          </>
                        )}

                        {currentTask === 'role' && (
                          <>
                            <div className="text-4xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-0.5 tracking-widest">［進階職能審查］</div>
                            <div className="flex justify-between">
                              <span>原生服從度:</span> 
                              <span className={slave.primaryStats.obedience >= 80 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                {slave.primaryStats.obedience} / 80
                              </span>
                            </div>
                            <div className="flex justify-between"><span>當前心理反抗:</span> <span className="font-mono">{slave.conditionStats.rebellion}/100</span></div>
                          </>
                        )}

                        {(currentTask === 'clean' || currentTask === 'dialogue' || currentTask === 'inventory') && (
                          <>
                            <div className="text-4xs text-gray-500 font-bold border-b border-gray-800 pb-1 mb-0.5 tracking-widest">［狀態核心觀測］</div>
                            <div className="flex justify-between">
                              <span>管家等級:</span> 
                              {slave.isInjured ? 
                                <span className="text-red-400 font-bold">Lv.{Math.floor(slave.skills.housework * 0.5)} <span className="text-gray-600 font-normal">(原:{slave.skills.housework})</span></span>
                                : <span className="text-blue-400 font-bold">Lv.{slave.skills.housework}</span>
                              }
                            </div>
                            <div className="flex justify-between">
                              <span>配戴武具:</span> 
                              <span className="text-blue-400 truncate max-w-[120px]">
                                 {slave.equipment?.weaponId ? ITEMS_DATA[slave.equipment.weaponId]?.name : '無配戴'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="w-full flex flex-col gap-1 shrink-0">
                        <div className="flex justify-between text-4xs text-gray-500">
                          <span>儲備體力</span>
                          <span className="font-mono">{slave.conditionStats.stamina}/100</span>
                        </div>
                        <div className="w-full h-1 bg-gray-950 rounded-full overflow-hidden">
                           <div className="bg-green-600 h-full transition-all duration-300" style={{ width: `${slave.conditionStats.stamina}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 切換按鈕也要確保能在上層被點擊 */}
              <div className="flex gap-10 mt-3 z-40 shrink-0 relative">
                <button onClick={prevCarousel} className="px-4 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors active:scale-95 shadow cursor-pointer">
                  〈 傳喚上一位
                </button>
                <button onClick={nextCarousel} className="px-4 py-1.5 bg-gray-900 border border-gray-700 rounded text-xs font-bold text-gray-400 hover:text-white transition-colors active:scale-95 shadow cursor-pointer">
                  傳喚下一位 〉
                </button>
              </div>

              {activeSlave && (
                <div className="w-full max-w-md mt-4 bg-gray-950 p-4 border border-gray-800 rounded-xl shadow-inner animate-fade-in shrink-0 relative z-40 pointer-events-auto">
                  
                  {currentTask === 'dialogue' && (
                    <div className="flex flex-col gap-3">
                      <div className="text-xs text-gray-300 italic text-center py-4 px-2 bg-gray-900/60 rounded border border-gray-800 min-h-[60px] flex items-center justify-center">
                        {currentQuote}
                      </div>
                      <button disabled={isFainted} onClick={handleTalk} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-bold text-xs tracking-widest rounded transition-colors disabled:opacity-50">
                        ［要求開口發言］
                      </button>
                    </div>
                  )}

                  {currentTask === 'clean' && (
                    <div className="flex flex-col gap-3">
                      <div className="text-2xs text-gray-500 leading-relaxed bg-gray-900/60 p-3 rounded border border-gray-800">
                        當前據點環境總髒亂度：<strong className={roomDirtiness > 50 ? 'text-yellow-500' : 'text-green-500'}>{roomDirtiness}%</strong><br/>
                        下達此命令將強制消耗該成員 <strong className="text-red-400">15 點體力</strong>。<br/>
                        <span className="text-yellow-600 font-bold block mt-1">［注意］消耗 1 點行動力並推進 1 個時段。</span>
                      </div>
                      <button disabled={isFainted} onClick={() => requestTimeSkipAction('下令整頓大廳環境', executeClean)} className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-bold text-xs tracking-widest rounded transition-colors disabled:opacity-50">
                        ［下令立即整頓環境］
                      </button>
                    </div>
                  )}

                  {currentTask === 'train' && (
                    <div className="flex flex-col gap-2">
                      <div className="text-2xs text-yellow-600 font-bold bg-gray-900/60 p-2.5 rounded border border-gray-800 mb-1 tracking-wider leading-relaxed">
                        ［警告］每次特訓消耗資金: 500、體力: 40、壓力增加: 10。<br/>
                        <span className="text-purple-400 font-normal">強制消耗 1 點全域行動力並推進 1 個時段。</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        <button disabled={isFainted} onClick={() => requestTimeSkipAction('戰鬥專精特訓', () => executeTrain('combat'))} className="flex justify-between items-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-300 font-bold transition-all disabled:opacity-50 cursor-pointer">
                          <span>［下令進行 戰鬥專精 特訓］</span>
                          <span className="text-blue-400 font-mono">目前:Lv.{activeSlave.skills.combat}</span>
                        </button>
                        <button disabled={isFainted} onClick={() => requestTimeSkipAction('內政管家特訓', () => executeTrain('housework'))} className="flex justify-between items-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-300 font-bold transition-all disabled:opacity-50 cursor-pointer">
                          <span>［下令進行 內政管家 特訓］</span>
                          <span className="text-blue-400 font-mono">目前:Lv.{activeSlave.skills.housework}</span>
                        </button>
                        <button disabled={isFainted} onClick={() => requestTimeSkipAction('生存本能特訓', () => executeTrain('survival'))} className="flex justify-between items-center px-4 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded text-xs text-gray-300 font-bold transition-all disabled:opacity-50 cursor-pointer">
                          <span>［下令進行 生存本能 特訓］</span>
                          <span className="text-blue-400 font-mono">目前:Lv.{activeSlave.skills.survival}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentTask === 'inventory' && (
                    <div className="flex flex-col gap-3">
                      {activeSlave.equipment?.weaponId && (
                        <button 
                          disabled={isFainted}
                          onClick={() => {
                            unequipWeapon(activeSlave.id);
                            setSysMessage({ text: `［系統］已沒收 ${activeSlave.name} 的武裝，剝奪信任導致服從度重挫 10 點。`, type: 'error' });
                          }}
                          className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-900 text-red-500 font-bold text-xs tracking-widest rounded transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                        >
                          ［強制解除目前武裝］
                        </button>
                      )}

                      {!selectedItemId ? (
                        <div className="bg-gray-900/60 p-2.5 rounded border border-gray-800 flex flex-col gap-2">
                          <div className="text-3xs text-gray-500 font-bold border-b border-gray-800 pb-1 tracking-widest">［庫房資產清單］</div>
                          {Object.entries(inventory).length === 0 ? (
                            <div className="text-2xs text-gray-600 text-center py-4">［庫房目前空無一物］</div>
                          ) : (
                            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-none">
                              {Object.entries(inventory).map(([itemId, qty]) => {
                                if (qty <= 0) return null;
                                const item = ITEMS_DATA[itemId];
                                if (!item) return null;
                                return (
                                  <div key={itemId} onClick={() => setSelectedItemId(itemId)} className="flex justify-between items-center bg-gray-950 p-2 border border-gray-800 rounded hover:border-gray-600 transition-colors cursor-pointer group">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-bold text-gray-300 group-hover:text-white">{item.name} <span className="text-3xs text-gray-500 font-mono ml-1">x{qty}</span></span>
                                      <span className="text-3xs text-gray-500">{item.desc}</span>
                                    </div>
                                    <span className="text-4xs text-purple-500/70 font-bold tracking-widest shrink-0 group-hover:text-purple-400">［選定］</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="text-2xs text-gray-400 bg-gray-900/60 p-3 rounded border border-gray-800 flex justify-between items-center">
                            <span>預備賞賜：<strong className="text-blue-400">{ITEMS_DATA[selectedItemId]?.name}</strong></span>
                            <button onClick={() => setSelectedItemId('')} className="text-purple-400 underline font-bold active:scale-95 cursor-pointer">［重選］</button>
                          </div>
                          <button 
                            disabled={isFainted}
                            onClick={() => {
                              const item = ITEMS_DATA[selectedItemId];
                              if (!item) return;
                              if (item.type === 'potion') {
                                useItem(selectedItemId, activeSlave.id);
                                setSysMessage({ text: `［系統］${activeSlave.name} 成功服下了 ${item.name}。`, type: 'success' });
                              } else {
                                equipWeapon(selectedItemId, activeSlave.id);
                                setSysMessage({ text: `［系統］${activeSlave.name} 已成功武裝 ${item.name}。獲得 10 點服從度加成。`, type: 'success' });
                              }
                              if ((inventory[selectedItemId] || 0) <= 1) {
                                setSelectedItemId('');
                              }
                            }} 
                            className="w-full py-2.5 bg-purple-900/20 border border-purple-800 text-purple-300 font-bold text-xs tracking-widest rounded transition-colors hover:bg-purple-900/30 disabled:opacity-50 shadow-sm cursor-pointer"
                          >
                            {ITEMS_DATA[selectedItemId]?.type === 'potion' ? '［恩賜並命令服下藥劑］' : '［強力授權並完成武器裝備］'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {currentTask === 'role' && (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          disabled={isFainted}
                          onClick={() => appointRole(activeSlave.id, activeSlave.role === 'maid' ? 'none' : 'maid')}
                          className={`py-3 rounded text-2xs font-bold tracking-widest transition-all border shadow-sm active:scale-95 flex items-center justify-center disabled:opacity-50 cursor-pointer ${
                            activeSlave.role === 'maid'
                              ? 'bg-blue-950/60 text-blue-400 border-blue-700 font-black'
                              : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          {activeSlave.role === 'maid' ? '［解除管家］' : '［任用為管家］'}
                        </button>
                        <button
                          disabled={isFainted}
                          onClick={() => appointRole(activeSlave.id, activeSlave.role === 'security' ? 'none' : 'security')}
                          className={`py-3 rounded text-2xs font-bold tracking-widest transition-all border shadow-sm active:scale-95 flex items-center justify-center disabled:opacity-50 cursor-pointer ${
                            activeSlave.role === 'security'
                              ? 'bg-purple-950/60 text-purple-400 border-purple-700 font-black'
                              : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          {activeSlave.role === 'security' ? '［解除守衛］' : '［任用為守衛］'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>
      )}

      {sysMessage && (
        <div className={`p-3 border rounded text-xs leading-relaxed tracking-wide shrink-0 relative z-50 ${ sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 'bg-gray-900 border-red-900 text-red-500' }`}>
          {sysMessage.text}
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-fade-in">
          <div className="bg-gray-900 border-t-2 border-blood-red rounded-lg p-5 max-w-sm w-full shadow-2xl border-x border-b border-gray-700">
            <h3 className="text-lg font-bold text-red-500 mb-2 tracking-widest flex items-center gap-2">［時光流逝警告］</h3>
            <div className="text-sm text-gray-300 leading-relaxed mb-6 bg-gray-950 p-3 rounded border border-gray-800">
              即將執行：<strong className="text-white">{confirmModal.title}</strong>
              <div className="h-px bg-gray-800 my-2"></div>
              此行動將消耗 <strong className="text-yellow-500">1 點行動力</strong>，並推進 <strong className="text-blue-400">1 個時段</strong>。<br/><br/>
              <span className="text-xs text-gray-500 italic">隨著時間推進，據點的環境髒亂度與外派任務的進度都會隨之變化。是否確認執行？</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded border border-gray-600 transition-colors text-sm tracking-widest cursor-pointer">
                ［重新考慮］
              </button>
              <button onClick={confirmAndExecute} className="flex-1 py-2.5 bg-blood-red/80 hover:bg-blood-red text-white font-bold rounded border border-red-900 transition-all text-sm tracking-widest shadow-lg cursor-pointer">
                ［確認下達］
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
