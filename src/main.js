import "./style.css";
import { autoResizeTextarea, checkEnvironment, setLoading } from "./utils.js";
import { fetchBotResponse } from "./services/api.js";
import { marked } from "marked";
import DOMPurify from "dompurify";

// Get UI elements
const giftForm = document.getElementById("gift-form");
const userInput = document.getElementById("user-input");
const outputContent = document.getElementById("output-content");

const chatHistory = [
  // Initialize messages array with system prompt
  {
    role: "system",
    content: `You are the Gift Genie! Make your gift suggestions thoughtful and practical.
          - STRICT RULE:  Your response must be under 200 words. 
          - FORMAT: Provide 3-5 direct bullet points only.
          - MARKDOWN RULE: Start each bullet point on a NEW line using the standard hyphen (-) character. Do NOT compress them into a single line.
          - PROHIBITED: Do NOT include any introductory phrases, setup, or concluding remarks. Only output gift suggestions.`,
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

checkEnvironment();
start();
