export interface IdentityRecord {
  name: string;
  story: string;
}

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const fetchIdentityBatch = async (): Promise<IdentityRecord[]> => {
  try {
    // ★ V2.9.2 優化：加入絕對嚴格的 JSON 範例，防堵 AI 輸出純字串陣列
    const prompt = `請扮演台灣在地化的黑暗奇幻遊戲腳本家，隨機生成 10 名「西方架空背景」的奴隸名字。
必須嚴格遵守以下條件：
1. 回傳格式必須為嚴格的 JSON 陣列 (Array)，內部必須包含 10 個 JSON 物件 (Object)。
2. 【絕對禁止】回傳純字串陣列 (如 ["名字1", "名字2"])。
3. 正確的格式範例必須精準如下：
[
  {"name": "亞歷山大"},
  {"name": "伊蓮娜"},
  {"name": "碎骨者"}
]
4. name: 必須是西方奇幻風格的音譯名字或稱號。【絕對限制】必須全程使用「繁體中文（台灣）」，嚴禁出現任何簡體字。禁止使用英文與表情符號。`;

    const response = await fetch(`${API_URL}/ai/run`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }), 
    });

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    const data = await response.json();
    const cleanText = (data.response || '').replace(/```json/gi, '').replace(/```/gi, '').trim();

    const objectBlocks = cleanText.match(/\{[^{}]*?\}/g) || [];
    const salvagedRecords: IdentityRecord[] = [];

    for (const block of objectBlocks) {
      try {
        const item = JSON.parse(block);
        
        if (item && typeof item.name === 'string') {
          const trimmedName = item.name.trim();

          if (trimmedName.length > 0) {
            salvagedRecords.push({
              name: trimmedName,
              story: "" // ★ 保持空字串防範 DB 報錯
            });
          }
        }
      } catch (e) {
        console.warn("［系統無視］成功打撈時過濾掉一筆毀損的殘缺物件。");
      }
    }

    if (salvagedRecords.length > 0) {
      return salvagedRecords;
    }
    
    throw new Error("原子打撈全數失敗，無有效 JSON 物件。");
  } catch (error) {
    console.error('［AI 降臨失敗］', error);
    // ★ V2.9.2 防禦：徹底移除回傳「無名氏」的妥協機制，改為直接拋出錯誤，讓主程式攔截，保持資料庫純淨
    throw new Error("AI 批量生成與打撈作業徹底失敗");
  }
};
