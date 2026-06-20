import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function BaseView() {
  const { location, roomDirtiness } = useGameStore((state) => state.player);
  const navigate = useGameStore((state) => state.navigate);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getLocationName = () => {
    switch (location) {
      case 'Frontlines': return '混亂前線據點大廳';
      case 'NeutralHub': return '中立貿易城商會總部';
      case 'Capital': return '安逸皇城奢華宅邸';
      default: return '秘密據點';
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-24 relative min-h-[70vh] animate-fade-in">
      <div className="border-b border-gray-700 pb-2">
        <h2 className="text-xl font-bold text-gray-300">{getLocationName()}</h2>
        <p className="text-xs text-gray-500 mt-1">商會的核心調度中樞，掌控所有內部設施與據點動態。</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-lg p-5 flex flex-col gap-4 shadow-lg backdrop-blur-xs">
        <div className="h-48 bg-gray-950/80 rounded border border-gray-800 flex items-center justify-center italic text-gray-600 text-xs text-center px-4 leading-relaxed">
          ［當前據點室內大廳場景插圖預留區］
        </div>

        {roomDirtiness > 50 && (
          <div className="p-3 bg-red-950/20 border border-red-900/40 rounded text-xs text-red-400 leading-relaxed animate-pulse tracking-wide">
            ［系統警告］環境過於髒亂！成員睡眠恢復效率已大打折扣。請儘速傳喚成員前往進行整頓打掃。
          </div>
        )}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 w-full max-w-xs px-4">
        {isMenuOpen && (
          <div className="w-full bg-gray-950/95 border border-gray-700 rounded-lg p-2 flex flex-col gap-1 shadow-2xl animate-slide-up backdrop-blur-md">
            <button
              onClick={() => { navigate('Home', 'Interaction'); setIsMenuOpen(false); }}
              className="w-full py-3 hover:bg-gray-800 rounded font-bold text-xs sm:text-sm text-gray-300 transition-colors text-center border border-transparent hover:border-gray-700 tracking-widest"
            >
              ［召喚成員互動與管理］
            </button>
            <button
              onClick={() => { navigate('Home', 'Room'); setIsMenuOpen(false); }}
              className="w-full py-3 hover:bg-gray-800 rounded font-bold text-xs sm:text-sm text-gray-300 transition-colors text-center border border-transparent hover:border-gray-700 tracking-widest"
            >
              ［進入血統密室］
            </button>
            <button
              onClick={() => { navigate('Home', 'Map'); setIsMenuOpen(false); }}
              className="w-full py-3 hover:bg-gray-800 rounded font-bold text-xs sm:text-sm text-gray-300 transition-colors text-center border border-transparent hover:border-gray-700 tracking-widest"
            >
              ［拔營遷移據點］
            </button>
            <div className="h-px bg-gray-800 my-1 mx-2"></div>
            <button
              onClick={() => { navigate('Town', 'Main'); setIsMenuOpen(false); }}
              className="w-full py-3 bg-blood-red/90 hover:bg-red-700 text-white rounded font-bold text-xs sm:text-sm transition-all shadow-md active:scale-98 text-center border border-red-900 tracking-widest"
            >
              ［開啟城鎮大門］
            </button>
          </div>
        )}

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`px-10 py-3 rounded font-bold text-xs tracking-widest shadow-xl transition-all border transform active:scale-95 ${
            isMenuOpen 
              ? 'bg-gray-800 text-gray-400 border-gray-600' 
              : 'bg-gray-900 text-gray-200 border-gray-500 hover:bg-gray-800'
          }`}
        >
          {isMenuOpen ? '［取消指令］' : '［下達指令］'}
        </button>
      </div>
    </div>
  );
}
