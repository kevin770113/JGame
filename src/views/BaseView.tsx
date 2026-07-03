import { useGameStore } from '../store/useGameStore';

export default function BaseView() {
  const { location, roomDirtiness } = useGameStore((state) => state.player);
  const navigate = useGameStore((state) => state.navigate);
  
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

      <div className="flex-1 min-h-[150px]"></div>

      {roomDirtiness > 50 && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-400 leading-relaxed animate-pulse tracking-wide backdrop-blur-xs my-4">
          ［系統警告］環境過於髒亂！成員睡眠恢復效率已大打折扣。請儘速指派人員進行整頓打掃。
        </div>
      )}

      {/* ★ V2.6 大廳直覺化大按鈕 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
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
          className="py-4 sm:py-5 bg-blood-red/90 hover:bg-red-700 border border-red-900 rounded-lg text-white font-bold text-sm tracking-widest shadow-lg transition-transform active:scale-95 flex items-center justify-center"
        >
          ［ 外 出 ］
        </button>
      </div>
    </div>
  );
}
