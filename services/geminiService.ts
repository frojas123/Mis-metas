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
];

const getFallbackImage = (text: string, random: boolean = false) => {
  if (random) {
    return LUXURY_FALLBACKS[Math.floor(Math.random() * LUXURY_FALLBACKS.length)];
  }
  // Simple hash to consistently pick the same fallback for the same title
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % LUXURY_FALLBACKS.length;
  return LUXURY_FALLBACKS[index];
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
 * @returns A base64 string of the image.
 */
export const generateWishImage = async (prompt: string, forceRegen: boolean = false): Promise<string> => {
  // Robust Safety check for API Key
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    console.error("API_KEY is missing or invalid in process.env");
    return getFallbackImage(prompt, forceRegen);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Step 1: Optimize prompt (Spanish -> English Visual Description)
    // This dramatically increases success rate on the image model
    const enhancedPrompt = await enhancePromptForImage(prompt, ai);
    
    console.log("Generando imagen con prompt:", enhancedPrompt);

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
    console.error("Error generating image:", error);
    // Return a dynamic fallback based on forceRegen so the button actually changes the image visually
    return getFallbackImage(prompt, forceRegen);
  }
};

/**
 * Generates a short action plan using Gemini Text model.
 */
export const generateActionPlan = async (title: string, amount: number): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    return "1. Configura tu API KEY correctamente.\n2. Verifica tu conexión.\n3. Disfruta visualizando tus metas.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
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