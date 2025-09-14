
// Vercel Edge Function: api/gemini.ts
// This function acts as a secure proxy to the Google Gemini API.

export const config = {
  runtime: 'edge', // Use the Edge runtime for optimal streaming performance
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key is not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the request body from the client-side call
    const clientRequestBody = await request.json();
    const { contents, config: modelConfig } = clientRequestBody;

    // Construct the request body for the actual Google API
    const googleApiRequestBody = {
      contents: contents,
      systemInstruction: modelConfig.systemInstruction,
      tools: modelConfig.tools,
    };

    const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

    const googleApiResponse = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleApiRequestBody),
    });

    // Check for errors from the Google API
    if (!googleApiResponse.ok) {
      const errorBody = await googleApiResponse.text();
      console.error("Google API Error:", errorBody);
      return new Response(JSON.stringify({ error: `Google API Error: ${googleApiResponse.statusText}`, details: errorBody }), {
        status: googleApiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the response body from the Google API directly to the client
    return new Response(googleApiResponse.body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error("Error in Gemini proxy function:", error);
    const message = error instanceof Error ? error.message : "An unknown server error occurred.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
