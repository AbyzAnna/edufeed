import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sourceId, generationType = "SLIDESHOW" } = body;

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    // Validate generation type against allowed values
    const validGenerationTypes = ["SLIDESHOW", "ANIMATION", "TALKING_HEAD", "SUMMARY", "QUIZ"];
    if (!validGenerationTypes.includes(generationType)) {
      return NextResponse.json(
        { error: `Invalid generation type. Must be one of: ${validGenerationTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Verify source belongs to user
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        userId: session.user.id,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Create video record with PENDING status
    const video = await prisma.video.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        sourceId,
        title: source.title,
        status: "PENDING",
        generationType,
        updatedAt: new Date(),
      },
    });

    // Send to Inngest for background processing
    try {
      await inngest.send({
        name: "video/generate",
        data: {
          videoId: video.id,
          sourceId: source.id,
          generationType,
        },
      });
    } catch (inngestError) {
      // If Inngest is not configured, fall back to direct generation
      console.log("Inngest not configured, using direct generation");

      // Import and run generation directly (for development)
      const { generateVideo } = await import("@/lib/generation");

      // Run in background without blocking the response
      generateVideo(video.id, source.id, generationType).catch((err) => {
        console.error("Background generation error:", err);
      });
    }

    return NextResponse.json({
      message: "Video generation started",
      videoId: video.id,
    });
  } catch (error) {
    console.error("Error starting generation:", error);
    return NextResponse.json(
      { error: "Failed to start video generation" },
      { status: 500 }
    );
  }
}
