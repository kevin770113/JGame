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
          content: "你是一個黑暗奇幻遊戲的文字引擎。請嚴格根據玩家的要求生成資料。請「僅」回傳一個合法的 JSON 物件，絕對不要包含任何額外的問候語、Markdown 標籤（如 ```json）或解釋性文字。" 
        },
        { 
          role: "user", 
          content: `${prompt}\n\n回傳格式必須精準為：{"name": "名字", "story": "故事"}` 
        }
      ]
    });

    // ★ 修正：後端不再解析 JSON，直接把 AI 生成的原始文字傳回給前端
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
