interface AIDescription {
  name: string;
  story: string;
}

export const generateSlaveIdentity = async (race: string): Promise<AIDescription> => {
  try {
    const response = await fetch('/ai/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `為一個${race}奴隸生成一個充滿黑暗奇幻風格的名字，以及一段約 30 字的簡短背景故事。請以 JSON 格式回傳，格式為 {"name": "...", "story": "..."}`
      })
    });

    // 【除錯邏輯 1】：如果伺服器回傳 404 (找不到路徑) 或 500 (系統錯誤)
    if (!response.ok) {
      const errorText = await response.text(); // 強制抓取 Cloudflare 伺服器底層的錯誤文字
      return {
        name: `HTTP 錯誤碼: ${response.status}`,
        story: `詳細原因: ${errorText.substring(0, 150)}` // 顯示前150個字避免卡片破版
      };
    }

    const result = await response.json();

    // 【除錯邏輯 2】：如果後端 run.ts 有成功執行，但捕捉到內部錯誤
    if (result.error) {
       return {
         name: '後端邏輯報錯',
         story: `詳細原因: ${result.error}`
       };
    }

    // 成功時的正常回傳
    return result.response;
    
  } catch (error: any) {
    // 【除錯邏輯 3】：如果連線直接中斷，或是 JSON 解析徹底失敗
    return {
      name: `前端 Fetch 失敗`,
      story: `錯誤訊息: ${error.message || error.toString()}`
    };
  }
};
