import { useGameStore } from '../store/useGameStore';

export default function InteractionView() {
  const slaves = useGameStore((state) => state.slaves);
  const appointRole = useGameStore((state) => state.appointRole);
  const navigate = useGameStore((state) => state.navigate);

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">互動與管理</h2>
          <p className="text-2xs text-gray-500 mt-0.5">指派商會核心職務，穩定大後方運作。</p>
        </div>
        <button onClick={() => navigate('Home', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          ［返回大廳］
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {slaves.length === 0 ? (
          <div className="text-xs text-gray-500 text-center mt-10">目前據點內無任何成員。</div>
        ) : (
          slaves.map(slave => {
            const isFainted = (slave.faintTurns || 0) > 0;
            return (
              <div key={slave.id} className={`bg-gray-900 border ${slave.isInjured ? 'border-red-900/50' : 'border-gray-700'} p-3.5 rounded-lg flex flex-col gap-3 relative overflow-hidden shadow-md`}>
                {/* 昏厥鎖死遮罩 */}
                {isFainted && (
                  <div className="absolute inset-0 bg-gray-950/85 z-10 flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <span className="text-gray-300 font-bold tracking-widest border border-gray-600 px-4 py-2 rounded bg-gray-900/90 shadow-lg">
                      ［昏厥中 剩餘 {slave.faintTurns} 回合］
                    </span>
                    <span className="text-red-400 text-xs mt-2 font-bold animate-pulse">喪失意識，無法執行職務</span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className={`font-bold text-base tracking-widest ${slave.isInjured ? 'text-red-400' : 'text-blue-400'}`}>
                      {slave.name}
                    </span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-500">服從: <strong className={slave.primaryStats.obedience >= 80 ? 'text-green-400' : 'text-yellow-500'}>{slave.primaryStats.obedience}</strong></span>
                      <span className="text-gray-500">體力: <strong className={slave.conditionStats.stamina < 30 ? 'text-red-400' : 'text-gray-300'}>{slave.conditionStats.stamina}</strong></span>
                      <span className="text-gray-500">反抗: <strong className={slave.conditionStats.rebellion > 50 ? 'text-red-400' : 'text-gray-300'}>{slave.conditionStats.rebellion}</strong></span>
                    </div>
                  </div>
                  {slave.isInjured && <span className="text-2xs bg-red-950/80 border border-red-800 text-red-400 px-2 py-1 rounded font-bold animate-pulse shadow-sm">負傷中</span>}
                </div>

                <div className="h-px w-full bg-gray-800"></div>

                <div className="flex flex-col gap-2">
                  <label className="text-2xs text-gray-500 font-bold tracking-widest">［職務任免］ (需服從度 ≧ 80)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => appointRole(slave.id, slave.role === 'maid' ? 'none' : 'maid')}
                      className={`py-2 rounded text-xs font-bold tracking-widest transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-1 ${
                        slave.role === 'maid'
                          ? 'bg-blue-900/40 text-blue-300 border-blue-700/50 shadow-[0_0_10px_rgba(29,78,216,0.3)]'
                          : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {slave.role === 'maid' ? '✓ 內務傭人' : '設為傭人'}
                    </button>
                    <button
                      onClick={() => appointRole(slave.id, slave.role === 'security' ? 'none' : 'security')}
                      className={`py-2 rounded text-xs font-bold tracking-widest transition-all border shadow-sm active:scale-95 flex items-center justify-center gap-1 ${
                        slave.role === 'security'
                          ? 'bg-purple-900/40 text-purple-300 border-purple-700/50 shadow-[0_0_10px_rgba(126,34,206,0.3)]'
                          : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                      }`}
                    >
                      {slave.role === 'security' ? '✓ 商會保全' : '設為保全'}
                    </button>
                  </div>
                  <p className="text-2xs text-gray-500 mt-0.5 italic">※ 傭人每日消耗體力打掃據點；保全於深夜鎮壓叛逃者。全商會各職位僅限一人。</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
