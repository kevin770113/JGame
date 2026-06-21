export interface IdentityRecord {
  name: string;
  story: string;
}

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const fetchIdentityBatch = async (): Promise<IdentityRecord[]> => {
  try {
    const prompt = `請扮演台灣在地化的黑暗奇幻遊戲腳本家，隨機生成 10 名「西方架空背景」的奴隸檔案。
必須嚴格遵守以下條件：
1. 回傳格式必須為 JSON 陣列 (Array)，包含 10 個物件。格式精準如：[{"name": "名字", "story": "故事"}, ...]
2. name: 必須是西方奇幻風格的音譯名字或稱號（例如：亞歷山大、伊蓮娜、碎骨者）。【絕對限制】必須全程使用「繁體中文（台灣）」，嚴禁出現任何簡體字（絕對禁止使用如：亚、尔、龙、战、奥 等簡體字）。禁止使用英文與表情符號。
3. story: 一段約 50 字的靈魂氣息或軀體特徵描述。【絕對限制】禁止使用表情符號。禁止使用第三人稱代名詞(如他、她、它)，請一律使用「此人」、「這具軀殼」、「其」或「這個靈魂」代稱。全篇必須為標準繁體中文。`;

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

    // 清理 Markdown 標籤的外殼
    const cleanText = String(rawText).replace(/```json/gi, '').replace(/```/gi, '').trim();

    // ★ 終極優化：原子級物件打撈演算法 (Salvage Mode)
    // 尋找所有被 { 和 } 包裹的潛在 JSON 物件區塊
    const objectBlocks = cleanText.match(/\{[^{}]*?\}/g) || [];
    const salvagedRecords: IdentityRecord[] = [];

    for (const block of objectBlocks) {
      try {
        // 針對每一個獨立的原子物件進行單獨解析
        const item = JSON.parse(block);
        
        // 嚴格驗證欄位存在與型別
        if (item && typeof item.name === 'string' && typeof item.story === 'string') {
          const trimmedName = item.name.trim();
          const trimmedStory = item.story.trim();

          if (trimmedName.length > 0 && trimmedStory.length > 0) {
            salvagedRecords.push({
              name: trimmedName,
              story: trimmedStory
            });
          }
        }
      } catch (e) {
        // 單一物件解析失敗時，安靜地跳過它，繼續打撈下一筆，絕不引發系統崩潰
        console.warn("［系統無視］成功打撈時過濾掉一筆毀損的殘缺物件。");
      }
    }

    // 只要有成功打撈出任何一筆完好的資料，就直接回傳，拒絕觸發後備方案
    if (salvagedRecords.length > 0) {
      return salvagedRecords;
    }
    
    throw new Error("原子級打撈結束，未發現任何合法的 JSON 物件");

  } catch (error) {
    console.warn("［系統警告］AI 批次生成或打撈全面失敗，已啟動沉浸式備用方案:", error);
    
    const fallbackNames = ['深淵棄子', '無名死囚', '失落的黯影', '零號殘次品', '破碎的幽影', '無名盲者', '深淵殘渣', '被遺忘者', '罪業之軀', '無魂者'];
    
    return Array.from({ length: 10 }).map(() => ({
      name: fallbackNames[Math.floor(Math.random() * fallbackNames.length)],
      story: `［檔案毀損］在建檔過程中，深淵能量引發了異常波動。這具軀殼的過去已被徹底抹除，大腦僅剩下純粹的服從與生存本能。`
    }));
  }
};
