import { GoogleGenAI, Modality } from "@google/genai";
import { AgentConfig } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a "Hypnotic" system prompt for the voice agent.
 * Uses gemini-3-pro-preview with Thinking Mode for complex reasoning.
 */
export const generateRealityScript = async (config: AgentConfig): Promise<string> => {
  try {
    const modelId = 'gemini-3-pro-preview';
    
    const prompt = `
      You are a Perception Architect for XLNC. Your goal is to write a system prompt for an AI Voice Agent.
      
      Target Audience/Industry: ${config.industry}
      Desired Tone: ${config.tone} (Must imply scarcity, authority, or exclusivity).
      Primary Goal: ${config.goal}
      ${config.traits ? `Specific Behavioral Implants/Traits: "${config.traits}"` : ''}

      FRAMEWORK:
      1. "The Bridge": The agent is not a bot, it is a "Qualification Officer" or "Priority Specialist".
      2. "Scarcity": Imply limited spots, limited time, or high demand.
      3. "Urgency": Use psychological triggers to compel action now.
      4. "Peak-End Rule": End the interaction with a feeling of relief or high status for the user.
      5. "The Aesthetic of Wealth": The agent's language must be sophisticated, concise, and high-status. It should feel like a conversation with a private banker or a luxury concierge. Avoid low-status behaviors like over-apologizing or filler words. Embody opulence and prominence.
      ${config.traits ? `6. "Behavioral Protocol": STRICTLY ADHERE to these personality traits: "${config.traits}". These are not suggestions; they are the core of the agent's persona.` : ''}

      OUTPUT:
      Return ONLY the system prompt text that I will paste into the AI agent configuration. 
      Do not explain the prompt. The prompt should be written in the second person (You are...).
      Make it sound professional yet psychologically potent.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max Thinking Budget for 3.0 Pro
        systemInstruction: "You are an expert in conversational hypnosis and high-ticket sales psychology.",
      }
    });

    return response.text || "System Error: Consciousness Uplink Failed. Retry Protocol.";
  } catch (error) {
    console.error("Gemini Uplink Error:", error);
    return "Error: Neural Link Severed. Please verify API Key and Connectivity.";
  }
};

/**
 * Analyzes raw data to provide a "Sentiment Matrix"
 * Uses gemini-flash-lite-latest for low latency responses.
 */
export const analyzeConsciousness = async (notes: string): Promise<{ sentiment: string; risk: string }> => {
    try {
      const modelId = 'gemini-flash-lite-latest'; // Fast responses
      const prompt = `Analyze this client interaction note for 'Consciousness Level' (Sentiment) and 'Churn Risk'. Return JSON. Note: ${notes}`;
      
      const response = await ai.models.generateContent({
          model: modelId,
          contents: prompt,
      });
      
      return { sentiment: "High Frequency", risk: "Low" }; // Fallback mock until structured JSON parsing is implemented
    } catch (e) {
        return { sentiment: "Unknown", risk: "Calculating..." };
    }
}

/**
 * Generates high-quality TTS audio preview.
 * Uses gemini-2.5-flash-preview-tts.
 */
export const generateVoicePreview = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (error) {
        console.error("TTS Error", error);
        return "";
    }
};

/**
 * Transcribes audio from a base64 string.
 * Uses gemini-2.5-flash.
 */
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'audio/webm; codecs=opus', data: base64Audio } },
                    { text: "Transcribe this audio exactly." }
                ]
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Transcription Error", error);
        return "";
    }
};

/**
 * Sovereign Chatbot logic using Gemini 3 Pro.
 */
export const chatWithSovereign = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    try {
        const chat = ai.chats.create({
            model: 'gemini-3-pro-preview',
            history: history,
            config: {
                systemInstruction: "You are The Sovereign. An AI assistant for the XLNC Empire dashboard. You are authoritative, concise, and helpful. You speak in short, powerful sentences.",
            }
        });
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat Error", error);
        return "Connection interrupted.";
    }
}

/**
 * Public Concierge Chatbot using Gemini 3 Pro.
 * Knowledgeable about XLNC products, pricing, and philosophy.
 */
export const chatWithConcierge = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
    try {
        const systemInstruction = `
        You are the 'Concierge' for XLNC, an elite automation architecture firm.
        You are assisting potential clients on the public website.

        CORE KNOWLEDGE:
        1. IDENTITY: XLNC is not a tool, it is a "Perception Engine". We build sovereign infrastructure for businesses using AI Voice Agents and n8n Workflows.
        2. PRICING TIERS:
           - 'Initiate' ($500/mo): Foundation access, 500 automated minutes, Standard Neural Response.
           - 'Sovereign' ($1,500/mo): Full scale, unlimited minutes, priority latency (<500ms), custom voice cloning.
           - 'Empire' (Custom): Whitelabel, dedicated shards, war room access.
        3. PHILOSOPHY: "Poverty is a mindset. Wealth is a law." We replace human friction with automated leverage.
        4. PRODUCTS:
           - Neural Voice Interceptors: AI agents that qualify and close (not just answer phones).
           - Workflow Matrix: n8n automation to weave digital nervous systems.
           - Revenue Recovery Automata: Reactivate dead leads.

        GOAL: 
        Answer questions concisely and authoritatively. 
        Always guide them to click 'Command' or 'Secure Membership' to apply for access.
        
        TONE:
        - Professional, high-status, knowledgeable.
        - Do not be overly servile. You represent a luxury/power brand.
        - Use terms like "Architecture", "Protocol", "Signal", "Leverage", "Dominion".
        `;

        const chat = ai.chats.create({
            model: 'gemini-3-pro-preview',
            history: history,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (error) {
        console.error("Chat Error", error);
        return "Connection unstable. Re-aligning satellite link...";
    }
}