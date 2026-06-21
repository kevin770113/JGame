export interface IdentityRecord {
  name: string;
  story: string;
}

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const fetchIdentityBatch = async (): Promise<IdentityRecord[]> => {
  try {
    const prompt = `請隨機生成 10 名黑暗奇幻風格的奴隸檔案。
必須嚴格遵守以下條件：
1. 回傳格式必須為 JSON 陣列 (Array)，包含 10 個物件。格式精準如：[{"name": "名字", "story": "故事"}, ...]
2. name: 【絕對禁止】使用英文與表情符號，必須且只能使用「繁體中文」。
3. story: 一段約 50 字的靈魂氣息或軀體特徵描述。【絕對禁止】使用表情符號。【絕對禁止】使用第三人稱代名詞(如他、她、它)，請一律使用「此人」、「這具軀殼」、「其」或「這個靈魂」代稱。`;

    const response = await fetch(`${API_URL}/ai/run`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }), 
    });

    if (!response.ok) {
      throw new Error(`API 伺服器異常 (狀態碼: ${response.status})`);
    }

    const data = await response.json();
    
    // 取出後端傳來的原始字串
    let rawText = data.response || data.text || JSON.stringify(data);

    // 強制清除 AI 容易亂加的 Markdown 語法
    const cleanText = String(rawText).replace(/```json/gi, '').replace(/```/gi, '').trim();

    // 嘗試安全解析 JSON
    const parsed = JSON.parse(cleanText);
    
    // 確認 AI 確實回傳了陣列，且裡面有合法的物件
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && parsed[0].story) {
      return parsed.slice(0, 10); 
    }
    
    throw new Error("JSON 格式不符預期或缺少屬性");

  } catch (error) {
    console.warn("［系統警告］AI 批次生成失敗，已啟動沉浸式備用方案:", error);
    
    const fallbackNames = ['深淵棄子', '無名死囚', '失落的黯影', '零號殘次品', '破碎的幽影', '無名盲者', '深淵殘渣', '被遺忘者', '罪業之軀', '無魂者'];
    
    return Array.from({ length: 10 }).map(() => ({
      name: fallbackNames[Math.floor(Math.random() * fallbackNames.length)],
      story: `［檔案毀損］在建檔過程中，深淵能量引發了異常波動。這具軀殼的過去已被徹底抹除，大腦僅剩下純粹的服從與生存本能。`
    }));
  }
};
