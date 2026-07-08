import i18n from '../i18n';

/**
 * V2.11.0 解析 AI 動態生成的雙語字串
 * @param rawName 原始名稱 (例如: "Zephyr|澤菲爾")
 * @param forcedLang 選填，指定強制解析語系
 * @returns 對應語言的字串
 */
export function parseLocalizedName(rawName: string | null | undefined, forcedLang?: string): string {
  if (!rawName) return '⛓️ [Unnamed]';
  
  // 若字串不包含分隔符，代表是舊資料或固定NPC名字，直接回傳
  if (!rawName.includes('|')) return rawName;

  const [enName, zhName] = rawName.split('|');
  const currentLang = forcedLang || i18n.language || 'zh-TW';

  // 當語系為繁體中文時，取右側中文；其餘所有外國語系一律優雅降級取左側英文
  if (currentLang === 'zh-TW') {
    return zhName ? zhName.trim() : enName.trim();
  }
  
  return enName ? enName.trim() : (zhName ? zhName.trim() : '⛓️ [Unnamed]');
}
