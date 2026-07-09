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
    <div className="bg-gray-900/95 border border-gray-800 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row gap-4 shadow-xl transition-all hover:border-gray-700 animate-fade-in relative overflow-hidden group">
      
      <div className="w-full sm:w-28 h-44 sm:h-auto bg-black border border-gray-800 rounded flex items-center justify-center relative overflow-hidden shrink-0 shadow-inner">
        <img 
          src={getSlavePortraitUrl(slave)} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover object-[center_15%] transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 pointer-events-none"></div>
      </div>

      <div className="flex-1 flex flex-col justify-between min-w-0 gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-base font-bold text-gray-200 truncate group-hover:text-purple-400 transition-colors tracking-wider">
              {localizedName}
            </h4>
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${slave.gender === 'Male' ? 'bg-blue-950/40 text-blue-400/80 border border-blue-900/40' : 'bg-pink-950/40 text-pink-400/80 border border-pink-900/40'}`}>
              {slave.gender === 'Male' ? t('gender.male_short', '男') : t('gender.female_short', '女')}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-3xs font-mono">
            <span className="bg-black/50 px-1.5 py-0.5 rounded border border-gray-800 text-gray-500">
              {t('stats.race', '種族')}: <strong className="text-gray-300 font-sans tracking-widest ml-1">{t(`race.${slave.race}`, slave.race)}</strong>
            </span>
          </div>

          <div className="flex gap-3 text-[9px] font-mono font-bold mt-1">
             <div className="flex-1 flex flex-col gap-0.5">
               <div className="flex justify-between text-gray-500"><span>{t('stats.stamina', '體力')}</span><span className="text-green-500/80">{slave.conditionStats.stamina}</span></div>
               <div className="h-1 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className="h-full bg-green-600/80 shadow-[0_0_5px_rgba(22,163,74,0.4)] transition-all" style={{ width: `${slave.conditionStats.stamina}%` }}></div></div>
             </div>
             <div className="flex-1 flex flex-col gap-0.5">
               <div className="flex justify-between text-gray-500"><span>{t('stats.stress', '壓力')}</span><span className="text-yellow-500/80">{slave.conditionStats.stress}</span></div>
               <div className="h-1 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className="h-full bg-yellow-600/80 shadow-[0_0_5px_rgba(202,138,4,0.4)] transition-all" style={{ width: `${slave.conditionStats.stress}%` }}></div></div>
             </div>
             <div className="flex-1 flex flex-col gap-0.5">
               <div className="flex justify-between text-gray-500"><span>{t('stats.rebellion', '反抗')}</span><span className="text-red-500/80">{slave.conditionStats.rebellion}</span></div>
               <div className="h-1 bg-gray-950 rounded-full border border-gray-800 overflow-hidden"><div className="h-full bg-red-600/80 shadow-[0_0_5px_rgba(220,38,38,0.4)] transition-all" style={{ width: `${slave.conditionStats.rebellion}%` }}></div></div>
             </div>
          </div>

          {/* 專業 6 宮格資料表 (Professional 6-Stat Grid) */}
          <div className="grid grid-cols-3 gap-0 border border-gray-800/80 rounded bg-black/40 text-[10px] font-mono mt-1.5 shadow-inner">
            <div className="border-r border-b border-gray-800/80 p-1.5 flex justify-between items-center">
              <span className="text-gray-600 font-bold">{t('stats.combat', '武力')}</span>
              <span className="text-red-400/90">{slave.primaryStats.combat}</span>
            </div>
            <div className="border-r border-b border-gray-800/80 p-1.5 flex justify-between items-center">
              <span className="text-gray-600 font-bold">{t('stats.endurance', '體質')}</span>
              <span className="text-green-400/90">{slave.primaryStats.endurance}</span>
            </div>
            <div className="border-b border-gray-800/80 p-1.5 flex justify-between items-center">
              <span className="text-gray-600 font-bold">{t('stats.intelligence', '智力')}</span>
              <span className="text-blue-400/90">{slave.primaryStats.intelligence}</span>
            </div>
            <div className="border-r border-gray-800/80 p-1.5 flex justify-between items-center">
              <span className="text-gray-600 font-bold">{t('stats.charisma', '魅力')}</span>
              <span className="text-purple-400/90">{slave.primaryStats.charisma ?? 10}</span>
            </div>
            <div className="border-r border-gray-800/80 p-1.5 flex justify-between items-center">
              <span className="text-gray-600 font-bold">{t('stats.luck', '幸運')}</span>
              <span className="text-yellow-400/90">{slave.primaryStats.luck ?? 10}</span>
            </div>
            <div className="p-1.5 flex justify-between items-center bg-gray-900/30">
              <span className="text-gray-600 font-bold">{t('stats.obedience', '服從')}</span>
              <span className="text-indigo-400/90">{slave.primaryStats.obedience}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 sm:mt-0 flex justify-end shrink-0 pt-2 border-t border-gray-800/50">
          {actionButton}
        </div>
      </div>
    </div>
  );
}
