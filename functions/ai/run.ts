interface Env {
  AI: any;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { prompt } = await context.request.json() as { prompt: string };

    if (!prompt) {
      return new Response(JSON.stringify({ error: "缺少提示詞" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const aiResponse = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      messages: [
        { 
          role: "system", 
          // 移除強制要求單一物件的指令，讓前端完全掌控資料格式
          content: "你是一個黑暗奇幻遊戲的文字引擎。請嚴格根據玩家的要求生成資料。請「僅」回傳玩家要求的 JSON 格式，絕對不要包含任何額外的問候語、Markdown 標籤（如 ```json）或解釋性文字。" 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ]
    });

    // 將解析工作交給前端，這裡直接回傳 AI 最原始的文字
    let rawText = aiResponse.response || "";

    return new Response(JSON.stringify({ response: rawText }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
