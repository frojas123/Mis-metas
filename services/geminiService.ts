import { GoogleGenAI } from "@google/genai";

// Curated luxury fallbacks in case AI fails, ensuring variety
const LUXURY_FALLBACKS = [
  "https://images.unsplash.com/photo-1565514020176-db79339a6a5d?q=80&w=1000&auto=format&fit=crop", // Luxury Villa
  "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=1000&auto=format&fit=crop", // Supercar
  "https://images.unsplash.com/photo-1551189689-58cb487f55b9?q=80&w=1000&auto=format&fit=crop", // Luxury Interior
  "https://images.unsplash.com/photo-1622627958569-8d7d91e84605?q=80&w=1000&auto=format&fit=crop", // Gold/Abstract
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop", // Resort
  "https://images.unsplash.com/photo-1542259659-579584a26ee9?q=80&w=1000&auto=format&fit=crop", // Yacht vibe
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop", // Modern Interior Dark
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1000&auto=format&fit=crop", // Elegant House
  "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1000&auto=format&fit=crop", // Garden Patio
  "https://images.unsplash.com/photo-1583847668182-f8759530598b?q=80&w=1000&auto=format&fit=crop", // Cinematic Car
  "https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?q=80&w=1000&auto=format&fit=crop", // Private Jet
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop", // Luxury Real Estate
  "https://images.unsplash.com/photo-1631679706909-1844bbd07221?q=80&w=1000&auto=format&fit=crop", // Modern Furniture
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop", // Abstract Gold
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=1000&auto=format&fit=crop", // Living Room
];

const getFallbackImage = (text: string, random: boolean = false) => {
  if (random) {
    const url = LUXURY_FALLBACKS[Math.floor(Math.random() * LUXURY_FALLBACKS.length)];
    // Append a random cache-buster param to ensure React sees it as a new URL even if it picks the same base image
    return `${url}&v=${Date.now()}`;
  }
  
  // Simple hash to consistently pick the same fallback for the same title
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LUXURY_FALLBACKS.length;
  return LUXURY_FALLBACKS[index];
};

// Simplified API Key access to work with bundlers (Netlify/Vite/CRA)
// We access process.env.API_KEY directly so the build tool can replace it with the string literal.
const getApiKey = (): string | undefined => {
  try {
    // @ts-ignore
    return process.env.API_KEY;
  } catch (e) {
    // If process is undefined and not replaced by bundler, return undefined
    return undefined;
  }
};

/**
 * Helper to translate and enhance the prompt using a text model first.
 * Image models struggle with non-English complex instructions.
 */
const enhancePromptForImage = async (userPrompt: string, ai: GoogleGenAI): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          text: `Translate the following desire into a high-quality, English text-to-image prompt. 
          Keep it visual, describing lighting, luxury materials, and atmosphere. 
          Input: "${userPrompt}". 
          Output ONLY the English prompt string, no explanations.`
        }]
      }
    });
    return response.text?.trim() || userPrompt;
  } catch (e) {
    console.warn("Prompt enhancement failed, using raw prompt", e);
    return userPrompt;
  }
}

/**
 * Generates an image based on the wish description using Gemini 2.5 Flash Image.
 * @param prompt The description of the wish.
 * @param forceRegen If true, allows returning a random fallback if API fails, to ensure visual change.
 * @returns A base64 string of the image or a fallback URL.
 */
export const generateWishImage = async (prompt: string, forceRegen: boolean = false): Promise<string> => {
  // 1. Get Key directly
  const apiKey = getApiKey();
  
  // Basic validation just to avoid empty string crashes, but trust the env mostly
  if (!apiKey || apiKey === 'undefined') {
    console.log("No API Key found in process.env.API_KEY. Using fallback.");
    return getFallbackImage(prompt, forceRegen);
  }

  // 2. Try Generation
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Step 1: Optimize prompt (Spanish -> English Visual Description)
    // We wrap this in a sub-try/catch so if the text model fails, we still try the image model with raw prompt
    let enhancedPrompt = prompt;
    try {
        enhancedPrompt = await enhancePromptForImage(prompt, ai);
    } catch (err) {
        console.warn("Text enhancement skipped:", err);
    }
    
    console.log("Generando imagen con IA (Gemini 2.5)...");

    // Step 2: Generate Image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `${enhancedPrompt}, photorealistic, 4k, cinematic lighting, luxury style, masterpiece, 1:1 aspect ratio`,
          },
        ],
      },
    });

    // Check for inline data (the image)
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    console.warn("Gemini produced no image data, using fallback.");
    return getFallbackImage(prompt, forceRegen);

  } catch (error) {
    console.error("Error API Gemini (usando respaldo):", error);
    return getFallbackImage(prompt, forceRegen);
  }
};

/**
 * Generates a short action plan using Gemini Text model.
 */
export const generateActionPlan = async (title: string, amount: number): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === 'undefined') {
    return "1. Define tu objetivo con claridad absoluta.\n2. Ahorra e invierte el 20% de tus ingresos consistentemente.\n3. Visualiza el éxito diariamente y actúa como si ya fuera tuyo.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          text: `Actúa como un asesor financiero de millonarios. Crea un plan de acción de EXACTAMENTE 3 pasos breves, estratégicos y motivadores para conseguir: "${title}" que cuesta $${amount}. Formato lista numerada. Tono: sofisticado, directo y empoderador. Max 40 palabras por paso. Responde ÚNICAMENTE en español.`
        }]
      }
    });
    
    return response.text || "No se pudo generar el plan.";
  } catch (error) {
    console.error("Error generating plan:", error);
    return "1. Define tu objetivo con claridad absoluta.\n2. Ahorra e invierte el 20% de tus ingresos consistentemente.\n3. Visualiza el éxito diariamente y actúa como si ya fuera tuyo.";
  }
};