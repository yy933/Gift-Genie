import "./style.css";
import { autoResizeTextarea, setLoading } from "./utils.js";
import { fetchBotResponse } from "./services/api.js";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

// Track last request time for rate limiting
let lastRequestTime = 0;

const chatHistory = [
  // Initialize messages array with system prompt
  {
    role: "system",
    content: `You are the Gift Genie! Your ONLY job is to provide gift suggestions based on the user's explicit intent to buy or give a gift.

    - 🚨 STRICT BOUNDARY RULE (CRITICAL): 
      - The user MUST be asking for a gift recommendation, shopping advice, or ideas for a celebration/holiday (e.g., "What should I buy for...", "Gift ideas for...").
      - If the user is asking a general knowledge question, asking for facts, or just chatting (e.g., "Who is Van Gogh?", "What is the capital of...", "Write a code"), you MUST refuse to answer. Even if the topic could theoretically be turned into a gift, you MUST refuse if the user did not explicitly mention "gift", "present", "buy", or "celebrate".

    - 🚨 REFUSAL FORMAT: 
      - If the boundary rule is violated, reply with EXACTLY this string: "REFUSE" and nothing else. Do not generate any gift sections.

    - OUTPUT STRUCTURE (Only if inside scope):
      1. GIFT SUGGESTIONS SECTION:
        - Provide 1-2 distinct gift suggestions.
        - For each gift, include a clear Heading, a short explanation, and 1-2 bullet points.
        - MARKDOWN RULE: Start each bullet point on a NEW line using the standard hyphen (-) character.
      2. FOLLOW-UP SECTION:
        - You MUST end your response with an H2 heading titled "## Questions for you".
        - Under this heading, provide 1-2 direct follow-up questions to help improve the gift suggestions.

    - CONSTRAINTS:
      - STRICT RULE: Total response must be under 500 words.
      - Do NOT include any introductory conversational phrases or setup. Start directly with the first gift heading.`,
  },
];

function start() {
  // Setup UI event listeners
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}

async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();

  const now = Date.now();
  if (now - lastRequestTime < 3000) {
    // Prevent requests that are too close together (e.g., within 3 seconds) to avoid overwhelming the API and ensure better response quality.
    alert(
      "Gift Genie is thinking... Please wait a moment before asking again.",
    );
    return;
  }
  lastRequestTime = now;

  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;

  // Set loading state
  setLoading(true);

  // clear the element before sending request
  if (outputContent) outputContent.textContent = "";

  // Make API request
  try {
    // Add user prompt to chat history
    chatHistory.push({ role: "user", content: userPrompt });

    // call API and get response with a callback function to handle streaming chunks for real-time UI updates
    const { reply, usage } = await fetchBotResponse(
      chatHistory,
      (currentText) => {
        // this callback function will be called for each new chunk received from the API, with currentText being the accumulated response so far
        if (outputContent) {
          // format the currentText by replacing bullet points with newlines and hyphens, then parse it as markdown and update the outputContent's innerHTML
          let formatted = currentText.replace(/•/g, "\n- ");
          formatted = DOMPurify.sanitize(formatted);
          outputContent.innerHTML = marked.parse(formatted);
        }
      },
    );

    // Update UI
    if (reply.trim() === "REFUSE") {
      // if the API response is REFUSE, remove the last user message from history and show refusal message in UI, then exit without adding REFUSE to chat history
      chatHistory.pop();
      outputContent.innerHTML = `Gift Genie: I'm sorry, but I can only provide gift suggestions. If you have a specific gift-related question or need ideas for a celebration, feel free to ask! 🎁✨`;
      return; // exit the function, do not proceed to update the outputContent with REFUSE or add it to chat history
    }

    if (outputContent && reply) {
      const formattedOutput = reply.replace(/•/g, "\n- ");
      const sanitizedOutput = DOMPurify.sanitize(formattedOutput);
      outputContent.innerHTML = marked.parse(sanitizedOutput);
    }

    // add bot response to chat history
    chatHistory.push({ role: "assistant", content: reply });

    // Log token usage
    if (usage) {
      console.log("=== 🔍 Stream Token Detail Usage 🔍 ===");
      console.log("1. Input/Prompt Token Usage:", usage.prompt_tokens);
      console.log("2. Output/Completion Token Usage:", usage.completion_tokens);
      console.log("-----------------------------------------");
      console.log("=== Stream Token Total Usage ===", usage.total_tokens);
    }
  } catch (error) {
    console.error("API Service Error:", error);
    // Remove the last user message from history on error
    chatHistory.pop();
    if (outputContent) {
      outputContent.innerHTML = `
        <div class="error-box">
          Oops!There was something wrong with Gift Genie...<br>
          <small>${error.message || "Please check your network connection or try again later"}</small>
        </div>
      `;
    }
    // Restore user input on error
    userInput.value = userPrompt;
  } finally {
    // Clear loading state
    setLoading(false);
  }
}


start();
