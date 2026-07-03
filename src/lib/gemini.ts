import { GoogleGenAI, GenerateContentConfig } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

interface GenerateOptions {
  model?: string;
  contents: string;
  config?: GenerateContentConfig;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Robust wrapper for ai.models.generateContent.
 */
export async function generateGeminiContent(options: GenerateOptions) {
  // Use the provided model as primary, fallback to gemini-2.5-flash
  const primaryModel = options.model || "gemini-2.5-flash";
  const fallbackModel = "gemini-2.5-flash";
  const maxRetries = 3;

  const executeWithRetry = async (modelName: string) => {
    let lastError: unknown = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: options.config,
        });
      } catch (error) {
        lastError = error;
        const err = error as { status?: number; message?: string };
        
        // Determine if error is temporary (503 Service Unavailable or 429 Rate Limit)
        const isTemporary =
          err.status === 503 ||
          err.status === 429 ||
          (err.message && (
            err.message.includes("503") || 
            err.message.includes("429") || 
            err.message.includes("high demand") || 
            err.message.includes("temporary") ||
            err.message.includes("quota") ||
            err.message.includes("RESOURCE_EXHAUSTED")
          ));
        
        if (isTemporary && attempt < maxRetries) {
          const waitTime = attempt * 1500; // 1.5s, 3s, 4.5s backoff
          console.warn(
            `Model ${modelName} encountered temporary limit/load (attempt ${attempt}/${maxRetries}). Retrying in ${waitTime}ms...`
          );
          await delay(waitTime);
        } else {
          // Permanent errors (like 404) or exhausted retries: throw
          throw error;
        }
      }
    }
    
    throw lastError;
  };

  try {
    return await executeWithRetry(primaryModel);
  } catch (primaryError) {
    console.warn(
      `Primary model ${primaryModel} failed. Swapping to fallback model ${fallbackModel}...`
    );
    
    try {
      return await executeWithRetry(fallbackModel);
    } catch (fallbackError) {
      const fallbackErr = fallbackError as { message?: string };
      console.error(
        `Fallback model ${fallbackModel} also failed:`,
        fallbackErr.message || fallbackError
      );
      throw primaryError; // Throw original primary error if fallback also fails
    }
  }
}