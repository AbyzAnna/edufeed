import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";

// YouTube search results interface
interface YouTubeSearchResult {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  description: string;
}

// Rate limiting - simple in-memory cache with LRU-style eviction
const searchCache = new Map<string, { data: YouTubeSearchResult[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for better performance
const MAX_CACHE_SIZE = 100;

// Cleanup old cache entries periodically
function cleanupCache() {
  if (searchCache.size > MAX_CACHE_SIZE) {
    const now = Date.now();
    const entries = Array.from(searchCache.entries());
    // Sort by timestamp (oldest first) and remove expired or oldest
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
    toRemove.forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL || searchCache.size > MAX_CACHE_SIZE) {
        searchCache.delete(key);
      }
    });
  }
}

/**
 * Search YouTube videos using web scraping with timeout and better error handling
 */
async function searchYouTubeVideos(
  query: string,
  category: string = "study",
  maxResults: number = 20
): Promise<YouTubeSearchResult[]> {
  // Check cache first - this is instant and greatly improves perceived speed
  const cacheKey = `${query.toLowerCase().trim()}-${category}-${maxResults}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Enhance query with educational/study context
  const educationalSuffixes: Record<string, string> = {
    study: "study music",
    focus: "focus concentration",
    relaxing: "relaxing calm",
    lofi: "lofi beats",
    nature: "nature sounds",
    classical: "classical music",
    frequencies: "binaural beats hz",
    shorts: "study tips shorts",
  };

  const enhancedQuery = educationalSuffixes[category]
    ? `${query} ${educationalSuffixes[category]}`
    : query;

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    // Use YouTube's search with proper encoding
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(enhancedQuery)}&sp=EgIQAQ%253D%253D`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`YouTube search HTTP error: ${response.status}`);
      return getFallbackResults(query, category);
    }

    const html = await response.text();
    const results = extractVideoDataFromHtml(html, maxResults);

    // Only cache if we got valid results
    if (results.length > 0) {
      cleanupCache();
      searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    }

    return results.length > 0 ? results : getFallbackResults(query, category);
  } catch (error) {
    clearTimeout(timeoutId);

    // Distinguish between timeout and other errors
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("YouTube search timed out, using fallback");
    } else {
      console.error("YouTube search error:", error);
    }

    return getFallbackResults(query, category);
  }
}

/**
 * Extract video data from YouTube search HTML
 */
function extractVideoDataFromHtml(html: string, maxResults: number): YouTubeSearchResult[] {
  const results: YouTubeSearchResult[] = [];

  // Find the ytInitialData JSON in the HTML using indexOf for better compatibility
  const startMarker = 'var ytInitialData = ';
  const startIndex = html.indexOf(startMarker);
  if (startIndex === -1) {
    return results;
  }

  // Find the end of the JSON object
  let depth = 0;
  let jsonStart = startIndex + startMarker.length;
  let jsonEnd = jsonStart;

  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0 && html[i] === '}') {
      jsonEnd = i + 1;
      break;
    }
  }

  const jsonStr = html.substring(jsonStart, jsonEnd);
  if (!jsonStr) return results;

  try {

    const data = JSON.parse(jsonStr);

    // Navigate to video results
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return results;

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        if (results.length >= maxResults) break;

        const videoRenderer = item?.videoRenderer;
        if (!videoRenderer) continue;

        const videoId = videoRenderer.videoId;
        if (!videoId) continue;

        // Extract video details
        const title = videoRenderer.title?.runs?.[0]?.text || "Untitled";
        const channelName = videoRenderer.ownerText?.runs?.[0]?.text || "Unknown Channel";
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        // Duration
        const duration = videoRenderer.lengthText?.simpleText ||
                        videoRenderer.lengthText?.accessibility?.accessibilityData?.label ||
                        "LIVE";

        // View count
        const viewCount = videoRenderer.viewCountText?.simpleText ||
                         videoRenderer.viewCountText?.runs?.[0]?.text ||
                         "N/A";

        // Published date
        const publishedAt = videoRenderer.publishedTimeText?.simpleText || "";

        // Description snippet
        const description = videoRenderer.detailedMetadataSnippets?.[0]?.snippetText?.runs
          ?.map((r: { text: string }) => r.text)?.join("") || "";

        results.push({
          id: `search-${videoId}`,
          videoId,
          title,
          channelName,
          thumbnailUrl,
          duration,
          viewCount,
          publishedAt,
          description,
        });
      }
    }
  } catch (error) {
    console.error("Error parsing YouTube data:", error);
  }

  return results;
}

/**
 * Fallback results when YouTube search fails - provides comprehensive curated videos
 */
function getFallbackResults(query: string, category: string): YouTubeSearchResult[] {
  const lowerQuery = query.toLowerCase();

  // Comprehensive fallback videos organized by category
  const fallbackVideos: Record<string, YouTubeSearchResult[]> = {
    study: [
      {
        id: "fallback-study-1",
        videoId: "lTRiuFIWV54",
        title: "Deep Focus Music To Improve Concentration",
        channelName: "Greenred Productions",
        thumbnailUrl: "https://img.youtube.com/vi/lTRiuFIWV54/hqdefault.jpg",
        duration: "11:54:56",
        viewCount: "25M views",
        publishedAt: "3 years ago",
        description: "Deep focus music for concentration and studying",
      },
      {
        id: "fallback-study-2",
        videoId: "sjkrrmBnpGE",
        title: "4 Hours of Ambient Study Music",
        channelName: "Quiet Quest",
        thumbnailUrl: "https://img.youtube.com/vi/sjkrrmBnpGE/hqdefault.jpg",
        duration: "4:00:00",
        viewCount: "12M views",
        publishedAt: "2 years ago",
        description: "Ambient study music for focus and concentration",
      },
      {
        id: "fallback-study-3",
        videoId: "WPni755-Krg",
        title: "Brain Power - Focus Music",
        channelName: "Yellow Brick Cinema",
        thumbnailUrl: "https://img.youtube.com/vi/WPni755-Krg/hqdefault.jpg",
        duration: "3:00:12",
        viewCount: "45M views",
        publishedAt: "4 years ago",
        description: "Music for studying and concentration",
      },
    ],
    lofi: [
      {
        id: "fallback-lofi-1",
        videoId: "jfKfPfyJRdk",
        title: "lofi hip hop radio - beats to relax/study to",
        channelName: "Lofi Girl",
        thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg",
        duration: "LIVE",
        viewCount: "41K watching",
        publishedAt: "",
        description: "24/7 lofi hip hop radio",
      },
      {
        id: "fallback-lofi-2",
        videoId: "rUxyKA_-grg",
        title: "lofi hip hop radio - beats to sleep/chill to",
        channelName: "Lofi Girl",
        thumbnailUrl: "https://img.youtube.com/vi/rUxyKA_-grg/hqdefault.jpg",
        duration: "LIVE",
        viewCount: "15K watching",
        publishedAt: "",
        description: "24/7 lofi beats to chill to",
      },
      {
        id: "fallback-lofi-3",
        videoId: "5yx6BWlEVcY",
        title: "Chillhop Radio - jazzy & lofi hip hop beats",
        channelName: "Chillhop Music",
        thumbnailUrl: "https://img.youtube.com/vi/5yx6BWlEVcY/hqdefault.jpg",
        duration: "LIVE",
        viewCount: "8K watching",
        publishedAt: "",
        description: "Jazzy lofi hip hop beats",
      },
    ],
    focus: [
      {
        id: "fallback-focus-1",
        videoId: "oPVte6aMprI",
        title: "Productive Morning - Study Music",
        channelName: "The Soul of Wind",
        thumbnailUrl: "https://img.youtube.com/vi/oPVte6aMprI/hqdefault.jpg",
        duration: "3:28:15",
        viewCount: "8M views",
        publishedAt: "2 years ago",
        description: "Morning music for productivity",
      },
      {
        id: "fallback-focus-2",
        videoId: "sjkrrmBnpGE",
        title: "4 Hours of Ambient Study Music",
        channelName: "Quiet Quest",
        thumbnailUrl: "https://img.youtube.com/vi/sjkrrmBnpGE/hqdefault.jpg",
        duration: "4:00:00",
        viewCount: "12M views",
        publishedAt: "2 years ago",
        description: "Ambient study music for focus",
      },
    ],
    relaxing: [
      {
        id: "fallback-relax-1",
        videoId: "1fueZCTYkpA",
        title: "Relaxing Sleep Music + Rain Sounds",
        channelName: "Soothing Relaxation",
        thumbnailUrl: "https://img.youtube.com/vi/1fueZCTYkpA/hqdefault.jpg",
        duration: "8:00:00",
        viewCount: "150M views",
        publishedAt: "3 years ago",
        description: "Relaxing music with rain sounds for sleep",
      },
      {
        id: "fallback-relax-2",
        videoId: "hlWiI4xVXKY",
        title: "Beautiful Relaxing Music for Stress Relief",
        channelName: "Soothing Relaxation",
        thumbnailUrl: "https://img.youtube.com/vi/hlWiI4xVXKY/hqdefault.jpg",
        duration: "3:17:42",
        viewCount: "85M views",
        publishedAt: "4 years ago",
        description: "Calming music for stress relief",
      },
    ],
    nature: [
      {
        id: "fallback-nature-1",
        videoId: "WHPEKLQID4U",
        title: "Relaxing Ocean Waves",
        channelName: "Relaxing White Noise",
        thumbnailUrl: "https://img.youtube.com/vi/WHPEKLQID4U/hqdefault.jpg",
        duration: "10:00:00",
        viewCount: "87M views",
        publishedAt: "5 years ago",
        description: "Ocean wave sounds for relaxation",
      },
      {
        id: "fallback-nature-2",
        videoId: "q76bMs-NwRk",
        title: "Rain Sounds for Sleeping",
        channelName: "Rain Sounds",
        thumbnailUrl: "https://img.youtube.com/vi/q76bMs-NwRk/hqdefault.jpg",
        duration: "10:00:00",
        viewCount: "120M views",
        publishedAt: "3 years ago",
        description: "Rain sounds for sleep and relaxation",
      },
    ],
    classical: [
      {
        id: "fallback-classical-1",
        videoId: "4Tr0otuiQuU",
        title: "Beethoven - Moonlight Sonata (Full)",
        channelName: "HALIDONMUSIC",
        thumbnailUrl: "https://img.youtube.com/vi/4Tr0otuiQuU/hqdefault.jpg",
        duration: "15:03",
        viewCount: "250M views",
        publishedAt: "6 years ago",
        description: "Beethoven's Moonlight Sonata",
      },
      {
        id: "fallback-classical-2",
        videoId: "Rb0UmrCXxVA",
        title: "Mozart - Classical Music for Brain Power",
        channelName: "HALIDONMUSIC",
        thumbnailUrl: "https://img.youtube.com/vi/Rb0UmrCXxVA/hqdefault.jpg",
        duration: "3:04:46",
        viewCount: "45M views",
        publishedAt: "5 years ago",
        description: "Mozart for concentration and brain power",
      },
    ],
    frequencies: [
      {
        id: "fallback-freq-1",
        videoId: "NPVX75VIpqg",
        title: "432 Hz - Deep Healing Frequency",
        channelName: "Meditative Mind",
        thumbnailUrl: "https://img.youtube.com/vi/NPVX75VIpqg/hqdefault.jpg",
        duration: "8:00:00",
        viewCount: "28M views",
        publishedAt: "3 years ago",
        description: "Deep healing frequency meditation",
      },
      {
        id: "fallback-freq-2",
        videoId: "LXKRsJWqORc",
        title: "40 Hz Gamma Binaural Beats - Focus & Memory",
        channelName: "Brainwave Music",
        thumbnailUrl: "https://img.youtube.com/vi/LXKRsJWqORc/hqdefault.jpg",
        duration: "2:00:00",
        viewCount: "5.2M views",
        publishedAt: "2 years ago",
        description: "Gamma binaural beats for focus",
      },
    ],
    shorts: [
      {
        id: "fallback-shorts-1",
        videoId: "ukLnPbIffxE",
        title: "How to Study Effectively - Evidence-Based Tips",
        channelName: "Ali Abdaal",
        thumbnailUrl: "https://img.youtube.com/vi/ukLnPbIffxE/hqdefault.jpg",
        duration: "12:34",
        viewCount: "5.2M views",
        publishedAt: "2 years ago",
        description: "Evidence-based study tips",
      },
    ],
  };

  // Get base results for the category
  let results = fallbackVideos[category] || fallbackVideos.study || [];

  // If query contains specific keywords, filter or augment results
  if (lowerQuery.includes("rain") || lowerQuery.includes("water")) {
    results = [...(fallbackVideos.nature || []), ...results];
  }
  if (lowerQuery.includes("piano") || lowerQuery.includes("beethoven") || lowerQuery.includes("mozart")) {
    results = [...(fallbackVideos.classical || []), ...results];
  }
  if (lowerQuery.includes("lofi") || lowerQuery.includes("lo-fi") || lowerQuery.includes("chill")) {
    results = [...(fallbackVideos.lofi || []), ...results];
  }
  if (lowerQuery.includes("hz") || lowerQuery.includes("frequency") || lowerQuery.includes("binaural")) {
    results = [...(fallbackVideos.frequencies || []), ...results];
  }

  // Remove duplicates based on videoId
  const seen = new Set<string>();
  return results.filter(video => {
    if (seen.has(video.videoId)) return false;
    seen.add(video.videoId);
    return true;
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "study";
    const maxResults = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query.trim()) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const results = await searchYouTubeVideos(query, category, maxResults);

    return NextResponse.json({
      query,
      category,
      results,
      resultCount: results.length,
    });
  } catch (error) {
    console.error("Error in YouTube search:", error);
    return NextResponse.json(
      { error: "Failed to search videos" },
      { status: 500 }
    );
  }
}
