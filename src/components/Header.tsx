import { useGameStore } from '../store/useGameStore';

export default function Header() {
  // 從狀態機中讀取玩家資源
  const { turn, gold, food, location } = useGameStore((state) => state.player);

  return (
    <header className="bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center text-sm sm:text-base shadow-md z-10">
      <div className="flex gap-4 sm:gap-6">
        <span className="text-gray-300">回合: <strong className="text-white">{turn}</strong></span>
        <span className="text-yellow-500">資金: <strong className="text-white">{gold}</strong></span>
        <span className="text-green-500">糧食: <strong className="text-white">{food}</strong></span>
      </div>
      <div className="text-gray-400">
        據點: <span className="text-blood-red font-bold">{location}</span>
      </div>
    </header>
  );
}
