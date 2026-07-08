import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { GAME_CONSTANTS } from '../utils/constants';
import { Location } from '../types';

interface LocationInfo {
  id: Location;
  nameKey: string;
  cost: number;
  reqPrestige: number; 
  descKey: string;
  perksKey: string;
}

const LOCATIONS: LocationInfo[] = [
  { 
    id: 'Frontlines', 
    nameKey: 'map.loc_frontlines.name', 
    cost: GAME_CONSTANTS.RELOCATION_COST.Frontlines, 
    reqPrestige: 0,
    descKey: 'map.loc_frontlines.desc',
    perksKey: 'map.loc_frontlines.perks'
  },
  { 
    id: 'NeutralHub', 
    nameKey: 'map.loc_neutral_hub.name', 
    cost: GAME_CONSTANTS.RELOCATION_COST.NeutralHub, 
    reqPrestige: 100,
    descKey: 'map.loc_neutral_hub.desc',
    perksKey: 'map.loc_neutral_hub.perks'
  },
  { 
    id: 'Capital', 
    nameKey: 'map.loc_capital.name', 
    cost: GAME_CONSTANTS.RELOCATION_COST.Capital, 
    reqPrestige: 500,
    descKey: 'map.loc_capital.desc',
    perksKey: 'map.loc_capital.perks'
  },
];

export default function MapView() {
  const { t } = useTranslation();
  const { gold, prestige, location: currentLocation } = useGameStore((state) => state.player);
  const deductGold = useGameStore((state) => state.deductGold);
  const changeLocation = useGameStore((state) => state.changeLocation);
  const navigate = useGameStore((state) => state.navigate);
  const triggerQuest = useGameStore((state) => state.triggerQuest);

  const [sysMessage, setSysMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    triggerQuest('q_enter_hub');
  }, [triggerQuest]);

  const handleRelocate = (targetLocation: LocationInfo) => {
    const localizedName = t(targetLocation.nameKey);
    if (currentLocation === targetLocation.id) {
      setSysMessage({ text: t('map.err_current', '［提示］您的商會目前已經駐紮在此據點。'), type: 'error' });
      return;
    }

    if (prestige < targetLocation.reqPrestige) {
      setSysMessage({ text: t('map.err_prestige', { name: localizedName, req: targetLocation.reqPrestige, defaultValue: `［拒絕］商會階級不符。進入【${localizedName}】需要至少 ${targetLocation.reqPrestige} 點威望。` }), type: 'error' });
      return;
    }

    if (gold < targetLocation.cost) {
      setSysMessage({ text: t('map.err_gold', { name: localizedName, cost: targetLocation.cost, defaultValue: `［拒絕］疏通資金不足。遷移至【${localizedName}】需要 ${targetLocation.cost} 資金。` }), type: 'error' });
      return;
    }

    deductGold(targetLocation.cost);
    changeLocation(targetLocation.id);
    setSysMessage({ text: t('map.success', { name: localizedName, defaultValue: `［系統］遷移協議已生效。整個據點已正式搬遷進駐【${localizedName}】。` }), type: 'success' });
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-10 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-700 pb-2">
        <div>
          <h2 className="text-xl font-bold text-gray-300">{t('map.title', '商會拔營遷移')}</h2>
          <div className="flex gap-4 mt-0.5">
            <p className="text-2xs text-gray-500">{t('stats.gold_avail', '可用資產')}: <span className="text-yellow-500 font-mono font-bold">{gold}</span></p>
            <p className="text-2xs text-gray-500">{t('stats.prestige_current', '當前威望')}: <span className="text-blue-400 font-mono font-bold">{prestige}</span></p>
          </div>
        </div>
        <button onClick={() => navigate('Home', 'Main')} className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-gray-900 border border-gray-600 hover:bg-gray-800 text-gray-400 font-bold rounded text-xs transition-colors shadow-sm tracking-widest">
          {t('ui.return_base', '［返回大廳］')}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {t('map.hint', '高階據點不僅需要打點資金，更需要商會擁有足夠的［威望］才能取得入城許可。')}
      </p>

      {sysMessage && (
        <div className={`p-3 border rounded text-xs leading-relaxed tracking-wide ${ sysMessage.type === 'success' ? 'bg-gray-900 border-green-800 text-green-500' : 'bg-gray-900 border-red-900 text-red-500' }`}>
          {sysMessage.text}
        </div>
      )}

      <div className="flex flex-col gap-4 mt-2">
        {LOCATIONS.map((loc) => {
          const isCurrent = currentLocation === loc.id;
          const meetsPrestige = prestige >= loc.reqPrestige;
          const canAfford = gold >= loc.cost;
          const canRelocate = meetsPrestige && canAfford;

          return (
            <div key={loc.id} className={`p-4 rounded-lg border flex flex-col gap-3 shadow-md relative overflow-hidden ${ isCurrent ? 'bg-gray-800 border-blood-red' : 'bg-gray-900 border-gray-700' }`}>
              <div className="flex justify-between items-start z-10">
                <div>
                  <h3 className={`text-base font-bold flex items-center gap-2 tracking-widest ${isCurrent ? 'text-blood-red' : 'text-gray-200'}`}>
                    【{t(loc.nameKey)}】
                    {isCurrent && <span className="text-3xs bg-blood-red text-white px-1.5 py-0.5 rounded tracking-normal">{t('map.current_loc', '目前駐紮')}</span>}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5">{t(loc.descKey)}</p>
                </div>
              </div>

              <div className="text-2xs text-gray-300 bg-gray-950 p-2.5 rounded border border-gray-800 font-sans leading-relaxed">
                <span className="text-gray-500 font-bold">{t('map.perks_title', '［解鎖基建特性］')}</span><br/>{t(loc.perksKey)}
              </div>

              {!isCurrent && (
                <div className="flex justify-between items-center mt-1 z-10 border-t border-gray-800 pt-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-400 font-bold tracking-widest">{t('map.cost', '疏通開銷')}: <strong className={canAfford ? 'text-yellow-500 font-mono' : 'text-red-500 font-mono'}>{loc.cost}</strong></span>
                    <span className="text-xs text-gray-400 font-bold tracking-widest">{t('map.req_prestige', '威望需求')}: <strong className={meetsPrestige ? 'text-blue-400 font-mono' : 'text-red-500 font-mono'}>{loc.reqPrestige}</strong></span>
                  </div>
                  <button onClick={() => handleRelocate(loc)} disabled={!canRelocate} className={`px-4 py-2 rounded font-bold text-xs transition-colors tracking-widest ${ canRelocate ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-500 hover:border-gray-400' : 'bg-gray-900 text-gray-700 border border-gray-800 cursor-not-allowed' }`}>
                    {canRelocate ? t('map.btn_relocate', '［下令拔營］') : t('map.btn_denied', '［條件不足］')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
