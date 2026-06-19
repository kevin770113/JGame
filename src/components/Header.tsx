import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { day, timePhase, gold, food, location } = useGameStore((state) => state.player);
  const processTurn = useGameStore((state) => state.processTurn);

  // 判斷時段給予不同的顏色提示，增加視覺沉浸感
  const timePhaseColor = () => {
    switch(timePhase) {
      case '早上': return 'text-yellow-400';
      case '中午': return 'text-orange-400';
      case '下午': return 'text-orange-300';
      case '晚上': return 'text-indigo-400';
      case '深夜': return 'text-purple-500';
      default: return 'text-white';
    }
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-3 flex flex-wrap justify-between items-center text-xs sm:text-base shadow-md z-10 gap-2">
      <div className="flex gap-3 sm:gap-6 items-center">
        <span className="text-gray-300">
          第 <strong className="text-white">{day}</strong> 天 - <strong className={timePhaseColor()}>{timePhase}</strong>
        </span>
        <span className="text-yellow-500">資金: <strong className="text-white">{gold}</strong></span>
        <span className={`font-bold ${food === 0 ? 'text-blood-red animate-pulse' : 'text-green-500'}`}>
          糧食: <strong className="text-white">{food}</strong>
        </span>
      </div>
      
      <div className="flex gap-3 items-center">
        <div className="text-gray-400 hidden sm:block">
          據點: <span className="text-blood-red font-bold">{location}</span>
        </div>
        {/* 觸發引擎的按鈕 */}
        <button 
          onClick={processTurn}
          className="bg-blood-red hover:bg-red-700 text-white px-3 py-1 rounded font-bold transition-colors shadow border border-red-900"
        >
          推進時段
        </button>
      </div>
    </header>
  );
}
