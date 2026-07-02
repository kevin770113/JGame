import { useGameStore } from '../store/useGameStore';
import { QUESTS_DATA } from '../utils/gameData';

export default function QuestPanel() {
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
    <div className="fixed left-0 top-1/4 z-50 flex items-start animate-fade-in pointer-events-none">
      <div className={`pointer-events-auto flex transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-gray-900/95 border border-gray-600 shadow-2xl p-4 w-56 sm:w-64 min-h-[180px] max-h-[350px] overflow-y-auto backdrop-blur-md rounded-r-lg border-l-0 shadow-purple-900/10">
          <h3 className="text-sm font-bold text-gray-200 border-b border-gray-700 pb-2 mb-3 tracking-widest flex items-center gap-1.5">
             <span className="text-blood-red">📜</span> ［劇情任務］
          </h3>
          {!hasActive ? (
            <p className="text-xs text-gray-400 italic leading-relaxed">「深淵目前保持靜默，繼續您的探索……」</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeQuests.map(qId => {
                const qData = QUESTS_DATA[qId as keyof typeof QUESTS_DATA];
                if (!qData) return null;
                return (
                  <div key={qId} className="bg-gray-950 p-2.5 rounded border border-gray-800 relative overflow-hidden shadow-inner">
                    <div className="absolute left-0 top-0 w-0.5 h-full bg-blood-red"></div>
                    <h4 className="text-2xs font-bold text-gray-200 mb-1 pl-1 tracking-wide">{qData.title}</h4>
                    <p className="text-3xs text-gray-400 leading-normal pl-1">{qData.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={handleToggle}
          className="absolute -right-8 top-0 bg-gray-900 border-y border-r border-gray-600 text-gray-400 py-3 px-1.5 rounded-r-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white"
        >
          {hasActive && !isOpen && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
          <span>任</span>
          <span>務</span>
          <span>追</span>
          <span>蹤</span>
        </button>
      </div>
    </div>
  );
}
