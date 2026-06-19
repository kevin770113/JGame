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

    // 替換為最新的 Llama 3.1 模型，並改用 messages 陣列格式以提升 JSON 生成穩定度
    const aiResponse = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
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

    let cleanText = aiResponse.response || "";
    cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedData = JSON.parse(cleanText);

    return new Response(JSON.stringify({ response: parsedData }), {
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
