import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { supabase } from '../services/supabaseClient';

export default function SystemPanel() {
  const { t, i18n } = useTranslation();
  const activeWindow = useGameStore((state) => state.activeWindow);
  const setActiveWindow = useGameStore((state) => state.setActiveWindow);
  const syncProfileToCloud = useGameStore((state) => state.syncProfileToCloud);
  const loadProfileFromCloud = useGameStore((state) => state.loadProfileFromCloud);
  const isSaving = useGameStore((state) => state.isSaving);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading'>('idle');
  const [showDevData, setShowDevData] = useState(false);
  const [devData, setDevData] = useState<any>(null);

  const isOpen = activeWindow === 'system';
  const handleToggle = () => setActiveWindow(isOpen ? null : 'system');
  const isEn = i18n.language?.startsWith('en');

  const handleManualSave = async () => {
    if (isSaving || saveStatus !== 'idle') return;
    setSaveStatus('saving');
    await syncProfileToCloud();
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleEmergencyLoad = async () => {
    if (loadStatus !== 'idle') return;
    if (window.confirm(t('system.emergency_load_desc', '強行拉取雲端存檔以修復本地異常。是否確認？'))) {
      setLoadStatus('loading');
      await loadProfileFromCloud(true);
      setLoadStatus('idle');
      setActiveWindow(null);
    }
  };

  const fetchDevData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    setDevData(data);
    setShowDevData(true);
  };

  const handleLogout = async () => {
    if (window.confirm(t('system.logout_clear', '［登出與清除快取］確定要執行嗎？本地未同步的進度將會遺失。'))) {
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.reload();
    }
  };

  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  return (
    <>
      <div className="fixed right-0 top-[65%] z-40 flex items-start pointer-events-none animate-fade-in">
        <button
          onClick={handleToggle}
          className="pointer-events-auto bg-gray-900 border-y border-l border-gray-600 text-gray-400 py-4 px-1.5 rounded-l-md shadow-lg font-bold text-xs tracking-widest flex items-center justify-center transition-colors hover:bg-gray-800 hover:text-white active:scale-95"
        >
          <div style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }} className="flex items-center gap-2 uppercase">
            {isEn ? 'SYSTEM' : '系統選單'}
          </div>
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setActiveWindow(null)}
        ></div>
      )}

      <div 
        className={`fixed right-0 top-0 h-full w-64 sm:w-72 bg-gray-950 border-l border-purple-900/50 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 shrink-0">
          <h3 className="text-sm font-bold text-gray-200 tracking-widest flex items-center gap-2">
             {t('system.menu_title', '［系統控制樞紐］')}
          </h3>
          <button 
            onClick={() => setActiveWindow(null)}
            className="text-gray-500 hover:text-white text-xl font-bold transition-colors bg-gray-950/50 hover:bg-red-950/50 w-7 h-7 rounded border border-gray-800 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-none pb-12">
          
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-gray-400 border-l-2 border-blue-500 pl-2 tracking-widest">{t('system.language_setting', '［語系切換 (Language)］')}</h4>
            <p className="text-3xs text-gray-500 mb-1">{t('system.language_desc', '選擇遊戲介面與日誌的顯示語言。')}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => changeLanguage('zh-TW')}
                className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${i18n.language === 'zh-TW' ? 'bg-blue-900/40 text-blue-400 border-blue-700' : 'bg-gray-900 text-gray-500 border-gray-700 hover:bg-gray-800'}`}
              >
                繁體中文
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`flex-1 py-2 text-xs font-bold rounded border transition-colors ${i18n.language === 'en' ? 'bg-blue-900/40 text-blue-400 border-blue-700' : 'bg-gray-900 text-gray-500 border-gray-700 hover:bg-gray-800'}`}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
            <h4 className="text-xs font-bold text-gray-400 border-l-2 border-green-500 pl-2 tracking-widest">{t('system.data_sync', '資料同步')}</h4>
            <p className="text-3xs text-gray-500 mb-1">{t('system.data_sync_desc', '手動強制上傳當前進度。')}</p>
            <button 
              onClick={handleManualSave}
              disabled={saveStatus !== 'idle'}
              className={`w-full py-2.5 rounded text-xs font-bold tracking-widest transition-colors shadow border flex items-center justify-center gap-2 ${
                saveStatus === 'success' ? 'bg-green-950/60 text-green-400 border-green-800' :
                saveStatus === 'saving' ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' :
                'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-700'
              }`}
            >
              {saveStatus === 'success' ? t('system.save_cooldown', '［已安全儲存］') : saveStatus === 'saving' ? t('system.saving', '［同步中...］') : t('system.manual_save', '［手動存檔］')}
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
            <h4 className="text-xs font-bold text-gray-400 border-l-2 border-yellow-500 pl-2 tracking-widest">{t('system.emergency_load', '系統急救：強制覆蓋')}</h4>
            <p className="text-3xs text-gray-500 mb-1">{t('system.emergency_load_desc', '強行拉取雲端存檔以修復本地異常。')}</p>
            <button 
              onClick={handleEmergencyLoad}
              disabled={loadStatus !== 'idle'}
              className="w-full py-2.5 bg-yellow-950/20 hover:bg-yellow-900/40 text-yellow-500 border border-yellow-900 rounded text-xs font-bold tracking-widest transition-colors shadow"
            >
              {loadStatus === 'loading' ? t('system.fetching', '讀取中...') : t('system.pull_cloud', '［拉取雲端］')}
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-800 pt-4">
            <h4 className="text-xs font-bold text-gray-400 border-l-2 border-purple-500 pl-2 tracking-widest">{t('system.dev_mode', '［開發者除錯模式］')}</h4>
            <p className="text-3xs text-gray-500 mb-1">{t('system.dev_mode_desc', '遠端資料庫總覽與本地快取清除。')}</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={fetchDevData}
                className="w-full py-2 bg-purple-950/20 hover:bg-purple-900/40 text-purple-400 border border-purple-900/50 rounded text-xs font-bold tracking-widest transition-colors"
              >
                {t('system.view_all_data', '［查看全資料］')}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-2 bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded text-xs font-bold tracking-widest transition-colors"
              >
                {t('system.logout_clear', '［登出與清除快取］')}
              </button>
            </div>
            
            {showDevData && (
              <div className="mt-2 bg-black/50 p-2 rounded border border-gray-800 max-h-40 overflow-y-auto text-[10px] text-gray-400 font-mono break-all scrollbar-none shadow-inner">
                {devData ? JSON.stringify(devData, null, 2) : t('system.fetching', '讀取中...')}
              </div>
            )}
          </div>
          
          <div className="mt-auto pt-8 flex flex-col gap-2 text-center border-t border-gray-900">
            <span className="text-[10px] text-gray-600 font-mono tracking-widest">Version: V2.11.0</span>
            <div className="flex justify-center gap-4 text-xs">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors underline decoration-gray-700 underline-offset-4">{t('system.patch_notes', '［改版日誌］')}</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors underline decoration-gray-700 underline-offset-4">{t('system.bug_report', '［錯誤回報］')}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
