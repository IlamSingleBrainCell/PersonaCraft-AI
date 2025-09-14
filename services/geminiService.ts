
import type { ChatMessageFile, Source } from '../types';

const SUGGESTED_QUESTIONS_PROMPT = "\n\nAfter your main response, provide up to 3 relevant follow-up questions that the user might have. Format each question on a new line, prefixed with 'SUGGESTION:'.";


/**
 * Streams a message to the Gemini API via a secure backend proxy.
 *
 * @param prompt The user's text prompt.
 * @param systemInstruction The system instruction for the selected persona.
 * @param useWebSearch Whether to enable Google Search grounding.
 * @param files An array of files to include in the message.
 * @returns An async generator that yields chunks of the response.
 */
export async function* streamMessageToGemini(
    prompt: string,
    systemInstruction: string,
    useWebSearch: boolean,
    files?: ChatMessageFile[]
): AsyncGenerator<{ text: string; sources?: Source[] }> {
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

        const payload = {
            contents: { parts },
            config: {
                systemInstruction: systemInstruction + SUGGESTED_QUESTIONS_PROMPT,
                tools: useWebSearch ? [{ googleSearch: {} }] : undefined,
            }
        };

        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
        }

        // The backend proxy streams the raw response from the Google API.
        // We need to parse this stream of JSON objects on the client.
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            buffer += decoder.decode(value, { stream: true });

            // The stream from Google is a series of JSON objects. They are not newline-delimited.
            // We need to find the boundaries of each JSON object. A simple way is to track braces.
            // This is a simplified parser and assumes no braces '{' or '}' appear in string content.
            let braceCount = 0;
            let objectStartIndex = -1;
            
            for (let i = 0; i < buffer.length; i++) {
                const char = buffer[i];

                if (objectStartIndex === -1 && char === '{') {
                    objectStartIndex = i;
                    braceCount = 1;
                } else if (objectStartIndex !== -1) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                    }
                }

                if (objectStartIndex !== -1 && braceCount === 0) {
                    const jsonStr = buffer.substring(objectStartIndex, i + 1);
                    try {
                        const chunkData = JSON.parse(jsonStr);
                        const text = chunkData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                        const sourcesData = chunkData.candidates?.[0]?.groundingMetadata?.groundingChunks;
                        
                        const sources: Source[] = [];
                        if (sourcesData) {
                            for (const source of sourcesData) {
                                if (source.web) {
                                    sources.push({
                                        uri: source.web.uri,
                                        title: source.web.title,
                                    });
                                }
                            }
                        }
                        
                        yield { text, sources: sources.length > 0 ? sources : undefined };
                    } catch (e) {
                        console.warn("Failed to parse JSON chunk from stream:", e, "Chunk:", jsonStr);
                    }
                    
                    buffer = buffer.substring(i + 1);
                    i = -1; // Reset index to restart scan from the beginning of the new buffer
                    objectStartIndex = -1;
                }
            }
        }

    } catch (error) {
        console.error("Error calling Gemini API proxy:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        yield { text: `Error: ${errorMessage}` };
    }
}
