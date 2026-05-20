# Gift Genie

Gift Genie is a lightweight AI-powered web app that helps users find gift ideas from a simple prompt. The frontend collects input, sends it to a serverless AI endpoint, and streams the recommendation back in real time.

## Features

- Clean, playful gift recommendation UI with a "Rub the Lamp" button
- AI chat backend with streaming response support
- Gift-only assistant behavior enforced by a system prompt
- Auto-resizing textarea and loading state animation
- Live markdown rendering for gift suggestions

## Tech Stack

- Frontend: Vanilla JavaScript, Vite
- Backend: Serverless API route (`api/chat.js`) with Groq SDK
- Streaming: Custom SSE-style stream parsing in `src/services/api.js`
- Styling: `src/style.css`

## Project Structure

- `index.html` – main HTML shell
- `package.json` – project dependencies and scripts
- `api/chat.js` – serverless AI chat endpoint
- `src/main.js` – frontend app logic and UI handling
- `src/services/api.js` – API request + stream parser
- `src/utils.js` – UI helper functions
- `src/assets/` – visual assets such as icons
- `public/favicon/` – site manifest and favicon files

## Setup

1. Install dependencies:

```bash
npm install
```

2. Add environment variables:

- `AI_KEY` – your AI provider API key
- `AI_MODEL` (optional) – model to use, default is `llama-3.1-8b-instant`

Example for Windows PowerShell:

```powershell
$env:AI_KEY = "your_api_key_here"
$env:AI_MODEL = "llama-3.1-8b-instant"
```

3. Run locally:

- Recommended for full backend + frontend integration: `vercel dev`
- Frontend only: `npm run dev`

## Usage

- Open the app in your browser.
- Enter a gift-related prompt with details like recipient, occasion, budget, or interests.
- Click **Rub the Lamp**.
- Gift Genie will stream back suggestions and follow-up questions.

## Important Behavior

The assistant is intentionally restricted to gift-related requests. If the user prompt is not explicitly about giving a gift, shows intent to buy a gift, or asks for celebration ideas, the backend is designed to respond with exactly `REFUSE`.

## Notes

- The request flow uses `fetchBotResponse()` in `src/services/api.js` to stream response chunks and update the UI progressively.
- The serverless function is implemented for the Vercel Edge Runtime using `runtime: "edge"`.
- The frontend uses `marked` and `DOMPurify` for safe markdown rendering.

## Scripts

- `npm run dev` – start Vite development server
- `npm run build` – build production assets
- `npm run preview` – preview production build locally
