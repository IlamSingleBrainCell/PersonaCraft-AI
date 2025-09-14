
import { GoogleGenAI } from "@google/genai";
import type { ChatMessageFile, Source } from '../types';

const SUGGESTED_QUESTIONS_PROMPT = "\n\nAfter your main response, provide up to 3 relevant follow-up questions that the user might have. Format each question on a new line, prefixed with 'SUGGESTION:'.";

let genAI: GoogleGenAI | null = null;

function ensureAiClient(): GoogleGenAI | null {
    if (genAI) {
        return genAI;
    }

    let apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey) {
        const userInput = prompt("Please enter your Google Gemini API Key. You can get a new key from Google AI Studio.");
        if (userInput && userInput.trim()) {
            apiKey = userInput.trim();
            localStorage.setItem('gemini_api_key', apiKey);
        } else {
            apiKey = null;
        }
    }

    if (apiKey) {
        try {
            // This can throw if the key is structurally invalid, although unlikely for a string.
            genAI = new GoogleGenAI({ apiKey });
            return genAI;
        } catch (e) {
            console.error("Failed to initialize GoogleGenAI:", e);
            // Clear the bad key so the user is prompted again on refresh.
            localStorage.removeItem('gemini_api_key');
            return null;
        }
    }

    return null;
}

export async function* streamMessageToGemini(
    prompt: string,
    systemInstruction: string,
    useWebSearch: boolean,
    files?: ChatMessageFile[]
): AsyncGenerator<{ text: string; sources?: Source[] }> {
    const ai = ensureAiClient();
    if (!ai) {
        yield { text: "Error: Gemini client could not be initialized. This is likely due to a missing or invalid API key. Please refresh the page and provide a valid key when prompted." };
        return;
    }
    
    try {
        const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{ text: prompt }];

        if (files && files.length > 0) {
            for (const file of files) {
                 const base64Data = file.data.split(',')[1];
                 parts.unshift({
                    inlineData: {
                        mimeType: file.type,
                        data: base64Data,
                    },
                });
            }
        }

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: systemInstruction + SUGGESTED_QUESTIONS_PROMPT,
                tools: useWebSearch ? [{ googleSearch: {} }] : undefined,
            },
        });

        for await (const chunk of responseStream) {
            const sources: Source[] = [];
            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;

            if (groundingMetadata?.groundingChunks) {
                for (const source of groundingMetadata.groundingChunks) {
                    if (source.web) {
                        sources.push({
                            uri: source.web.uri,
                            title: source.web.title,
                        });
                    }
                }
            }

            yield { text: chunk.text, sources: sources.length > 0 ? sources : undefined };
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        let errorMessage = "An unknown error occurred.";
        if (error instanceof Error) {
            errorMessage = error.message;
            if (errorMessage.includes('API key not valid')) {
                errorMessage = "Your API key is not valid. Please clear the stored key and try again.";
                // Clear the bad key so the user can re-enter it on refresh
                localStorage.removeItem('gemini_api_key');
            }
        }
        yield { text: `Error: ${errorMessage}` };
    }
};
