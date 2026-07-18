import Groq from "groq-sdk";
import { Response } from "express";
import { env } from "../config/env";
import { GenerateInput, ChatInput } from "../validators/ai.schema";
// import { fetchTripsForChat, ChatFilters } from "./trip.service";
import { TRIP_CATEGORIES } from "../models/Trip";
import { ApiError } from "../utils/ApiError";
import { ChatFilters, fetchTripsForChat } from "../validators/trip.service";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const SMART_MODEL = "llama-3.3-70b-versatile"; // user-facing quality
const FAST_MODEL = "llama-3.1-8b-instant";     // cheap intent extraction

function stripFences(text: string): string {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

// ---------- Feature 1: Description + Title Generator ----------

const LENGTH_MAP = {
  short: "1 paragraph",
  medium: "2-3 paragraphs",
  long: "4-5 paragraphs",
} as const;

export interface GeneratedContent {
  title: string;
  shortDescription: string;
  fullDescription: string;
}

export async function generateDescription(
  input: GenerateInput
): Promise<GeneratedContent> {
  const system = `You are a professional travel copywriter for TripPlanner, a Bangladeshi travel platform (prices in BDT).
Respond ONLY with valid JSON:
{"title": "...", "shortDescription": "...", "fullDescription": "..."}
- title: a catchy trip listing title, 4-8 words, title case, no quotes inside.
- shortDescription: a compelling hook, MAXIMUM 160 characters.
- fullDescription: ${LENGTH_MAP[input.length]}, tone: ${input.tone}. Mention real attractions and experiences typical of the destination. Plain text, no headings.`;

  const user = `Destination: ${input.destination}\nDuration: ${input.durationDays} days\nCategory: ${input.category}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const completion = await groq.chat.completions.create({
      model: SMART_MODEL,
      temperature: 0.9,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const raw = stripFences(completion.choices[0]?.message?.content ?? "");
    try {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.title === "string" &&
        typeof parsed.shortDescription === "string" &&
        typeof parsed.fullDescription === "string"
      ) {
        return {
          title: parsed.title.slice(0, 120),
          shortDescription: parsed.shortDescription.slice(0, 200),
          fullDescription: parsed.fullDescription,
        };
      }
      console.error(
        `⚠️ AI generate attempt ${attempt}: JSON ok but wrong shape:`,
        raw.slice(0, 300)
      );
    } catch {
      console.error(
        `⚠️ AI generate attempt ${attempt}: unparseable output:`,
        raw.slice(0, 300)
      );
    }
  }
  throw new ApiError(502, "AI generation failed, please try again");
}

// ---------- Feature 2: Agentic Chat Concierge (streaming) ----------

async function extractFilters(lastUserMessage: string): Promise<ChatFilters> {
  const system = `Extract trip search filters from the user's message as JSON.
Allowed keys (all optional, omit if not mentioned):
- category: one of ${TRIP_CATEGORIES.join(", ")}
- maxPrice: number (BDT; interpret "under 30k"/"30 hazar" as 30000)
- minDays / maxDays: numbers
- destination: string (place name if mentioned)
Respond ONLY with a JSON object, no fences, no explanation. If nothing extractable, respond {}.`;

  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      temperature: 0,
      max_tokens: 150,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: lastUserMessage },
      ],
    });
    const parsed = JSON.parse(
      stripFences(completion.choices[0]?.message?.content ?? "{}")
    );
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {}; // extraction failure → fall back to top-rated trips
  }
}

function buildConciergeSystemPrompt(trips: unknown[]): string {
  return `You are TripPlanner's friendly travel concierge. Currency is BDT (৳).
Recommend ONLY from these real trips (JSON below). Never invent trips, prices, or details.
Link every trip you mention as a markdown link: [Trip Title](/trips/<_id>).
If nothing fits the request well, say so honestly and suggest the closest alternatives from the list.
Keep replies under 150 words. Be warm and concise.

AVAILABLE TRIPS:
${JSON.stringify(trips)}`;
}

/** Streams the reply as plain text chunks straight into the Express response. */
export async function chatStream(input: ChatInput, res: Response): Promise<void> {
  const history = input.messages.slice(-10);
  const lastUser = [...history].reverse().find((m) => m.role === "user");

  // Step 1: intent extraction (fast model)
  const filters = await extractFilters(lastUser?.content ?? "");

  // Step 2: tool use — fetch real trips from MongoDB
  const trips = await fetchTripsForChat(filters);

  // Step 3: grounded answer (smart model), streamed token by token
  const stream = await groq.chat.completions.create({
    model: SMART_MODEL,
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
    messages: [
      { role: "system", content: buildConciergeSystemPrompt(trips) },
      ...history,
    ],
  });

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no"); // prevent proxy buffering in production

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) res.write(token);
  }
  res.end();
}

/** Non-streaming fallback (kept for testing via Postman if ever needed). */
export async function chat(input: ChatInput): Promise<string> {
  const history = input.messages.slice(-10);
  const lastUser = [...history].reverse().find((m) => m.role === "user");

  const filters = await extractFilters(lastUser?.content ?? "");
  const trips = await fetchTripsForChat(filters);

  const completion = await groq.chat.completions.create({
    model: SMART_MODEL,
    temperature: 0.7,
    max_tokens: 500,
    messages: [
      { role: "system", content: buildConciergeSystemPrompt(trips) },
      ...history,
    ],
  });

  const reply = completion.choices[0]?.message?.content?.trim();
  if (!reply) throw new ApiError(502, "AI chat failed, please try again");
  return reply;
}