import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createGoogleAIService } from "@/lib/ai/google-ai-service";
import { elevenLabsService } from "@/lib/elevenlabs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 1. Gather Context (Crops, Weather, etc.)
    const crops = await prisma.crop.findMany({
      where: { userId, status: "PLANTED" },
      take: 5,
    });

    // Placeholder for weather - in real app would fetch from service
    const weather = undefined;

    const aiService = createGoogleAIService();
    if (!aiService) {
      return NextResponse.json(
        { error: "AI Service unavailable" },
        { status: 503 }
      );
    }

    // 2. Get Text Response from Gemini
    const aiResponse = await aiService.generateVoiceResponse(text, {
      userId,
      crops,
      activities: [],
      weather,
      location: "Farm",
    });

    if (!aiResponse.success) {
      throw new Error(aiResponse.error || "Failed to generate AI response");
    }

    const responseText = aiResponse.content;

    // 3. Convert Text to Speech with ElevenLabs
    const audioBuffer = await elevenLabsService.generateSpeech(responseText);
    const audioBase64 = audioBuffer.toString("base64");

    return NextResponse.json({
      text: responseText,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Voice API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
