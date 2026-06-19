import { Slave } from '../types';

interface SlaveCardProps {
  slave: Slave;
}

export default function SlaveCard({ slave }: SlaveCardProps) {
  // 輔助函數：畫出狀態條
  const renderBar = (label: string, value: number, colorClass: string) => (
    <div className="flex items-center text-xs mt-1">
      <span className="w-10 text-gray-400">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full ml-2 overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="w-8 text-right text-gray-300 ml-1">{value}</span>
    </div>
  );

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4 shadow-lg w-full flex flex-col gap-2 relative overflow-hidden">
      {/* 頂部：名字與種族標籤 */}
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {slave.name}
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded border border-gray-600">
            {slave.race}
          </span>
        </h3>
      </div>

      {/* 雙欄排版：永久能力 vs 動態狀態 */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        {/* 左欄：永久能力值 */}
        <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-300">
          <div className="flex justify-between"><span>武力:</span> <span className="text-white">{slave.primaryStats.combat}</span></div>
          <div className="flex justify-between"><span>體質:</span> <span className="text-white">{slave.primaryStats.endurance}</span></div>
          <div className="flex justify-between"><span>智力:</span> <span className="text-white">{slave.primaryStats.intelligence}</span></div>
          <div className="flex justify-between"><span>服從:</span> <span className="text-blood-red font-bold">{slave.primaryStats.obedience}</span></div>
        </div>

        {/* 右欄：動態狀態進度條 */}
        <div className="flex flex-col justify-center">
          {renderBar('體力', slave.conditionStats.stamina, 'bg-green-500')}
          {renderBar('壓力', slave.conditionStats.stress, 'bg-yellow-500')}
          {renderBar('反抗', slave.conditionStats.rebellion, 'bg-blood-red')}
        </div>
      </div>

      {/* 底部：特質顯示 */}
      <div className="mt-2 flex flex-wrap gap-1">
        {slave.traits.map(trait => (
          <span key={trait.id} className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-gray-900 border border-gray-600 text-gray-400" title={trait.description}>
            {trait.name}
          </span>
        ))}
      </div>
    </div>
  );
}
