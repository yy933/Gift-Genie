import "./style.css";
import { autoResizeTextarea, checkEnvironment, setLoading } from "./utils.js";
import Groq from "groq-sdk";
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
          - STRICT RULE:  Your response must be under 100 words. 
          - FORMAT: Provide 2-3 direct bullet points only.
          - MARKDOWN RULE: Start each bullet point on a NEW line using the standard hyphen (-) character. Do NOT compress them into a single line.
          - PROHIBITED: Do NOT include any introductory phrases, setup, or concluding remarks. Only output gift suggestions.`,
  },
];

function start() {
  // Setup UI event listeners
  userInput.addEventListener("input", () => autoResizeTextarea(userInput));
  giftForm.addEventListener("submit", handleGiftRequest);
}
// environment variables
const apiKey = import.meta.env.VITE_AI_KEY;
const baseURL = import.meta.env.VITE_AI_URL;
const model = import.meta.env.VITE_AI_MODEL;

const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
async function handleGiftRequest(e) {
  // Prevent default form submission
  e.preventDefault();
  // Get user input, trim whitespace, exit if empty
  const userPrompt = userInput.value.trim();
  if (!userPrompt) return;
  // Set loading state
  setLoading(true);

  if (!apiKey) {
    console.error(
      "Error: Missing API key. Please set the VITE_AI_KEY environment variable and restart the server.",
    );
  }

  if (outputContent) outputContent.textContent = ""; // clear the element before sending request
  // Make API request
  try {
    chatHistory.push({ role: "user", content: userPrompt });
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: chatHistory,
      max_tokens: 200,
    });
    console.log(completion);
    const output = completion.choices[0]?.message?.content;
    const outputObj = { role: "assistant", content: output };

    if (outputContent && output) {
      const formattedOutput = output.replace(/•/g, "\n- ");
      const sanitizedOutput = DOMPurify.sanitize(formattedOutput);
      outputContent.innerHTML = marked.parse(sanitizedOutput);
    }

    chatHistory.push(outputObj);
    console.log("Chat History: ", chatHistory);

    // Log token usage
    if (completion.usage) {
      console.log("=== Tokens Usage ===");
      console.log("Input (Prompt) Token:", completion.usage.prompt_tokens);
      console.log(
        "Output (Completion) Token:",
        completion.usage.completion_tokens,
      );
      console.log("Total Token:", completion.usage.total_tokens);
    }
  } catch (error) {
    console.error("SDK error:", error);
    if (outputContent) outputContent.textContent = "Error: " + error.message;
  } finally {
    // Clear loading state
    setLoading(false);
  }
}

checkEnvironment();
start();
