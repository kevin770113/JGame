import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export default function QuestPanel() {
  const { t } = useTranslation();
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const { currentChapter, chapterProgress, totalChapterRequired } = useGameStore((state) => state.player);

  const isOpen = activeWindow === 'quests';

  const handleToggle = () => {
    setActiveWindow(isOpen ? null : 'quests');
  };

  const progressPercent = Math.min(100, (chapterProgress / totalChapterRequired) * 100);

  return (
    <>
      <div className="fixed right-0 top-[45%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-400 py-3 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex flex-col items-center justify-center gap-1 transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          <span>任</span>
          <span>務</span>
          <span>進</span>
          <span>度</span>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed right-0 top-0 h-full w-64 sm:w-72 bg-gray-950 border-l border-purple-900/50 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
             📜 {t('quest_panel.title', '［帝國編年史紀實碑］')}
          </h3>
          <button 
            onClick={() => setActiveWindow(null)}
            className="text-gray-500 hover:text-white text-xl font-bold transition-colors bg-gray-950/50 hover:bg-red-950/50 w-7 h-7 rounded border border-gray-800 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-none pb-12">
          <div className="bg-gray-900/80 p-3 rounded-lg border border-purple-950 flex flex-col gap-3 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1.5 opacity-5">
              <span className="text-5xl">👑</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-purple-400 font-bold font-mono tracking-widest uppercase">
                {t('quest_panel.main_quest', '［帝國核心主線進程］')}
              </span>
              <h4 className="text-sm font-black text-gray-200 tracking-wide mt-0.5">
                {t('quest_panel.chapter_title', { chapter: currentChapter, defaultValue: '第 {{chapter}} 章：擴張的序曲' })}
              </h4>
            </div>

            <div className="flex flex-col gap-1 font-mono text-2xs mt-1">
              <div className="flex justify-between text-gray-500 font-bold">
                <span>{t('quest_panel.prestige_progress', '解鎖下章所需威望')}</span>
                <span className="text-purple-400">{chapterProgress} / {totalChapterRequired}</span>
              </div>
              <div className="w-full h-2 bg-gray-950 border border-gray-800 rounded-sm overflow-hidden p-0.5">
                <div 
                  className="bg-purple-600 h-full rounded-2xs shadow-[0_0_8px_rgba(147,51,234,0.5)] transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <p className="text-3xs text-gray-500 leading-relaxed bg-black/30 p-2 rounded border border-gray-950 italic">
              {t('quest_panel.hint', '※ 威望可透過在地下角鬥場取得大捷、或是前往深淵酒館發布告示牌派遣任務獲得。當進度圓滿時，系統將在新時段推進時自動叩開下一章的大門。')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
