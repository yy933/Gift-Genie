export async function fetchBotResponse(messages, onChunk) {
  try {
    let reply = "";
    let finalUsage = null;

    // send request to backend API route with the chat history and new user prompt
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read ReadableStream received from the backend
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // Decode the chunk and parse the custom SSE format defined in the backend, which may contain either content or usage data
      const chunkText = decoder.decode(value);

      // Read the chunk line by line, looking for lines that start with "data: " which contain JSON strings with either content or usage information, and update the reply and finalUsage variables accordingly. If onChunk callback is provided, call it with the updated reply for real-time UI updates in the frontend.
      const lines = chunkText.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const data = JSON.parse(jsonStr);

            // address content updates
            if (data.content) {
              reply += data.content;
              if (typeof onChunk === "function") {
                onChunk(reply); // real-time UI updates
              }
            }

            // address usage metrics
            if (data.usage) {
              finalUsage = data.usage;
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
    }

    return {
      reply,
      usage: finalUsage,
    };
  } catch (error) {
    console.error("Frontend API Service Error:", error);
    throw error;
  }
}
