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

// Safe access to process.env to prevent crashes in browsers where process is undefined
const getApiKey = (): string | undefined => {
  try {
    // @ts-ignore - process might not be defined in all browser builds
    if (typeof process !== 'undefined' && process.env) {
       // @ts-ignore
       return process.env.API_KEY;
    }
  } catch (e) {
    return undefined;
  }
  return undefined;
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
  // 1. Safe API Key Check
  const apiKey = getApiKey();
  const isValidKey = apiKey && apiKey !== 'undefined' && apiKey.trim().length > 20;

  if (!isValidKey) {
    console.log("Modo Offline: Usando imagen de respaldo de lujo.");
    return getFallbackImage(prompt, forceRegen);
  }

  // 2. Try Generation with Safe Failover
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });
    
    // Step 1: Optimize prompt (Spanish -> English Visual Description)
    const enhancedPrompt = await enhancePromptForImage(prompt, ai);
    
    console.log("Generando imagen con IA...");

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
    console.error("Error en generación de imagen (usando respaldo):", error);
    // Return a dynamic fallback so the user always sees an image
    return getFallbackImage(prompt, forceRegen);
  }
};

/**
 * Generates a short action plan using Gemini Text model.
 */
export const generateActionPlan = async (title: string, amount: number): Promise<string> => {
  const apiKey = getApiKey();
  const isValidKey = apiKey && apiKey !== 'undefined' && apiKey.trim().length > 20;

  if (!isValidKey) {
    return "1. Define tu objetivo con claridad absoluta.\n2. Ahorra e invierte el 20% de tus ingresos consistentemente.\n3. Visualiza el éxito diariamente y actúa como si ya fuera tuyo.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });
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