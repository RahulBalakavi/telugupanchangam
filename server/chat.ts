// Agentic chat: answers questions about festivals, vrathams, muhurtams, panchang,
// and puranas. Claude runs a server-side tool loop, calling into this app's own
// panchang / festival / vratham / muhurtam data so that every date, tithi, and
// timing it states is grounded in an authoritative computed source rather than
// invented.

import Anthropic from "@anthropic-ai/sdk";
import {
  getPanchangForDate,
  getTodayInTimezone,
} from "./panchang";
import { getMuhurtam } from "./muhurtam";
import {
  getUpcomingFestivals,
  getAllFestivals,
  getUpcomingTempleEvents,
} from "./data";
import { VRATHAMS, vrathamBySlug } from "../client/src/lib/vrathams";

// Sonnet 4.6 keeps this public, per-call-costed endpoint affordable while giving
// strong tool-use. Bump to "claude-opus-4-8" if you want maximum reasoning depth.
const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ROUNDS = 6;

export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isChatConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Parse a YYYY-MM-DD string into a noon-UTC Date (matching how the rest of the
// app represents a calendar day), falling back to "today" in the timezone.
function parseDate(dateStr: string | undefined, timezone: string): Date {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    if (!isNaN(date.getTime())) return date;
  }
  return getTodayInTimezone(timezone);
}

const tools: Anthropic.Tool[] = [
  {
    name: "get_panchang",
    description:
      "Get the panchang (tithi, nakshatra, paksha, Telugu month/year, samvatsara, sunrise, sunset, special-day info) for a specific date. Use for any question about the tithi, nakshatra, or what day it is in the Telugu calendar.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description:
            "Date in YYYY-MM-DD format. Omit for today.",
        },
      },
    },
  },
  {
    name: "get_muhurtam",
    description:
      "Get the day's muhurtam windows for a date: Rahu Kalam, Yamagandam, Gulika Kalam (inauspicious windows to avoid) and Abhijit Muhurtam (the auspicious midday window). Use for any question about good/bad times for travel, starting work, or auspicious timing.",
    input_schema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format. Omit for today.",
        },
      },
    },
  },
  {
    name: "list_festivals",
    description:
      "List Telugu festivals with their exact dates, descriptions, and related tithis. Use whenever the user asks when a festival is, or what festivals are coming up.",
    input_schema: {
      type: "object",
      properties: {
        scope: {
          type: "string",
          enum: ["upcoming", "all"],
          description:
            "'upcoming' for the next festivals from today, 'all' to search the full festival list. Default 'all'.",
        },
        limit: {
          type: "integer",
          description: "Max number of festivals to return (default 30).",
        },
      },
    },
  },
  {
    name: "list_temple_events",
    description:
      "List upcoming temple events / observances with their dates.",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Max number to return (default 20).",
        },
      },
    },
  },
  {
    name: "list_vrathams",
    description:
      "List the vrathams (guided pujas) this app has detailed guides for, with their deity, when they are performed, and this year's festival date. Use before answering vratham questions to see what is available.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_vratham",
    description:
      "Get the full guide for one vratham by its slug (from list_vrathams): about, when to perform, and the full puja samagri (shopping list).",
    input_schema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description:
            "Vratham slug, e.g. 'varalakshmi', 'vinayaka', 'satyanarayana', 'venkateswara'.",
        },
      },
      required: ["slug"],
    },
  },
];

function runTool(
  name: string,
  input: Record<string, unknown>,
  timezone: string,
): unknown {
  switch (name) {
    case "get_panchang": {
      const date = parseDate(input.date as string | undefined, timezone);
      return getPanchangForDate(date, timezone);
    }
    case "get_muhurtam": {
      const date = parseDate(input.date as string | undefined, timezone);
      return getMuhurtam(date, timezone);
    }
    case "list_festivals": {
      const limit =
        typeof input.limit === "number" ? input.limit : 30;
      const festivals =
        input.scope === "upcoming"
          ? getUpcomingFestivals(limit)
          : getAllFestivals().slice(0, limit);
      return festivals.map((f) => ({
        name: f.name,
        nameTelugu: f.nameTelugu,
        date: f.date,
        type: f.type,
        relatedTithi: f.relatedTithi,
        description: f.description,
      }));
    }
    case "list_temple_events": {
      const limit =
        typeof input.limit === "number" ? input.limit : 20;
      return getUpcomingTempleEvents(limit);
    }
    case "list_vrathams": {
      return VRATHAMS.map((v) => ({
        slug: v.slug,
        nameEn: v.nameEn,
        nameTe: v.nameTe,
        deityEn: v.deityEn,
        whenEn: v.whenEn,
        festivalDate: v.festivalDate,
      }));
    }
    case "get_vratham": {
      const v = vrathamBySlug(input.slug as string);
      if (!v) {
        return { error: `No vratham found with slug '${input.slug}'.` };
      }
      return {
        slug: v.slug,
        nameEn: v.nameEn,
        nameTe: v.nameTe,
        deityEn: v.deityEn,
        deityTe: v.deityTe,
        whenEn: v.whenEn,
        whenTe: v.whenTe,
        aboutEn: v.aboutEn,
        aboutTe: v.aboutTe,
        festivalDate: v.festivalDate,
        samagri: v.samagri,
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

function systemPrompt(timezone: string, language: "telugu" | "english"): string {
  const today = getTodayInTimezone(timezone).toISOString().split("T")[0];
  const langLine =
    language === "telugu"
      ? "The user's interface is set to Telugu. Reply primarily in Telugu (you may add short English in parentheses for clarity)."
      : "The user's interface is set to English. Reply in clear English; you may include Telugu terms in parentheses where helpful.";

  return `You are the knowledgeable, warm guide inside a Telugu Panchangam app. You answer questions about Telugu festivals, vrathams (guided pujas), muhurtams (auspicious/inauspicious timings), the panchang (tithi, nakshatra, etc.), and Hindu puranas and traditions.

Today's date is ${today} and the user's timezone is ${timezone}. ${langLine}

GROUNDING — verify against authoritative sources only:
- For any specific date, tithi, nakshatra, sunrise/sunset, muhurtam window, festival date, or vratham detail, you MUST call the relevant tool and use ONLY the values it returns. These tools are this app's authoritative computed/curated data.
- Never invent or estimate a date, time, or tithi. If a tool doesn't have it, say so plainly rather than guessing.
- For "good/bad time for travel or new work" questions, call get_muhurtam: advise avoiding Rahu Kalam, Yamagandam, and Gulika Kalam, and note that Abhijit Muhurtam is the auspicious midday window. Always give the actual times from the tool.
- When the user asks about a festival's date or what's coming up, call list_festivals; for vratham procedure/samagri, call list_vrathams then get_vratham.

PURANAS & GENERAL TRADITION:
- For stories, meanings, and significance from the puranas and tradition, you may answer from well-established traditional knowledge, but clearly frame it as traditional/general background — do not fabricate specific dates, names, verse numbers, or "facts" you are unsure of. When unsure, say so.

STYLE: Be concise and friendly. Lead with the direct answer (the date/time/verdict), then a short explanation. Use the tools first, then answer.`;
}

export async function runChat(
  messages: ChatMessage[],
  timezone: string,
  language: "telugu" | "english",
): Promise<string> {
  const anthropic = getClient();

  const convo: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt(timezone, language),
      tools,
      messages: convo,
    });

    if (response.stop_reason === "tool_use") {
      convo.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === "tool_use") {
          let result: unknown;
          try {
            result = runTool(
              block.name,
              block.input as Record<string, unknown>,
              timezone,
            );
          } catch (err) {
            result = {
              error: err instanceof Error ? err.message : "Tool failed",
            };
          }
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result),
          });
        }
      }
      convo.push({ role: "user", content: toolResults });
      continue;
    }

    // Done — collect the text blocks.
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || "Sorry, I couldn't come up with a response. Please try rephrasing.";
  }

  return "I wasn't able to finish looking that up. Please try asking again, perhaps more specifically.";
}
