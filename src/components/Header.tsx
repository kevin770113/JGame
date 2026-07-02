import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { day, timePhase, gold, food, location, roomDirtiness, maxSlaveCapacity, prestige, actionPoints } = useGameStore((state) => state.player);
  const slaves = useGameStore((state) => state.slaves);
  const processTurn = useGameStore((state) => state.processTurn);
  const checkApRecovery = useGameStore((state) => state.checkApRecovery);

  // 掛載自動回復計時器：每 10 秒檢查一次是否達到回復條件
  useEffect(() => {
    const timer = setInterval(() => {
      checkApRecovery();
    }, 10000);
    return () => clearInterval(timer);
  }, [checkApRecovery]);

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
    if (roomDirtiness > 80) return <span className="text-red-500 font-bold animate-pulse">汙染({roomDirtiness}%)</span>;
    if (roomDirtiness > 50) return <span className="text-yellow-500 font-bold">髒亂({roomDirtiness}%)</span>;
    return <span className="text-green-500">乾淨({roomDirtiness}%)</span>;
  };

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-2 sm:p-3 pt-8 md:pt-4 flex flex-col md:flex-row justify-between items-center text-xs shadow-md z-10 gap-2 select-none">
      <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-center">
        <span className="text-gray-300 font-bold tracking-widest">
          第 <strong className="text-white">{day}</strong> 天 <span className="text-gray-600 mx-1">|</span> <strong className={timePhaseColor()}>{timePhase}</strong>
        </span>
        <span className="text-gray-500">資金: <strong className="text-yellow-500 font-mono">{gold}</strong></span>
        <span className="text-gray-500">糧食: <strong className={food === 0 ? 'text-blood-red font-mono animate-pulse' : 'text-green-500 font-mono'}>{food}</strong></span>
        <span className="text-gray-500">威望: <strong className="text-blue-400 font-mono">{prestige}</strong></span>
        {/* 新增：行動力顯示區塊 */}
        <span className="text-gray-500 border-l border-gray-700 pl-2 sm:pl-4">
          行動力: <strong className={actionPoints < 10 ? 'text-red-500 font-mono animate-pulse' : 'text-blue-400 font-mono'}>{actionPoints}/50</strong>
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center mt-1 md:mt-0">
        <span className="text-gray-500">據點: <span className="text-gray-300 font-bold">{getLocationName()}</span></span>
        <span className="text-gray-500 border-l border-gray-700 pl-2">環境: {getDirtinessDisplay()}</span>
        <span className="text-gray-500 border-l border-gray-700 pl-2">
          人口: <strong className={slaves.length > maxSlaveCapacity ? 'text-red-500 font-mono animate-pulse font-bold' : 'text-gray-300 font-mono'}>
            {slaves.length}/{maxSlaveCapacity}
          </strong>
        </span>
        <button 
          onClick={processTurn}
          disabled={actionPoints < 1}
          className={`px-2 py-1 sm:px-3 sm:py-1 rounded font-bold transition-all shadow-sm border tracking-widest ml-1 ${
            actionPoints < 1 
              ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed' 
              : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600 active:scale-95'
          }`}
        >
          推進
        </button>
      </div>
    </header>
  );
}
