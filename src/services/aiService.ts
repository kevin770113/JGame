export interface IdentityRecord {
  name: string;
  story: string;
}

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const fetchIdentityBatch = async (): Promise<IdentityRecord[]> => {
  try {
    // ★ V2.9.1 拔除列傳生成指令，大幅降低 Token 消耗
    const prompt = `請扮演台灣在地化的黑暗奇幻遊戲腳本家，隨機生成 10 名「西方架空背景」的奴隸名字。
必須嚴格遵守以下條件：
1. 回傳格式必須為 JSON 陣列 (Array)，包含 10 個物件。格式精準如：[{"name": "名字"}, ...]
2. name: 必須是西方奇幻風格的音譯名字或稱號（例如：亞歷山大、伊蓮娜、碎骨者）。【絕對限制】必須全程使用「繁體中文（台灣）」，嚴禁出現任何簡體字（絕對禁止使用如：亚、尔、龙、战、奥 等簡體字）。禁止使用英文與表情符號。`;

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
        
        // ★ V2.9.1 僅驗證 name，不再要求 story
        if (item && typeof item.name === 'string') {
          const trimmedName = item.name.trim();

          if (trimmedName.length > 0) {
            salvagedRecords.push({
              name: trimmedName,
              story: "" // ★ 強制塞入空字串，防止 Supabase DB Schema 報錯
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
    const fallback: IdentityRecord[] = [];
    for (let i = 0; i < 10; i++) {
       fallback.push({ name: `無名氏 ${Math.floor(Math.random() * 1000)}`, story: "" });
    }
    return fallback;
  }
};
