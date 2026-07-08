export async function fetchIdentityBatch(): Promise<{name: string}[]> {
  // ★ V2.11.0 雙語分割極簡 Prompt
  const prompt = `請生成 10 個黑暗奇幻風格的角色名字。
格式要求：每一行一個名字，必須包含英文與繁體中文，並用「|」隔開。
範例：
Kael|凱爾
Zephyr|澤菲爾
Thorne|索恩
請直接輸出 10 行結果，不要任何其他廢話。`;

  try {
    const response = await fetch('/ai/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error('AI API Error');

    const data = await response.json();
    const rawText = data.response as string;

    // ★ V2.11.0 解析純文字管線 (取代舊有的 JSON 解析)
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
    const results = lines.map(line => ({ name: line }));

    if (results.length === 0) throw new Error('文本解析失敗，未找到包含「|」的格式');
    
    return results;
  } catch (error) {
    console.error('［AI 批次生成失敗］', error);
    throw error;
  }
}
