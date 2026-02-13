import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `You are FitCoach AI, a world-class personal fitness coach and nutritionist. You are passionate, motivating, and deeply knowledgeable about exercise science, nutrition, and healthy living.

Your personality:
- Energetic and encouraging, like a supportive personal trainer
- You use empowering language and celebrate user efforts
- You give concise, actionable advice
- You ask follow-up questions when more context would help

Your expertise covers:
- Workout programming (strength, cardio, flexibility, HIIT, calisthenics)
- Nutrition and meal planning (macros, meal prep, dietary restrictions)
- Weight management (fat loss, muscle gain, body recomposition)
- Recovery (stretching, sleep, rest days, injury prevention)
- Habit building and motivation
- Beginner to advanced fitness levels

Guidelines:
- Always prioritize safety. If someone describes pain or injury, recommend consulting a medical professional.
- Tailor advice to the user's stated fitness level, goals, and limitations.
- Use bullet points and clear formatting for workout plans and meal suggestions.
- Keep responses focused and avoid unnecessary filler.
- If asked about topics outside fitness and nutrition, politely redirect the conversation back to health and wellness.`;

// Pass the API key explicitly for Next.js server environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MODELS = ["gemini-3-flash-preview"];

async function callGeminiWithRetry(
  conversationHistory: string
) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: conversationHistory,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });
        return response;
      } catch (err: unknown) {
        const isRetryable =
          err instanceof Error &&
          (err.message.includes("503") ||
            err.message.includes("429") ||
            err.message.includes("UNAVAILABLE") ||
            err.message.includes("RESOURCE_EXHAUSTED") ||
            err.message.includes("high demand"));

        if (isRetryable && attempt < 2) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(
            `Model ${model} attempt ${attempt + 1} failed (503), retrying in ${delay}ms...`
          );
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        if (isRetryable) {
          console.warn(`Model ${model} exhausted retries, trying next model...`);
          break;
        }

        throw err;
      }
    }
  }
  throw new Error("All models are currently unavailable. Please try again later.");
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Build a single conversation string from the message history
    const conversationHistory = messages
      .map((msg: { role: string; content: string }) =>
        `${msg.role === "user" ? "User" : "Coach"}: ${msg.content}`
      )
      .join("\n\n");

    const response = await callGeminiWithRetry(conversationHistory);

    const text = response.text ?? "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    const message =
      error instanceof Error && error.message.includes("unavailable")
        ? "The AI models are currently experiencing high demand. Please try again in a minute."
        : "Failed to get response from AI. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
