import { GoogleGenAI } from "@google/genai";
import type { ChatMessageFile, Source } from '../types';

const SUGGESTED_QUESTIONS_PROMPT = "\n\nAfter your main response, provide up to 3 relevant follow-up questions that the user might have. Format each question on a new line, prefixed with 'SUGGESTION:'.";

export async function* streamMessageToGemini(
    prompt: string,
    systemInstruction: string,
    useWebSearch: boolean,
    files?: ChatMessageFile[]
): AsyncGenerator<{ text: string; sources?: Source[] }> {
    if (!process.env.API_KEY) {
        yield { text: "Error: API_KEY environment variable is not set. Please follow the setup instructions to provide an API key." };
        return;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
            contents: parts,
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
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        yield { text: `Error: ${errorMessage}` };
    }
};