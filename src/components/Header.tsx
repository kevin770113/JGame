import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { t } = useTranslation();
  const { gold, food, prestige, actionPoints, maxActionPoints, location, timeSlot } = useGameStore((state) => state.player);
  const currentScene = useGameStore((state) => state.currentScene);

  const getSceneName = () => {
    if (currentScene === 'Home') return t('location.base', '據點大廳');
    
    switch (location) {
      case 'Capital': return t('location.capital', '帝國皇城');
      case 'BorderTown': return t('location.border_town', '邊境城鎮');
      default: return t('location.unknown', '邊陲廢土');
    }
  };

  const getTimeSlotName = () => {
    switch (timeSlot) {
      case 'Morning': return t('time.morning', '清晨 🌅');
      case 'Noon': return t('time.noon', '正午 ☀️');
      case 'Evening': return t('time.evening', '黃昏 🌇');
      case 'Night': return t('time.night', '深夜 🌙');
      default: return t('time.unknown', '時空錯置');
    }
  };

  return (
    <header className="w-full bg-gray-950 border-b border-gray-800 px-3 py-2 sm:py-2.5 flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between shadow-lg font-mono z-30 relative select-none">
      
      <div className="flex items-center justify-between sm:justify-start gap-3">
        <div className="flex items-center gap-2">
          <span className="text-blood-red text-base sm:text-lg animate-pulse">⛓️</span>
          <h1 className="text-xs sm:text-sm font-black tracking-widest text-gray-100 uppercase bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">
            {t('game.title', 'Dark Fantasy Trader')}
          </h1>
        </div>
        
        <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded text-3xs sm:text-2xs font-bold text-purple-400 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
          <span>{getSceneName()}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{getTimeSlotName()}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-x-3 gap-y-1.5 text-3xs sm:text-2xs font-bold text-gray-400">
        
        <div className="flex items-center gap-1 bg-gray-900/60 px-2 py-1 rounded border border-gray-900 shadow-inner min-w-[55px] sm:min-w-[65px]">
          <span className="text-gray-600">⏳</span>
          <span className="text-gray-500 font-sans text-[10px] sm:text-xs">{t('stats.ap', '行動')}:</span>
          <span className={`font-mono text-[10px] sm:text-xs ${actionPoints < 1 ? 'text-red-500 animate-pulse font-black' : 'text-purple-400 font-black'}`}>
            {actionPoints}/{maxActionPoints}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/60 px-2 py-1 rounded border border-gray-900 shadow-inner min-w-[65px] sm:min-w-[75px]">
          <span className="text-yellow-600">🪙</span>
          <span className="text-gray-500 font-sans text-[10px] sm:text-xs">{t('stats.gold', '資金')}:</span>
          <span className="font-mono text-yellow-500 font-black text-[10px] sm:text-xs">
            ${gold}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/60 px-2 py-1 rounded border border-gray-900 shadow-inner min-w-[55px] sm:min-w-[65px]">
          <span className="text-green-600">🌾</span>
          <span className="text-gray-500 font-sans text-[10px] sm:text-xs">{t('stats.food', '口糧')}:</span>
          <span className="font-mono text-green-400 font-black text-[10px] sm:text-xs">
            {food}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-gray-900/60 px-2 py-1 rounded border border-gray-900 shadow-inner min-w-[55px] sm:min-w-[65px]">
          <span className="text-blue-600">👑</span>
          <span className="text-gray-500 font-sans text-[10px] sm:text-xs">{t('stats.prestige', '威望')}:</span>
          <span className="font-mono text-blue-400 font-black text-[10px] sm:text-xs">
            {prestige}
          </span>
        </div>

      </div>
    </header>
  );
}
