import Groq from "groq-sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const formData = await req.formData();
  const audio = formData.get("audio") as File;

  if (!audio) return Response.json({ error: "No audio" }, { status: 400 });

  const transcription = await client.audio.transcriptions.create({
    file: audio,
    model: "whisper-large-v3-turbo",
    language: "es",
    response_format: "text",
  });

  return Response.json({ text: transcription });
}
