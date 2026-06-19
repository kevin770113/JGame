import { useGameStore } from '../store/useGameStore';
import SlaveCard from '../components/SlaveCard';

export default function BaseView() {
  const slaves = useGameStore((state) => state.slaves);

  return (
    <div className="w-full flex flex-col gap-4 pb-10">
      <div className="flex justify-between items-end border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">基地排程</h2>
        <span className="text-sm text-gray-500">目前成員: {slaves.length} 人</span>
      </div>
      
      {/* 奴隸卡片列表容器 */}
      <div className="flex flex-col gap-4">
        {slaves.length === 0 ? (
          <p className="text-gray-500 text-center py-10">目前沒有任何奴隸，請至市場購買。</p>
        ) : (
          slaves.map((slave) => (
            <SlaveCard key={slave.id} slave={slave} />
          ))
        )}
      </div>
    </div>
  );
}
