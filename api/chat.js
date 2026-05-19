import Groq from "groq-sdk";

// Environment variables
const apiKey = process.env.AI_KEY;
const model = process.env.AI_MODEL || "llama-3.1-8b-instant";

export const config = {
  runtime: "edge", // Edge Runtime for serverless function
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
    });
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server configuration error: Missing API Key" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  console.log(`[Groq Request] Using Model: ${model}`);

  try {
    // read the messages array from the request body, which contains the chat history and the new user prompt
    const { messages } = await req.json();

    const groq = new Groq({ apiKey });

    // call Groq API and create a chat completion with streaming enabled
    const completion = await groq.chat.completions.create({
      model: model,
      temperature: 0.7,
      messages: messages,
      max_completion_tokens: 300,
      stream: true,
      stream_options: { include_usage: true },
    });

    // create a custom ReadableStream to transform the streaming response from Groq into a format that can be consumed by the frontend for real-time updates
    const encoder = new TextEncoder();

    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || "";

          //  Wrap the content in data: { content } format for Server-Sent Events (SSE) 
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
            );
          }

          // send usage metrics
          if (chunk.usage) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ usage: chunk.usage })}\n\n`,
              ),
            );
          }
        }
        controller.close();
      },
    });

    // return the custom stream as the response with appropriate headers for SSE
    return new Response(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Backend Serverless Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
