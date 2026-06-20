import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { day, timePhase, gold, food, location, roomDirtiness } = useGameStore((state) => state.player);
  const processTurn = useGameStore((state) => state.processTurn);

  // 時段顏色提示
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

  // 據點名稱轉換
  const getLocationName = () => {
    switch (location) {
      case 'Frontlines': return '前線';
      case 'NeutralHub': return '中立城';
      case 'Capital': return '皇城';
      default: return '未知';
    }
  };

  // 環境髒亂度動態燈號
  const getDirtinessDisplay = () => {
    if (roomDirtiness > 80) return <span className="text-red-500 font-bold animate-pulse">極度髒亂 ({roomDirtiness}%)</span>;
    if (roomDirtiness > 50) return <span className="text-yellow-500 font-bold">髒亂 ({roomDirtiness}%)</span>;
    return <span className="text-green-500">整潔 ({roomDirtiness}%)</span>;
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-3 flex flex-wrap justify-between items-center text-xs sm:text-sm shadow-md z-10 gap-2 select-none">
      <div className="flex gap-3 sm:gap-6 items-center">
        <span className="text-gray-300">
          第 <strong className="text-white">{day}</strong> 天 - <strong className={timePhaseColor()}>{timePhase}</strong>
        </span>
        <span className="text-yellow-500">資金: <strong className="text-white font-mono">{gold}</strong></span>
        <span className={`font-bold ${food === 0 ? 'text-blood-red animate-pulse' : 'text-green-500'}`}>
          糧食: <strong className="text-white font-mono">{food}</strong>
        </span>
      </div>
      
      <div className="flex gap-4 items-center">
        <div className="hidden md:flex items-center gap-3">
          <span className="text-gray-400">
            據點: <span className="text-blood-red font-bold">{getLocationName()}</span>
          </span>
          {/* 內政髒亂度監控 */}
          <span className="text-gray-400 border-l border-gray-700 pl-3 flex gap-1">
            環境: {getDirtinessDisplay()}
          </span>
        </div>
        <button 
          onClick={processTurn}
          className="bg-blood-red hover:bg-red-700 text-white px-4 py-1.5 rounded font-bold transition-all shadow-sm border border-red-900 active:scale-95"
        >
          推進時段 ⏭
        </button>
      </div>
    </header>
  );
}
