import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.TOPE_API_KEY });

async function testDeepThinking() {
  try {
    console.log("Testing Deep Thinking with Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Explain how a mechanical watch works step by step.",
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });
    
    const parts = response.candidates?.[0]?.content?.parts || [];
    const thought = parts.filter(p => p.thought).map(p => p.text).join('\n');
    const text = parts.filter(p => !p.thought && p.text).map(p => p.text).join('\n') || response.text;
    
    console.log("\n--- THOUGHT PROCESS ---");
    console.log(thought || "No thought process returned.");
    console.log("\n--- FINAL RESPONSE ---");
    console.log(text);
  } catch (error) {
    console.error("Error testing deep thinking:", error);
  }
}

testDeepThinking();
