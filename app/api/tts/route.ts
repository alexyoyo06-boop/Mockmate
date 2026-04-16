import { NextRequest } from "next/server";

const VOICE_CONFIG: Record<string, { voice: string; instructions: string }> = {
  alex: {
    voice: "onyx",
    instructions: "Speak in Spanish from Spain. Deep, serious, professional tone. Direct and assertive. No warmth, just precision.",
  },
  pau: {
    voice: "ash",
    instructions: "Speak in Spanish from Spain. Warm, friendly, relaxed and casual tone. Sound like a cool tech lead talking to a colleague, approachable and natural.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { text, interviewer } = await req.json();
    if (!text) return Response.json({ error: "No text" }, { status: 400 });

    const config = VOICE_CONFIG[interviewer] ?? VOICE_CONFIG.alex;
    const clean = text.replace(/[*_#`]/g, "").slice(0, 4096);

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: clean,
        voice: config.voice,
        instructions: config.instructions,
        speed: 1.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI TTS error:", err);
      return Response.json({ error: err }, { status: res.status });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("TTS route error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
