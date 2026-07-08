import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { QUESTS_DATA } from '../utils/gameData';

export default function QuestPanel() {
  const { t } = useTranslation();
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const quests = useGameStore((state) => state.player.quests);

  const isOpen = activeWindow === 'quest';
  const activeQuests = Object.keys(quests).filter(k => quests[k] === 'active');
  const hasActive = activeQuests.length > 0;

  const handleToggle = () => {
    setActiveWindow(isOpen ? null : 'quest');
  };

  return (
    <>
      <div className="fixed right-0 top-[15%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-400 py-3 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          {hasActive && !isOpen && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
          <span>{t('quest_panel.tab_q', '任')}</span>
          <span>{t('quest_panel.tab_u', '務')}</span>
          <span>{t('quest_panel.tab_e', '追')}</span>
          <span>{t('quest_panel.tab_s', '蹤')}</span>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed right-0 top-[15%] bg-gray-900/95 border border-gray-600 shadow-2xl p-4 w-56 sm:w-64 min-h-[180px] max-h-[60vh] overflow-y-auto backdrop-blur-md rounded-l-lg border-r-0 shadow-purple-900/10 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center border-b border-gray-700 pb-2 mb-3">
           <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-1.5">
              {t('quest_panel.title', '［劇情任務］')}
           </h3>
           <button onClick={() => setActiveWindow(null)} className="text-gray-500 hover:text-white text-xl font-bold transition-colors">×</button>
        </div>

        {!hasActive ? (
          <p className="text-xs text-gray-400 italic leading-relaxed">{t('quest_panel.empty', '「深淵目前保持靜默，繼續您的探索……」')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {activeQuests.map(qId => {
              const qData = QUESTS_DATA[qId as keyof typeof QUESTS_DATA];
              if (!qData) return null;
              return (
                <div key={qId} className="bg-gray-950 p-2.5 rounded border border-gray-800 relative overflow-hidden shadow-inner">
                  <div className="absolute left-0 top-0 w-0.5 h-full bg-blood-red"></div>
                  <h4 className="text-2xs font-bold text-gray-200 mb-1 pl-1 tracking-wide">{t(`quests.${qId}.title`, qData.title)}</h4>
                  <p className="text-3xs text-gray-400 leading-normal pl-1">{t(`quests.${qId}.desc`, qData.description)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
