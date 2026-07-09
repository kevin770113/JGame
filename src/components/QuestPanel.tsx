import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { QUESTS_DATA } from '../utils/gameData';

export default function QuestPanel() {
  const { t, i18n } = useTranslation();
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const quests = useGameStore((state) => state.player.quests);

  const isOpen = activeWindow === 'quest';
  const activeQuests = Object.keys(quests).filter(k => quests[k] === 'active');
  const hasActive = activeQuests.length > 0;

  const handleToggle = () => setActiveWindow(isOpen ? null : 'quest');
  const isEn = i18n.language?.startsWith('en');

  return (
    <>
      <div className="fixed right-0 top-[15%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-400 py-4 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex items-center justify-center transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          {/* 垂直排版徹底解決 Member Member 重疊撐破的問題 */}
          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="flex items-center gap-2 uppercase">
            {isEn ? 'QUESTS' : '任務追蹤'}
            {hasActive && !isOpen && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse mt-1"></span>}
          </div>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed right-0 top-[15%] bg-gray-950 border-y border-l border-purple-900/50 shadow-2xl p-4 w-56 sm:w-64 min-h-[180px] max-h-[60vh] overflow-y-auto rounded-l-lg z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-3">
           <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-1.5">
              {t('quest_panel.title', '［劇情任務］')}
           </h3>
           <button onClick={() => setActiveWindow(null)} className="text-gray-500 hover:text-red-400 text-xl font-bold transition-colors">×</button>
        </div>

        {!hasActive ? (
          <p className="text-xs text-gray-600 italic leading-relaxed">{t('quest_panel.empty', '「深淵目前保持靜默，繼續您的探索……」')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeQuests.map(qId => {
              const qData = QUESTS_DATA[qId as keyof typeof QUESTS_DATA];
              if (!qData) return null;
              
              let title = qData.title;
              let desc = qData.description;
              if (isEn) {
                 if (qId === 'q_first_blood') { title = '[Main] First Blood'; desc = 'Visit the Underground Market and acquire your first subject.'; }
                 if (qId === 'q_first_fusion') { title = '[Main] Forbidden Alchemy'; desc = 'Complete your first bloodline fusion in the Chamber.'; }
                 if (qId === 'q_enter_hub') { title = '[Main] Into the Grey Zone'; desc = 'Accumulate 100 Prestige and relocate to the Neutral Trade City.'; }
              }

              return (
                <div key={qId} className="bg-black/40 p-3 rounded border border-gray-800 relative overflow-hidden shadow-inner">
                  <div className="absolute left-0 top-0 w-1 h-full bg-blood-red/80"></div>
                  <h4 className="text-xs font-bold text-gray-200 mb-1.5 pl-1.5 tracking-wide">{title}</h4>
                  <p className="text-3xs text-gray-500 leading-relaxed pl-1.5">{desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
