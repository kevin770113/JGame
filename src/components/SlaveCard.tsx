import { Slave } from '../types';

interface SlaveCardProps {
  slave: Slave;
}

export default function SlaveCard({ slave }: SlaveCardProps) {
  const { combat, endurance, intelligence, obedience } = slave.primaryStats;
  const { stamina, stress, rebellion } = slave.conditionStats;

  // 渲染性別專屬圖示與顏色
  const renderGender = () => {
    if (slave.gender === 'Male') return <span className="text-blue-400 font-bold ml-2">♂</span>;
    if (slave.gender === 'Female') return <span className="text-pink-400 font-bold ml-2">♀</span>;
    return null;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex flex-col gap-3 shadow-md relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-blood-red opacity-70"></div>

      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-200 flex items-center">
            {slave.name}
            {renderGender()}
          </h3>
          {/* 種族直接顯示中文 */}
          <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded mt-1 inline-block border border-gray-600">
            {slave.race}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm z-10 mt-1">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between"><span className="text-gray-400">武力:</span> <span className="text-gray-200">{combat}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">體質:</span> <span className="text-gray-200">{endurance}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">智力:</span> <span className="text-gray-200">{intelligence}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">服從:</span> <span className={obedience < 20 ? 'text-red-500 font-bold' : 'text-gray-200'}>{obedience}</span></div>
        </div>

        <div className="flex flex-col gap-1 border-l border-gray-700 pl-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">體力</span>
            <div className="w-16 h-2 bg-gray-900 rounded overflow-hidden flex">
              <div className="bg-green-500 h-full" style={{ width: `${stamina}%` }}></div>
            </div>
            <span className="text-xs text-gray-400 ml-1 w-6 text-right">{stamina}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">壓力</span>
            <div className="w-16 h-2 bg-gray-900 rounded overflow-hidden flex">
              <div className="bg-yellow-500 h-full" style={{ width: `${stress}%` }}></div>
            </div>
            <span className="text-xs text-gray-400 ml-1 w-6 text-right">{stress}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">反抗</span>
            <div className="w-16 h-2 bg-gray-900 rounded overflow-hidden flex">
              <div className="bg-blood-red h-full" style={{ width: `${rebellion}%` }}></div>
            </div>
            <span className="text-xs text-gray-400 ml-1 w-6 text-right">{rebellion}</span>
          </div>
        </div>
      </div>

      {slave.traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 z-10">
          {slave.traits.map(trait => (
            <span key={trait} className="text-xs px-2 py-0.5 bg-gray-900 text-gray-400 rounded border border-gray-700">
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
