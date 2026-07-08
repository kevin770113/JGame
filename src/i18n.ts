import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 引入基礎語系字典
import zhTW from './locales/zh-TW.json';

const resources = {
  'zh-TW': { translation: zhTW }
};

// 從本地記憶讀取玩家偏好語系，若無則預設為繁體中文
const savedLanguage = localStorage.getItem('app_language') || 'zh-TW';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, 
    fallbackLng: 'zh-TW', 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
