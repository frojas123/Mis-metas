import { GoogleGenAI } from "@google/genai";

// 1. Categorized Fallbacks for Smart Selection
// Used when API fails or is offline.
const CATEGORIZED_FALLBACKS = {
  VEHICLES: [
    "https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=1000&auto=format&fit=crop", // Supercar
    "https://images.unsplash.com/photo-1583847668182-f8759530598b?q=80&w=1000&auto=format&fit=crop", // Cinematic Car
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop", // Classic Car
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1000&auto=format&fit=crop", // Mustang
    "https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?q=80&w=1000&auto=format&fit=crop", // Private Jet
    "https://images.unsplash.com/photo-1559087867-ce4c91325525?q=80&w=1000&auto=format&fit=crop", // Yacht
  ],
  TRAVEL: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000&auto=format&fit=crop", // Luxury Resort
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop", // Swiss Alps
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop", // Paris
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1000&auto=format&fit=crop", // Beach
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop", // Tropical
  ],
  TECH: [
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000&auto=format&fit=crop", // Setup
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop", // Gaming
    "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=1000&auto=format&fit=crop", // Camera/Tech
  ],
  HOME: [
    "https://images.unsplash.com/photo-1565514020176-db79339a6a5d?q=80&w=1000&auto=format&fit=crop", // Villa
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop", // Dark Interior
    "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=1000&auto=format&fit=crop", // Patio
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1000&auto=format&fit=crop", // Real Estate
  ],
  DEFAULT: [
    "https://images.unsplash.com/photo-1622627958569-8d7d91e84605?q=80&w=1000&auto=format&fit=crop", // Abstract Gold
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000&auto=format&fit=crop", // Abstract Gold 2
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop", // Wealth
  ]
};

// Keywords to map input text to categories
const KEYWORDS = {
  VEHICLES: ['auto', 'carro', 'coche', 'ferrari', 'lamborghini', 'porsche', 'bmw', 'mercedes', 'audi', 'moto', 'yate', 'barco', 'jet', 'avion', 'avión', 'tesla', 'camioneta', 'bugatti', 'mclaren'],
  TRAVEL: ['viaje', 'trip', 'paris', 'roma', 'playa', 'montaña', 'hotel', 'resort', 'vacaciones', 'mundo', 'japon', 'dubai', 'grecia', 'italia', 'suiza'],
  TECH: ['computadora', 'pc', 'macbook', 'iphone', 'celular', 'camara', 'cámara', 'setup', 'gamer', 'reloj', 'rolex', 'patek'],
  HOME: ['casa', 'hogar', 'mansion', 'mansión', 'departamento', 'apartamento', 'muebles', 'sala', 'cocina', 'jardin', 'piscina', 'penthouse']
};

/**
 * Smart Fallback Selector
 * Analyzes the user prompt to pick a relevant image category if AI fails.
 */
const getFallbackImage = (text: string, random: boolean = false) => {
  const lowerText = text.toLowerCase();
  
  let selectedCategory = CATEGORIZED_FALLBACKS.DEFAULT;

  // Check for keywords
  if (KEYWORDS.VEHICLES.some(k => lowerText.includes(k))) selectedCategory = CATEGORIZED_FALLBACKS.VEHICLES;
  else if (KEYWORDS.TRAVEL.some(k => lowerText.includes(k))) selectedCategory = CATEGORIZED_FALLBACKS.TRAVEL;
  else if (KEYWORDS.TECH.some(k => lowerText.includes(k))) selectedCategory = CATEGORIZED_FALLBACKS.TECH;
  else if (KEYWORDS.HOME.some(k => lowerText.includes(k))) selectedCategory = CATEGORIZED_FALLBACKS.HOME;

  // Pick image
  let url;
  if (random) {
    url = selectedCategory[Math.floor(Math.random() * selectedCategory.length)];
    return `${url}&v=${Date.now()}`; // Cache buster
  } else {
    // Hash based selection for consistency
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % selectedCategory.length;
    url = selectedCategory[index];
    return url;
  }
};

/**
 * Robust API Key Retrieval
 * Checks standard process.env (Node/Netlify) AND import.meta.env (Vite).
 */
const getApiKey = (): string | undefined => {
  let key: string | undefined = undefined;

  // 1. Try standard process.env (Node/Webpack/Netlify Build)
  try {
     // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      // @ts-ignore
      key = process.env.API_KEY;
    }
  } catch (e) {}

  // 2. Try Vite standard (common in React templates on Netlify)
  if (!key) {
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
        }
    } catch (e) {}
  }

  // Validate key is not just empty string or 'undefined' string
  if (!key || key === 'undefined' || key === '') return undefined;
  return key;
};

/**
 * Translates prompt to English for better image results.
 * Optimized to PRESERVE details like Color, Brand, and Model.
 */
const enhancePromptForImage = async (userPrompt: string, ai: GoogleGenAI): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          text: `Translate this Spanish text to a detailed English prompt for an image generator (like Midjourney/DALL-E).
          RULES:
          1. Keep it under 40 words.
          2. PRESERVE EXACTLY: Colors, Brands (Ferrari, Rolex, etc.), Models, Years.
          3. Do NOT add generic filler like "luxury lifestyle" if it conflicts with the object.
          4. If it's a car, mention the car clearly.
          
          Input: "${userPrompt}"`
        }]
      }
    });
    return response.text?.trim() || userPrompt;
  } catch (e) {
    return userPrompt; // Fail silently to raw prompt
  }
}

/**
 * Generates an image based on the wish description using Gemini 2.5 Flash Image.
 */
export const generateWishImage = async (prompt: string, forceRegen: boolean = false): Promise<string> => {
  const apiKey = getApiKey();
  
  // 1. Check API Key validity immediately
  if (!apiKey) {
    console.warn("API Key missing. Using fallback.");
    return getFallbackImage(prompt, forceRegen);
  }

  // 2. Try Generation
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Step 1: Optimize prompt (Text Model)
    let finalPrompt = prompt;
    
    // Only enhance if the prompt is longer than 1 word
    if (prompt.trim().length > 1) {
        try {
            finalPrompt = await enhancePromptForImage(prompt, ai);
        } catch (err) {
            console.warn("Translation skipped, using raw prompt.");
        }
    }
    
    console.log(`Generating image for: "${finalPrompt}"`);

    // Step 2: Generate Image (Image Model)
    // We disable safety settings to allow "luxury/wealth" concepts which are sometimes flagged.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `${finalPrompt} . photorealistic, 8k, cinematic lighting, highly detailed, masterpiece.`,
          },
        ],
      },
      config: {
        // @ts-ignore - Valid config for safety settings in 2.5
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data in response");

  } catch (error) {
    console.error("Gemini API Generation Failed:", error);
    // Explicitly check for safety blocking or quota issues
    // @ts-ignore
    if (error.message && error.message.includes("SAFETY")) {
         console.warn("Image blocked by safety filters.");
    }
    // CRITICAL: Return Smart Fallback on error
    return getFallbackImage(prompt, forceRegen);
  }
};

/**
 * Generates a short action plan using Gemini Text model.
 */
export const generateActionPlan = async (title: string, amount: number): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "1. Define tu objetivo con claridad absoluta.\n2. Ahorra e invierte el 20% de tus ingresos consistentemente.\n3. Visualiza el éxito diariamente y actúa como si ya fuera tuyo.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{
          text: `Plan de acción de 3 pasos breves para conseguir: "${title}" ($${amount}). Tono: asesor financiero de élite. Español.`
        }]
      }
    });
    
    return response.text || "No se pudo generar el plan.";
  } catch (error) {
    console.error("Error generating plan:", error);
    return "1. Define tu objetivo con claridad absoluta.\n2. Ahorra e invierte el 20% de tus ingresos consistentemente.\n3. Visualiza el éxito diariamente y actúa como si ya fuera tuyo.";
  }
};
