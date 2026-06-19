import { useGameStore } from '../store/useGameStore';

export default function Header() {
  const { turn, gold, food, location } = useGameStore((state) => state.player);

  return (
    // 加入 flex-wrap 讓極窄螢幕自動折行
    <header className="bg-gray-900 border-b border-gray-700 p-3 flex flex-wrap justify-between items-center text-xs sm:text-base shadow-md z-10 gap-2">
      <div className="flex gap-3 sm:gap-6">
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
