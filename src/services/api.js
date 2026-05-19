import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_AI_KEY;
const model = import.meta.env.VITE_AI_MODEL;
const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
/**
 * API service function to fetch bot response from Groq API
 * @param {Array} messages - Chat history
 * @param {Function} onChunk - Callback function to handle each new chunk (for updating frontend UI)
 */
export async function fetchBotResponse(messages, onChunk) {
  if (!apiKey) throw new Error("Missing API key.");

  try {
    let reply = "";
    let finalUsage = null;

    const completion = await groq.chat.completions.create({
      model: model,
      temperature: 0.7,
      messages: messages,
      max_completion_tokens: 300,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      reply += content;

      // execute the callback function to update frontend UI with the new chunk
      if (content && typeof onChunk === "function") {
        onChunk(reply);
      }

      // check if usage info is included in the chunk and update finalUsage
      if (chunk.usage) {
        finalUsage = chunk.usage;
      }
    }

    return {
      reply,
      usage: finalUsage,
    };
  } catch (error) {
    console.error("API Service Error:", error);
    throw error;
  }
}
