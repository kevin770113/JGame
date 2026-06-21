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
      max_tokens: 2500,
      messages: [
        { 
          role: "system", 
          content: "你是一個黑暗奇幻遊戲的文字引擎。\n【全局最高指令】：你所有的輸出必須且只能使用「繁體中文(zh-TW)」。絕對禁止輸出任何簡體中文。\n請嚴格根據玩家的要求生成資料。「僅」回傳玩家要求的 JSON 格式，絕對不要包含任何額外的問候語、Markdown 標籤或解釋性文字。" 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ]
    });

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
