import { useTranslation } from 'react-i18next';
import { Slave } from '../types';
import { getSlavePortraitUrl } from '../utils/gameData';
import { parseLocalizedName } from '../utils/i18nUtils';

interface SlaveCardProps {
  slave: Slave;
  actionButton?: React.ReactNode;
}

export default function SlaveCard({ slave, actionButton }: SlaveCardProps) {
  const { t } = useTranslation();
  const localizedName = parseLocalizedName(slave.name);

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-4 shadow-xl transition-all hover:border-gray-700 animate-fade-in relative overflow-hidden group">
      
      <div className="w-full sm:w-28 h-44 sm:h-auto bg-gray-950 border border-gray-800 rounded flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
        <img 
          src={getSlavePortraitUrl(slave)} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover object-[center_15%] transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent z-10 pointer-events-none"></div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-gray-200 truncate group-hover:text-purple-400 transition-colors">
              {localizedName}
            </h4>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${slave.gender === 'Male' ? 'bg-blue-950/50 text-blue-400 border border-blue-900/30' : 'bg-pink-950/50 text-pink-400 border border-pink-900/30'}`}>
              {slave.gender === 'Male' ? t('gender.male', '男性') : t('gender.female', '女性')}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-3xs font-mono">
            <span className="bg-gray-950 px-1.5 py-0.5 rounded border border-gray-850 text-gray-400">
              {t('stats.race', '種族')}: <strong className="text-gray-300 font-sans">{t(`race.${slave.race}`, slave.race)}</strong>
            </span>
          </div>

          <div className="flex gap-3 text-[9px] font-mono font-bold mt-1">
             <div className="flex-1 flex flex-col gap-0.5">
               <div className="flex justify-between text-gray-500"><span>{t('stats.stamina', '體力')}</span><span className="text-green-400">{slave.conditionStats.stamina}</span></div>
               <div className="h-1.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className="h-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.5)] transition-all" style={{ width: `${slave.conditionStats.stamina}%` }}></div></div>
             </div>
             <div className="flex-1 flex flex-col gap-0.5">
               <div className="flex justify-between text-gray-500"><span>{t('stats.stress', '壓力')}</span><span className="text-yellow-500">{slave.conditionStats.stress}</span></div>
               <div className="h-1.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className="h-full bg-yellow-600 shadow-[0_0_8px_rgba(202,138,4,0.5)] transition-all" style={{ width: `${slave.conditionStats.stress}%` }}></div></div>
             </div>
             <div className="flex-1 flex flex-col gap-0.5">
               <div className="flex justify-between text-gray-500"><span>{t('stats.rebellion', '反抗')}</span><span className="text-red-500">{slave.conditionStats.rebellion}</span></div>
               <div className="h-1.5 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className="h-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] transition-all" style={{ width: `${slave.conditionStats.rebellion}%` }}></div></div>
             </div>
          </div>

          {/* ★ V2.11.0 響應式網格：使用 grid-cols-2 與 sm:grid-cols-3，確保手機窄螢幕也不會撐破 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 bg-gray-950/60 p-2.5 rounded border border-gray-850/80 text-3xs font-mono mt-1">
            <div className="flex justify-between items-center"><span className="text-gray-500 font-bold truncate pr-1">{t('stats.combat', '武力')}</span><span className="text-red-400 font-bold text-xs">{slave.primaryStats.combat}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-500 font-bold truncate pr-1">{t('stats.endurance', '體質')}</span><span className="text-green-400 font-bold text-xs">{slave.primaryStats.endurance}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-500 font-bold truncate pr-1">{t('stats.intelligence', '智力')}</span><span className="text-blue-400 font-bold text-xs">{slave.primaryStats.intelligence}</span></div>
            
            <div className="flex justify-between items-center"><span className="text-gray-500 font-bold truncate pr-1">{t('stats.charisma', '魅力')}</span><span className="text-pink-400 font-bold text-xs">{slave.primaryStats.charisma ?? 10}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-500 font-bold truncate pr-1">{t('stats.luck', '幸運')}</span><span className="text-yellow-400 font-bold text-xs">{slave.primaryStats.luck ?? 10}</span></div>
            <div className="flex justify-between items-center sm:border-l sm:border-gray-800 sm:pl-2"><span className="text-gray-500 font-bold truncate pr-1">{t('stats.obedience', '服從')}</span><span className="text-blue-400 font-bold text-xs">{slave.primaryStats.obedience}</span></div>
          </div>
        </div>

        <div className="mt-2 sm:mt-0 flex justify-end shrink-0 pt-2 border-t border-gray-800/30">
          {actionButton}
        </div>
      </div>
    </div>
  );
}
