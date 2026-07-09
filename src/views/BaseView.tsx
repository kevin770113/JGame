import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export default function BaseView() {
  const { t } = useTranslation();
  const { location, roomDirtiness } = useGameStore((state) => state.player);

  const getLocationDesc = () => {
    switch (location) {
      case 'Frontlines': return t('location.frontlines_desc', '混亂前線邊境大廳');
      case 'NeutralHub': return t('location.neutral_hub_desc', '中立貿易城商會總部');
      case 'Capital': return t('location.capital_desc', '安逸皇城奢華宅邸');
      default: return t('location.unknown', '未知');
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in relative z-10">
      <div className="bg-gray-950/80 p-5 rounded-lg border border-gray-800 shadow-xl backdrop-blur-md">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-200 tracking-widest border-b border-gray-800 pb-3">
          {getLocationDesc()}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-3 leading-relaxed">
          {t('base.description', '商會的核心調度中樞，掌控所有內部設施與據點動態。')}
        </p>
        
        {roomDirtiness > 50 && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded text-xs text-red-400 font-bold tracking-widest animate-pulse shadow-inner">
            {t('base.dirtiness_warning', '［系統警告］環境過於髒亂！成員睡眠恢復效率已大打折扣。請儘速指派人員進行整頓打掃。')}
          </div>
        )}
      </div>
    </div>
  );
}
