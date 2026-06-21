import { Race, Gender } from '../types';

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const generateSlaveIdentity = async (race: Race, gender: Gender): Promise<{ name: string; story: string }> => {
  try {
    const genderText = gender === 'Male' ? '男性' : '女性';
    
    // ★ 修正 1：在前端組合出完美的 Prompt，明確告訴 AI 要做什麼
    const prompt = `請為黑暗奇幻遊戲生成一名【${race}】【${genderText}】的背景檔案。
必須包含：
1. name: 符合其種族與黑暗奇幻風格的名字（不要太長）。
2. story: 一段約 50 字的悲慘、黑暗或帶有懸疑感的背景故事，說明他為何淪落至地下市場。`;

    const response = await fetch(`${API_URL}/api/generate-identity`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }), // ★ 修正 2：正確傳送 prompt 給後端
    });

    if (!response.ok) {
      throw new Error(`API 伺服器異常 (狀態碼: ${response.status})`);
    }

    const data = await response.json();
    
    // ★ 修正 3：精準擷取後端傳來的 response 字串
    let rawText = data.response || data.text || JSON.stringify(data);

    // 防呆防護 1：強制清除 AI 容易亂加的 Markdown 語法
    const cleanText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();

    // 防呆防護 2：嘗試安全解析 JSON
    const parsed = JSON.parse(cleanText);
    
    if (parsed.name && parsed.story) {
      return {
        name: parsed.name,
        story: parsed.story
      };
    }
    
    throw new Error("JSON 中缺少 name 或 story 屬性");

  } catch (error) {
    console.warn("［系統警告］AI 身份生成失敗，已啟動沉浸式備用方案:", error);
    
    // 沉浸式備用方案 (Fallback)：當 AI 抽風或網路斷線時觸發
    const isMale = gender === 'Male';
    const fallbackNames = isMale 
      ? ['深淵棄子', '無名死囚', '失落的黯影', '零號殘次品'] 
      : ['深淵棄女', '無名盲女', '破碎的幽影', '零號殘次品'];
    
    const randomName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
    
    return {
      name: `${randomName}`,
      story: `［檔案毀損］在建檔過程中，深淵能量引發了異常波動。這名${race}的過去已被徹底抹除，大腦僅剩下純粹的服從與生存本能。`
    };
  }
};
