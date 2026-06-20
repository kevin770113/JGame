import { Slave } from '../types';

interface SlaveCardProps {
  slave: Slave;
}

export default function SlaveCard({ slave }: SlaveCardProps) {
  const { combat, endurance, intelligence, obedience } = slave.primaryStats;
  const { stamina, stress, rebellion } = slave.conditionStats;

  const renderGender = () => {
    if (slave.gender === 'Male') return <span className="text-blue-400 font-bold ml-2 text-xs">［男］</span>;
    if (slave.gender === 'Female') return <span className="text-pink-400 font-bold ml-2 text-xs">［女］</span>;
    return null;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-col gap-3 shadow-md relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gray-600 group-hover:bg-blood-red transition-colors opacity-70"></div>

      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-base font-bold text-gray-200 flex items-center tracking-widest">
            {slave.name}
            {renderGender()}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-950 px-2 py-0.5 rounded mt-1.5 inline-block border border-gray-700">
            種族：{slave.race}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm z-10 mt-1 border-t border-gray-800 pt-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between"><span className="text-gray-500 text-xs">武力:</span> <span className="text-gray-200 font-mono">{combat}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 text-xs">體質:</span> <span className="text-gray-200 font-mono">{endurance}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 text-xs">智力:</span> <span className="text-gray-200 font-mono">{intelligence}</span></div>
          <div className="flex justify-between"><span className="text-gray-500 text-xs">服從:</span> <span className={obedience < 20 ? 'text-red-500 font-bold font-mono' : 'text-gray-200 font-mono'}>{obedience}</span></div>
        </div>

        <div className="flex flex-col gap-1.5 border-l border-gray-800 pl-4 justify-center">
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>體力</span><span>{stamina}/100</span></div>
            <div className="w-full h-1 bg-gray-950 rounded overflow-hidden flex border border-gray-800">
              <div className="bg-green-600 h-full" style={{ width: `${stamina}%` }}></div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>壓力</span><span>{stress}/100</span></div>
            <div className="w-full h-1 bg-gray-950 rounded overflow-hidden flex border border-gray-800">
              <div className="bg-yellow-600 h-full" style={{ width: `${stress}%` }}></div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>反抗</span><span>{rebellion}/100</span></div>
            <div className="w-full h-1 bg-gray-950 rounded overflow-hidden flex border border-gray-800">
              <div className="bg-blood-red h-full" style={{ width: `${rebellion}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {slave.traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 z-10">
          {slave.traits.map(trait => (
            <span key={trait} className="text-2xs px-2 py-0.5 bg-gray-950 text-gray-400 rounded border border-gray-800 tracking-wider">
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
