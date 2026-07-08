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

    // ★ V2.11.0 降級防護：移除所有 JSON 相關要求，強制限定極簡分隔符輸出
    const aiResponse = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
      max_tokens: 800, 
      messages: [
        { 
          role: "system", 
          content: "你是一個黑暗奇幻遊戲的文字引擎。\n【全局最高指令】：你所有的輸出必須且只能使用「繁體中文(zh-TW)」與「英文」。\n請嚴格根據玩家的要求生成資料。「僅」回傳玩家要求的文字格式（例如：English|中文），絕對不要包含任何額外的問候語、Markdown 標籤、JSON 括號或解釋性文字。" 
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
