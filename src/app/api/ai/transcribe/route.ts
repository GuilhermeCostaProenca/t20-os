import { openai } from "@/lib/ai/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Missing file" }, { status: 400 });
        }

        // Convert keys validation if needed, but SDK handles File usually
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: "pt", // Optimized for Portuguese T20
            prompt: "RPG de Mesa, Tormenta 20. Termos: Lefou, Arton, Tibar, PV, PM, Defesa, Perícia.", // Hinting context
        });

        return NextResponse.json({ text: transcription.text });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }
}
