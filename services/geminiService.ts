
import { GoogleGenAI } from "@google/genai";
import type { ChatMessageFile, Source } from '../types';

const SUGGESTED_QUESTIONS_PROMPT = "\n\nAfter your main response, provide up to 3 relevant follow-up questions that the user might have. Format each question on a new line, prefixed with 'SUGGESTION:'.";

let genAI: GoogleGenAI | null = null;
let initError: string | null = null;

// Initialize the client once. It is required that process.env.API_KEY is available in the execution environment.
try {
    // This will throw a ReferenceError if 'process' is not defined in the environment,
    // which indicates a build/deployment configuration issue.
    // The GoogleGenAI constructor will throw an error if the API key is missing or invalid.
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
} catch (e) {
    console.error("Failed to initialize GoogleGenAI:", e);
    const message = e instanceof Error ? e.message : "An unknown error occurred during initialization.";

    if (e instanceof ReferenceError && message.includes("process is not defined")) {
         initError = "Error: The application environment is not configured to access the API key. Please ensure `process.env.API_KEY` is available in your deployment environment.";
    } else if (message.includes('API key not valid')) {
        initError = 'Error: The provided API key is invalid. Please check your environment variable.';
    } else {
        // This will catch cases where the API key is missing from process.env, etc.
        initError = "Error: API_KEY environment variable is not set or invalid. Please follow the setup instructions to provide a valid API key.";
    }
}


export async function* streamMessageToGemini(
    prompt: string,
    systemInstruction: string,
    useWebSearch: boolean,
    files?: ChatMessageFile[]
): AsyncGenerator<{ text: string; sources?: Source[] }> {
    if (!genAI || initError) {
        yield { text: initError ?? "An unknown initialization error occurred." };
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

        const responseStream = await genAI.models.generateContentStream({
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
                errorMessage = "Your API key is not valid. Please check your environment variable.";
            }
        }
        yield { text: `Error: ${errorMessage}` };
    }
};
