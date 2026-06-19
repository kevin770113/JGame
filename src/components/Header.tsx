import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { turn, gold, food, location } = useGameStore((state) => state.player);
  // 匯入剛剛寫好的回合結算引擎
  const processTurn = useGameStore((state) => state.processTurn);

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-3 flex flex-wrap justify-between items-center text-xs sm:text-base shadow-md z-10 gap-2">
      <div className="flex gap-3 sm:gap-6 items-center">
        <span className="text-gray-300">回合: <strong className="text-white">{turn}</strong></span>
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
          下一回合
        </button>
      </div>
    </header>
  );
}
