import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { parsePodcastFeed, searchPodcasts, isValidPodcastUrl } from "@/lib/media/podcast";

// GET - Fetch user's podcast feeds
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feeds = await prisma.podcastFeed.findMany({
      where: { userId: session.user.id },
      include: {
        PodcastEpisode: {
          take: 5,
          orderBy: { publishedAt: "desc" },
        },
        _count: {
          select: { PodcastEpisode: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(feeds);
  } catch (error) {
    console.error("Error fetching podcast feeds:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast feeds" },
      { status: 500 }
    );
  }
}

// POST - Subscribe to a new podcast feed
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { feedUrl } = body;

    if (!feedUrl) {
      return NextResponse.json(
        { error: "feedUrl is required" },
        { status: 400 }
      );
    }

    if (!isValidPodcastUrl(feedUrl)) {
      return NextResponse.json(
        { error: "Invalid podcast feed URL" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.podcastFeed.findUnique({
      where: {
        userId_feedUrl: {
          userId: session.user.id,
          feedUrl,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already subscribed to this podcast" },
        { status: 409 }
      );
    }

    // Parse the feed
    const feedData = await parsePodcastFeed(feedUrl);

    // Create feed and episodes
    const feed = await prisma.podcastFeed.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        feedUrl,
        title: feedData.title,
        description: feedData.description || null,
        imageUrl: feedData.imageUrl || null,
        author: feedData.author || null,
        lastFetched: new Date(),
        PodcastEpisode: {
          create: feedData.episodes.slice(0, 50).map((ep) => ({
            id: crypto.randomUUID(),
            guid: ep.guid,
            title: ep.title,
            description: ep.description || null,
            audioUrl: ep.audioUrl,
            duration: ep.duration || null,
            publishedAt: ep.publishedAt || null,
          })),
        },
      },
      include: {
        PodcastEpisode: {
          take: 5,
          orderBy: { publishedAt: "desc" },
        },
        _count: {
          select: { PodcastEpisode: true },
        },
      },
    });

    return NextResponse.json({
      message: "Successfully subscribed to podcast",
      feed,
    });
  } catch (error) {
    console.error("Error subscribing to podcast:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to subscribe to podcast",
      },
      { status: 500 }
    );
  }
}
