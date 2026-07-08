import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 引入各國語系字典
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json'; // ★ 註冊英文字典

const resources = {
  'zh-TW': { translation: zhTW },
  'en': { translation: en }       // ★ 綁定對應的語言代碼
};

// 從本地記憶讀取玩家偏好語系，若無則預設為繁體中文
const savedLanguage = localStorage.getItem('app_language') || 'zh-TW';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, 
    fallbackLng: 'zh-TW', // 若找不到對應語系的文字，預設退回顯示繁體中文
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
