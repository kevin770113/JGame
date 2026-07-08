import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export default function BaseView() {
  const { t } = useTranslation();
  const { location, roomDirtiness } = useGameStore((state) => state.player);
  
  const getLocationName = () => {
    switch (location) {
      case 'Frontlines': return t('location.frontlines_desc', '混亂前線邊境大廳');
      case 'NeutralHub': return t('location.neutral_hub_desc', '中立貿易城商會總部');
      case 'Capital': return t('location.capital_desc', '安逸皇城奢華宅邸');
      default: return t('location.secret_base', '秘密據點');
    }
  };

  return (
    <div className="w-full flex flex-col pb-8 relative min-h-[75vh] animate-fade-in">
      <div className="border-b border-gray-700 pb-2 bg-gray-950/70 p-3 rounded backdrop-blur-xs">
        <h2 className="text-xl font-bold text-gray-300">{getLocationName()}</h2>
        <p className="text-xs text-gray-400 mt-1">
          {t('base.description', '商會的核心調度中樞，掌控所有內部設施與據點動態。')}
        </p>
      </div>

      <div className="flex-1 mt-4 flex flex-col items-center">
        {roomDirtiness > 50 && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded text-xs text-red-400 leading-relaxed animate-pulse tracking-wide backdrop-blur-xs w-full max-w-sm text-center">
            {t('base.dirtiness_warning', '［系統警告］環境過於髒亂！成員睡眠恢復效率已大打折扣。請儘速指派人員進行整頓打掃。')}
          </div>
        )}
      </div>
    </div>
  );
}
