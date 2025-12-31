import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { parsePodcastFeed } from "@/lib/media/podcast";

interface RouteParams {
  params: Promise<{ feedId: string }>;
}

// GET - Fetch a specific podcast feed with all episodes
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { feedId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await prisma.podcastFeed.findFirst({
      where: {
        id: feedId,
        userId: session.user.id,
      },
      include: {
        PodcastEpisode: {
          orderBy: { publishedAt: "desc" },
        },
      },
    });

    if (!feed) {
      return NextResponse.json(
        { error: "Podcast feed not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Error fetching podcast feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch podcast feed" },
      { status: 500 }
    );
  }
}

// POST - Refresh a podcast feed (fetch new episodes)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { feedId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await prisma.podcastFeed.findFirst({
      where: {
        id: feedId,
        userId: session.user.id,
      },
      include: {
        PodcastEpisode: {
          select: { guid: true },
        },
      },
    });

    if (!feed) {
      return NextResponse.json(
        { error: "Podcast feed not found" },
        { status: 404 }
      );
    }

    // Parse the feed again
    const feedData = await parsePodcastFeed(feed.feedUrl);

    // Get existing episode GUIDs
    const existingGuids = new Set(feed.PodcastEpisode.map((ep) => ep.guid));

    // Find new episodes
    const newEpisodes = feedData.episodes.filter(
      (ep) => !existingGuids.has(ep.guid)
    );

    // Add new episodes
    if (newEpisodes.length > 0) {
      await prisma.podcastEpisode.createMany({
        data: newEpisodes.map((ep) => ({
          id: crypto.randomUUID(),
          feedId,
          guid: ep.guid,
          title: ep.title,
          description: ep.description || null,
          audioUrl: ep.audioUrl,
          duration: ep.duration || null,
          publishedAt: ep.publishedAt || null,
        })),
      });
    }

    // Update feed metadata and last fetched time
    await prisma.podcastFeed.update({
      where: { id: feedId },
      data: {
        title: feedData.title,
        description: feedData.description || null,
        imageUrl: feedData.imageUrl || null,
        author: feedData.author || null,
        lastFetched: new Date(),
      },
    });

    return NextResponse.json({
      message: `Feed refreshed. ${newEpisodes.length} new episodes found.`,
      newEpisodeCount: newEpisodes.length,
    });
  } catch (error) {
    console.error("Error refreshing podcast feed:", error);
    return NextResponse.json(
      { error: "Failed to refresh podcast feed" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from a podcast feed
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { feedId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feed = await prisma.podcastFeed.deleteMany({
      where: {
        id: feedId,
        userId: session.user.id,
      },
    });

    if (feed.count === 0) {
      return NextResponse.json(
        { error: "Podcast feed not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Successfully unsubscribed from podcast" });
  } catch (error) {
    console.error("Error deleting podcast feed:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from podcast" },
      { status: 500 }
    );
  }
}
