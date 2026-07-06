import { useGameStore } from '../store/useGameStore';

export default function BaseView() {
  const { location, roomDirtiness, gold, leaderStamina, leaderFaintTurns } = useGameStore((state) => state.player);
  const activeDispatches = useGameStore(state => state.activeDispatches);
  const cleanRoom = useGameStore((state) => state.cleanRoom);
  const navigate = useGameStore((state) => state.navigate);
  
  // 首領狀態判定
  const isLeaderDispatched = activeDispatches.some(d => d.slaveId === 'LEADER');
  const canLeaderClean = leaderStamina >= 20 && leaderFaintTurns === 0 && !isLeaderDispatched;
  const canOutsourceClean = gold >= 50;

  const getLocationName = () => {
    switch (location) {
      case 'Frontlines': return '混亂前線邊境大廳';
      case 'NeutralHub': return '中立貿易城商會總部';
      case 'Capital': return '安逸皇城奢華宅邸';
      default: return '秘密據點';
    }
  };

  return (
    <div className="w-full flex flex-col justify-between pb-8 relative min-h-[75vh] animate-fade-in">
      <div className="border-b border-gray-700 pb-2 bg-gray-950/70 p-3 rounded backdrop-blur-xs">
        <h2 className="text-xl font-bold text-gray-300">{getLocationName()}</h2>
        <p className="text-xs text-gray-400 mt-1">商會的核心調度中樞，掌控所有內部設施與據點動態。</p>
      </div>

      <div className="flex-1 min-h-[150px] flex flex-col justify-center items-center">
        {roomDirtiness > 50 && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-400 leading-relaxed animate-pulse tracking-wide backdrop-blur-xs my-4 w-full max-w-sm text-center">
            ［環境惡化］據點的髒亂度已達危險臨界點，成員壓力與反抗心正在急劇飆升。
          </div>
        )}

        {/* ★ V2.9.4 雙軌打掃制：首領親自下海或花錢消災 */}
        {roomDirtiness > 0 && (
          <div className="flex flex-col gap-2 w-full max-w-sm mt-4">
            <button
              onClick={() => cleanRoom(true)}
              disabled={!canLeaderClean}
              className={`py-3 rounded border font-bold text-xs tracking-widest shadow transition-colors ${
                canLeaderClean ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500' : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
              }`}
            >
              ［首領親自打掃 (消耗 20 體力)］
            </button>
            <button
              onClick={() => cleanRoom(false)}
              disabled={!canOutsourceClean}
              className={`py-3 rounded border font-bold text-xs tracking-widest shadow transition-colors ${
                canOutsourceClean ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-500' : 'bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed'
              }`}
            >
              ［外包清潔 (消耗 $50)］
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto mt-6">
        <button
          onClick={() => navigate('Home', 'Interaction')}
          className="py-4 sm:py-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-bold text-sm tracking-widest shadow-lg transition-transform active:scale-95 flex items-center justify-center"
        >
          ［互動與管理］
        </button>
        <button
          onClick={() => navigate('Home', 'Room')}
          className="py-4 sm:py-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-bold text-sm tracking-widest shadow-lg transition-transform active:scale-95 flex items-center justify-center"
        >
          ［育成系統］
        </button>
        <button
          onClick={() => navigate('Home', 'Map')}
          className="py-4 sm:py-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-bold text-sm tracking-widest shadow-lg transition-transform active:scale-95 flex items-center justify-center"
        >
          ［遷移系統］
        </button>
        <button
          onClick={() => navigate('Town', 'Main')}
          className="py-4 sm:py-5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 font-bold text-sm tracking-widest shadow-lg transition-transform active:scale-95 flex items-center justify-center"
        >
          ［外出城鎮］
        </button>
      </div>
    </div>
  );
}
