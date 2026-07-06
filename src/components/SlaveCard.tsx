import { Slave } from '../types';

interface SlaveCardProps {
  slave: Slave;
}

export default function SlaveCard({ slave }: SlaveCardProps) {
  const { combat, endurance, intelligence, obedience, charisma = 10, luck = 10 } = slave.primaryStats;
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
        <div className="text-right flex flex-col items-end gap-1">
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${slave.activityStatus === '閒置' ? 'bg-gray-800 text-gray-400' : 'bg-yellow-900/30 text-yellow-500 border border-yellow-700/50'}`}>
            {slave.activityStatus}
          </span>
          <span className="text-xs text-blue-400 font-bold bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">
            服從: {obedience}/100
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-1 z-10">
        <div className="flex flex-col justify-center gap-1 bg-gray-950 p-2 rounded border border-gray-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-bold">武力</span>
            <span className="text-red-400 font-mono font-bold">{combat}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-gray-800/60 pt-1">
            <span className="text-gray-500 font-bold">體質</span>
            <span className="text-green-400 font-mono font-bold">{endurance}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-gray-800/60 pt-1">
            <span className="text-gray-500 font-bold">智力</span>
            <span className="text-blue-400 font-mono font-bold">{intelligence}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-gray-800/60 pt-1">
            <span className="text-gray-500 font-bold">魅力</span>
            <span className="text-pink-400 font-mono font-bold">{charisma}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-gray-800/60 pt-1">
            <span className="text-gray-500 font-bold">幸運</span>
            <span className="text-yellow-400 font-mono font-bold">{luck}</span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 bg-gray-950 p-2 rounded border border-gray-800">
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>體力</span><span>{stamina}/100</span></div>
            <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden flex border border-gray-800">
              <div className="bg-green-600 h-full shadow-[0_0_5px_rgba(22,163,74,0.5)]" style={{ width: `${stamina}%` }}></div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>壓力</span><span>{stress}/100</span></div>
            <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden flex border border-gray-800">
              <div className="bg-yellow-600 h-full shadow-[0_0_5px_rgba(202,138,4,0.5)]" style={{ width: `${stress}%` }}></div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-3xs text-gray-500 font-bold"><span>反抗</span><span>{rebellion}/100</span></div>
            <div className="w-full h-1.5 bg-gray-900 rounded overflow-hidden flex border border-gray-800">
              <div className="bg-blood-red h-full shadow-[0_0_5px_rgba(220,38,38,0.5)]" style={{ width: `${rebellion}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {slave.traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 z-10">
          {slave.traits.map(trait => (
            <span key={trait} className="px-2 py-0.5 bg-purple-900/30 text-purple-400 border border-purple-800/50 rounded text-3xs font-bold tracking-widest">
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
