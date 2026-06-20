import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { day, timePhase, gold, food, location, roomDirtiness, maxSlaveCapacity, prestige } = useGameStore((state) => state.player);
  const slaves = useGameStore((state) => state.slaves);
  const processTurn = useGameStore((state) => state.processTurn);

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

  const getLocationName = () => {
    switch (location) {
      case 'Frontlines': return '前線';
      case 'NeutralHub': return '中立城';
      case 'Capital': return '皇城';
      default: return '未知';
    }
  };

  const getDirtinessDisplay = () => {
    if (roomDirtiness > 80) return <span className="text-red-500 font-bold animate-pulse">極度汙染 ({roomDirtiness}%)</span>;
    if (roomDirtiness > 50) return <span className="text-yellow-500 font-bold">環境髒亂 ({roomDirtiness}%)</span>;
    return <span className="text-green-500">整潔 ({roomDirtiness}%)</span>;
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-3 flex flex-col md:flex-row justify-between items-center text-xs shadow-md z-10 gap-2 select-none">
      <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
        <span className="text-gray-300 font-bold tracking-widest">
          第 <strong className="text-white">{day}</strong> 天 <span className="text-gray-600">|</span> <strong className={timePhaseColor()}>{timePhase}</strong>
        </span>
        <span className="text-gray-500">資金: <strong className="text-yellow-500 font-mono">{gold}</strong></span>
        <span className="text-gray-500">糧食: <strong className={food === 0 ? 'text-blood-red font-mono animate-pulse' : 'text-green-500 font-mono'}>{food}</strong></span>
        <span className="text-gray-500">威望: <strong className="text-blue-400 font-mono">{prestige}</strong></span>
      </div>
      
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-gray-500">據點: <span className="text-gray-300 font-bold">{getLocationName()}</span></span>
        <span className="text-gray-500 border-l border-gray-700 pl-3">環境: {getDirtinessDisplay()}</span>
        <span className="text-gray-500 border-l border-gray-700 pl-3">
          人口: <strong className="text-gray-300 font-mono">{slaves.length} / {maxSlaveCapacity}</strong>
        </span>
        <button 
          onClick={processTurn}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded font-bold transition-all shadow-sm border border-gray-600 active:scale-95 tracking-widest"
        >
          推進時段
        </button>
      </div>
    </header>
  );
}
