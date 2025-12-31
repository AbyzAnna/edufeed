import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import {
  extractYouTubeVideoId,
  getYouTubeVideoInfo,
  generateKeyMomentsFromContent,
} from "@/lib/generation/youtube";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, targetDuration = 60 } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const videoInfo = await getYouTubeVideoInfo(videoId);
    if (!videoInfo) {
      return NextResponse.json(
        { error: "Could not fetch video information" },
        { status: 400 }
      );
    }

    const keyMoments = await generateKeyMomentsFromContent(
      videoInfo.title,
      videoInfo.description,
      targetDuration
    );

    const clips = keyMoments.map((moment) => ({
      title: moment.title,
      startTime: moment.startTime,
      endTime: moment.endTime,
      description: moment.description,
    }));

    return NextResponse.json({
      videoId,
      title: videoInfo.title,
      channelTitle: videoInfo.channelTitle,
      thumbnailUrl: videoInfo.thumbnailUrl,
      clips,
    });
  } catch (error) {
    console.error("Error analyzing YouTube video:", error);
    return NextResponse.json(
      { error: "Failed to analyze video" },
      { status: 500 }
    );
  }
}
