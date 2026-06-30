// Quick terminal REPL for the agentic chat — no database or full server needed.
//
//   ANTHROPIC_API_KEY="$(cat api_key)" npx tsx script/chat-repl.ts
//   ANTHROPIC_API_KEY="$(cat api_key)" npx tsx script/chat-repl.ts --te   # Telugu replies
//
// Type a question and press enter. Ctrl-C to quit. Conversation history is kept,
// so follow-up questions work.

import readline from "node:readline";
import { runChat, isChatConfigured, type ChatMessage } from "../server/chat";

const timezone = process.env.CHAT_TZ || "Asia/Kolkata";
const language = process.argv.includes("--te") ? "telugu" : "english";

if (!isChatConfigured()) {
  console.error(
    "ANTHROPIC_API_KEY is not set. Run with:\n  ANTHROPIC_API_KEY=\"$(cat api_key)\" npx tsx script/chat-repl.ts",
  );
  process.exit(1);
}

const history: ChatMessage[] = [];
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(
  `Panchangam Assistant REPL (tz=${timezone}, lang=${language}). Ask away — Ctrl-C to quit.\n`,
);
rl.setPrompt("you ▸ ");
rl.prompt();

rl.on("line", async (line) => {
  const q = line.trim();
  if (!q) return rl.prompt();
  history.push({ role: "user", content: q });
  try {
    const reply = await runChat(history, timezone, language);
    history.push({ role: "assistant", content: reply });
    console.log("\nassistant ▸ " + reply + "\n");
  } catch (e) {
    console.error("Error:", e instanceof Error ? e.message : e);
  }
  rl.prompt();
});

rl.on("close", () => {
  console.log("\nbye 🙏");
  process.exit(0);
});
