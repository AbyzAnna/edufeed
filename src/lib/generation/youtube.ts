import axios from "axios";

const WORKERS_URL = process.env.WORKERS_URL || "http://localhost:8787";

// Timeout for external API calls (30 seconds)
const EXTERNAL_API_TIMEOUT = 30000;

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  channelTitle: string;
}

export interface KeyMoment {
  startTime: number; // in seconds
  endTime: number; // in seconds
  title: string;
  description: string;
  importance: number; // 1-10
  thumbnailUrl?: string;
}

export interface ClipSuggestion {
  videoId: string;
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  embedUrl: string;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get YouTube video info using oEmbed (no API key required)
 */
export async function getYouTubeVideoInfo(
  videoId: string
): Promise<YouTubeVideoInfo | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await axios.get(oembedUrl, {
      timeout: EXTERNAL_API_TIMEOUT,
    });

    return {
      id: videoId,
      title: response.data.title,
      description: "",
      duration: 0, // oEmbed doesn't provide duration
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: response.data.author_name,
    };
  } catch (error) {
    console.error("Error fetching YouTube video info:", error);
    return null;
  }
}

/**
 * Generate key moments from video transcript/title using AI
 * Uses Cloudflare Workers AI via the deployed worker
 */
export async function generateKeyMomentsFromContent(
  videoTitle: string,
  videoDescription: string,
  targetClipDuration: number = 60 // target 30-60 second clips
): Promise<KeyMoment[]> {
  // First try to use Cloudflare Workers AI
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT);

    const response = await fetch(`${WORKERS_URL}/api/youtube/key-moments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: videoTitle,
        description: videoDescription,
        targetDuration: targetClipDuration,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      return result.keyMoments || [];
    }
  } catch (error) {
    console.log("Workers AI not available, using fallback:", error);
  }

  // Fallback: Generate default key moments based on typical video structure
  // This provides a basic experience without AI
  const defaultMoments: KeyMoment[] = [
    {
      startTime: 0,
      endTime: targetClipDuration,
      title: `Introduction: ${videoTitle.slice(0, 50)}`,
      description: "Opening segment with key introduction",
      importance: 9,
    },
    {
      startTime: targetClipDuration,
      endTime: targetClipDuration * 2,
      title: "Main Concepts",
      description: "Core explanation and key points",
      importance: 8,
    },
    {
      startTime: targetClipDuration * 2,
      endTime: targetClipDuration * 3,
      title: "Key Takeaways",
      description: "Summary and important conclusions",
      importance: 7,
    },
  ];

  return defaultMoments;
}

/**
 * Create embed URLs for specific time ranges
 */
export function createYouTubeClipUrl(
  videoId: string,
  startTime: number,
  endTime: number
): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(
    startTime
  )}&end=${Math.floor(endTime)}&autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
}

/**
 * Create a shareable clip link
 */
export function createShareableClipUrl(
  videoId: string,
  startTime: number
): string {
  return `https://youtu.be/${videoId}?t=${Math.floor(startTime)}`;
}

/**
 * Process a YouTube URL and extract key moments
 */
export async function processYouTubeVideo(
  url: string
): Promise<ClipSuggestion[]> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const videoInfo = await getYouTubeVideoInfo(videoId);
  if (!videoInfo) {
    throw new Error("Could not fetch video information");
  }

  const keyMoments = await generateKeyMomentsFromContent(
    videoInfo.title,
    videoInfo.description
  );

  return keyMoments.map((moment) => ({
    videoId,
    startTime: moment.startTime,
    endTime: moment.endTime,
    title: moment.title,
    description: moment.description,
    embedUrl: createYouTubeClipUrl(videoId, moment.startTime, moment.endTime),
  }));
}

/**
 * Search for educational videos on a topic
 * Note: This uses YouTube's public search (limited functionality)
 * For production, use YouTube Data API v3
 */
export async function searchEducationalVideos(
  topic: string,
  maxResults: number = 5
): Promise<string[]> {
  // For now, return suggested search query URLs
  // In production, integrate with YouTube Data API
  const searchQuery = encodeURIComponent(`${topic} explained tutorial`);
  return [
    `https://www.youtube.com/results?search_query=${searchQuery}`,
  ];
}
