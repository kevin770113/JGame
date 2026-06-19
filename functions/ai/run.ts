interface Env {
  AI: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // 讀取前端傳來的種族資料
    const { prompt } = await context.request.json() as { prompt: string };

    if (!prompt) {
      return new Response(JSON.stringify({ error: "缺少提示詞" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 呼叫 Cloudflare 內建的頂級開源模型 @cf/meta/llama-3-8b-instruct
    const aiResponse = await context.env.AI.run("@cf/meta/llama-3-8b-instruct", {
      prompt: `你是一個黑暗奇幻遊戲的文字引擎。請根據以下要求生成資料：
      ${prompt}
      
      【嚴格限制】：請「僅」回傳一個合法的 JSON 物件，絕對不要包含任何額外的問候語、Markdown 標籤（如 \`\`\`json）或解釋性文字。
      回傳格式必須精準為：{"name": "名字", "story": "故事"}`
    });

    // 強大防呆：過濾可能被模型夾帶的 markdown 語法，確保 JSON 100% 可解析
    let cleanText = aiResponse.response || "";
    cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedData = JSON.parse(cleanText);

    // 回傳給前端
    return new Response(JSON.stringify({ response: parsedData }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    });

  } catch (error: any) {
    // 若 AI 異常或解析失敗，回報 500
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
