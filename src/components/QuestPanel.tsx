import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { QUESTS_DATA } from '../utils/gameData';

export default function QuestPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const quests = useGameStore((state) => state.player.quests);

  const activeQuests = Object.keys(quests).filter(k => quests[k] === 'active');
  const hasActive = activeQuests.length > 0;

  return (
    <div className="fixed right-0 top-1/4 z-50 flex items-start animate-fade-in pointer-events-none">
      <div className={`pointer-events-auto flex transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -left-8 top-0 bg-gray-900 border-y border-l border-gray-600 text-gray-300 py-3 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors"
        >
          {hasActive && !isOpen && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
          <span>任</span>
          <span>務</span>
          <span>追</span>
          <span>蹤</span>
        </button>
        <div className="bg-gray-900/95 border border-gray-600 shadow-2xl p-4 w-56 sm:w-64 min-h-[200px] backdrop-blur-md rounded-l-lg border-r-0">
          <h3 className="text-sm font-bold text-gray-200 border-b border-gray-700 pb-2 mb-3 tracking-widest">［劇情追蹤］</h3>
          {!hasActive ? (
            <p className="text-xs text-gray-500 italic leading-relaxed">「深淵目前保持靜默，繼續您的探索……」</p>
          ) : (
            <div className="flex flex-col gap-4">
              {activeQuests.map(qId => {
                const qData = QUESTS_DATA[qId as keyof typeof QUESTS_DATA];
                if (!qData) return null;
                return (
                  <div key={qId} className="bg-gray-950 p-3 rounded border border-gray-800 relative overflow-hidden shadow-inner">
                    <div className="absolute left-0 top-0 w-1 h-full bg-blood-red"></div>
                    <h4 className="text-xs font-bold text-gray-300 mb-1.5 pl-1">{qData.title}</h4>
                    <p className="text-2xs text-gray-500 leading-relaxed pl-1">{qData.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
