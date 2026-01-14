import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return Response.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
        }

        // Since Vercel AI SDK doesn't support Whisper directly yet in a unified way (it's model specific),
        // and maintaining a direct OpenAI call is safer for now. 
        // However, if we want to use the SDK for consistency, we'd check if 'generateText' supports audio input for GPT-4o-audio or use the 'transcribe' method if available.
        // The current @ai-sdk/openai usually wraps chat. 
        // Let's us direct fetch to OpenAI API for transcription as it's most reliable for Whisper V2.

        // We need to buffer the file
        const buffer = Buffer.from(await file.arrayBuffer());

        // Construct a new FormData for the upstream request
        const upstreamFormData = new FormData();
        // We need to append the file with a filename so OpenAI knows it's an audio file
        const blob = new Blob([buffer], { type: file.type });
        upstreamFormData.append("file", blob, "audio.webm");
        upstreamFormData.append("model", "whisper-1");
        upstreamFormData.append("language", "pt"); // Force Portuguese

        const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: upstreamFormData as any // Node fetch vs DOM fetch types mismatch
        });

        if (!res.ok) {
            const err = await res.json();
            console.error("OpenAI Whisper Error", err);
            throw new Error("Falha na transcrição");
        }

        const data = await res.json();
        return Response.json({ text: data.text });

    } catch (error) {
        console.error("Transcribe Error", error);
        return Response.json({ error: "Erro ao transcrever áudio." }, { status: 500 });
    }
}
