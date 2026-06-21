import { Race, Gender } from '../types';

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const generateSlaveIdentity = async (race: Race, gender: Gender): Promise<{ name: string; story: string }> => {
  try {
    const genderText = gender === 'Male' ? '男性' : '女性';
    
    // ★ 修正：加入極度嚴格的「繁體中文」與「禁止英文/表情符號」限制
    const prompt = `請為黑暗奇幻遊戲生成一名【${race}】【${genderText}】的背景檔案。
必須嚴格遵守以下條件：
1. name: 符合其種族與黑暗奇幻風格的名字（不要太長）。【絕對禁止】使用英文與表情符號(Emoji)，必須且只能使用「繁體中文」進行命名。
2. story: 一段約 50 字的悲慘、黑暗或帶有懸疑感的背景故事，說明他為何淪落至地下市場。【絕對禁止】使用表情符號(Emoji)。`;

    const response = await fetch(`${API_URL}/ai/run`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }), 
    });

    if (!response.ok) {
      throw new Error(`API 伺服器異常 (狀態碼: ${response.status})`);
    }

    const data = await response.json();
    let rawText = data.response || data.text || JSON.stringify(data);

    const cleanText = rawText.replace(/```json/gi, '').replace(/```/gi, '').trim();
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
