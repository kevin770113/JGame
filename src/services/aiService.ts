import { Race, Gender } from '../types';

// 若您有設定專屬的 API 網址，請保留您的設定（或是直接使用您原本的 fetch 網址）
const API_URL = import.meta.env.VITE_API_URL || ''; 

export const generateSlaveIdentity = async (race: Race, gender: Gender): Promise<{ name: string; story: string }> => {
  try {
    // 呼叫 AI API 進行生成
    const response = await fetch(`${API_URL}/api/generate-identity`, { 
      // ⚠️ 注意：如果您原本的 API 路徑不同，請將上面這行替換回您原本的 fetch URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ race, gender }),
    });

    if (!response.ok) {
      throw new Error(`API 伺服器異常 (狀態碼: ${response.status})`);
    }

    const data = await response.json();
    
    // 擷取 AI 回傳的純文字內容 (根據不同的 API 結構可能在不同的欄位)
    let rawText = '';
    if (typeof data === 'string') rawText = data;
    else if (data.text) rawText = data.text;
    else if (data.result) rawText = data.result;
    else if (data.candidates) rawText = data.candidates[0].content.parts[0].text;
    else rawText = JSON.stringify(data);

    // ★ 防呆防護 1：強制清除 AI 容易亂加的 Markdown 語法 (```json ... ```)
    const cleanText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();

    // ★ 防呆防護 2：嘗試安全解析 JSON
    const parsed = JSON.parse(cleanText);
    
    if (parsed.name && parsed.story) {
      return {
        name: parsed.name,
        story: parsed.story
      };
    }
    
    throw new Error("JSON 中缺少 name 或 story 屬性");

  } catch (error) {
    console.warn("［系統警告］AI 身份生成失敗或格式損壞，已啟動沉浸式備用方案:", error);
    
    // ★ 核心修復：沉浸式備用方案 (Fallback) ★
    // 當發生任何錯誤（網路斷線、AI 回傳格式損壞）時，回傳符合深淵世界觀的預設資料
    const isMale = gender === 'Male';
    const fallbackNames = isMale 
      ? ['深淵棄子', '無名死囚', '失落的黯影', '零號殘次品'] 
      : ['深淵棄女', '無名盲女', '破碎的幽影', '零號殘次品'];
    
    const randomName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
    
    return {
      name: `${randomName}`,
      story: `［檔案毀損］在血脈融合的過程中，深淵能量引發了異常波動。這名${race}的過去已被徹底抹除，大腦僅剩下純粹的服從與生存本能。`
    };
  }
};
