import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_AI_KEY;
const model = import.meta.env.VITE_AI_MODEL;
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
export async function fetchBotResponse(messages) {
  if (!apiKey) throw new Error("Missing API key.");

  try {
    const completion = await groq.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 200,
    });

    return {
      reply: completion.choices[0]?.message?.content || "",
      usage: completion.usage,
    };
  } catch (error) {
    console.error("API Service Error:", error);
    throw error;
  }

  
}
