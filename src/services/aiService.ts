// 定義 AI 生成的結果結構
interface AIDescription {
  name: string;
  story: string;
}

export const generateSlaveIdentity = async (race: string): Promise<AIDescription> => {
  try {
    // 透過 Cloudflare Workers AI 呼叫 LLM (例如 @cf/meta/llama-3-8b-instruct)
    // 注意：此處需將 /ai/run 替換為您在 Cloudflare Pages 上架設的 Workers 路徑
    const response = await fetch('/ai/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `為一個${race}奴隸生成一個充滿黑暗奇幻風格的名字，以及一段約 30 字的簡短背景故事。請以 JSON 格式回傳，格式為 {"name": "...", "story": "..."}`
      })
    });

    const result = await response.json();
    return result.response;
  } catch (error) {
    console.error('AI 生成失敗，改採預設備援機制', error);
    return {
      name: `${race} 難民`,
      story: '一位失去家園的流浪者，眼神中透著疲憊。'
    };
  }
};
