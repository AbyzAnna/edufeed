import * as cheerio from "cheerio";

export interface PodcastFeed {
  title: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  feedUrl: string;
  episodes: PodcastEpisode[];
}

export interface PodcastEpisode {
  guid: string;
  title: string;
  description?: string;
  audioUrl: string;
  duration?: number;
  publishedAt?: Date;
  imageUrl?: string;
}

// Timeout for external API calls (30 seconds)
const EXTERNAL_API_TIMEOUT = 30000;

/**
 * Parse a podcast RSS feed URL and extract feed info and episodes
 */
export async function parsePodcastFeed(feedUrl: string): Promise<PodcastFeed> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT);

    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "EduFeed Podcast Parser/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.status}`);
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    // Extract channel (feed) information
    const channel = $("channel");
    const title = channel.find("> title").first().text() || "Untitled Podcast";
    const description =
      channel.find("> description").first().text() ||
      channel.find("> itunes\\:summary").first().text();
    const imageUrl =
      channel.find("> image > url").first().text() ||
      channel.find("> itunes\\:image").first().attr("href");
    const author =
      channel.find("> itunes\\:author").first().text() ||
      channel.find("> author").first().text();

    // Extract episodes
    const episodes: PodcastEpisode[] = [];
    const items = $("item");

    items.each((_, element) => {
      const item = $(element);

      const guid =
        item.find("guid").text() ||
        item.find("enclosure").attr("url") ||
        `episode-${episodes.length}`;

      const episodeTitle = item.find("title").first().text();
      const episodeDescription =
        item.find("description").first().text() ||
        item.find("itunes\\:summary").first().text();

      const enclosure = item.find("enclosure");
      const audioUrl = enclosure.attr("url") || "";

      // Parse duration (can be in seconds or HH:MM:SS format)
      const durationStr =
        item.find("itunes\\:duration").first().text() || "";
      const duration = parseDuration(durationStr);

      // Parse published date
      const pubDateStr = item.find("pubDate").first().text();
      const publishedAt = pubDateStr ? new Date(pubDateStr) : undefined;

      const episodeImageUrl =
        item.find("itunes\\:image").first().attr("href") ||
        item.find("media\\:thumbnail").first().attr("url");

      if (audioUrl) {
        episodes.push({
          guid,
          title: episodeTitle || "Untitled Episode",
          description: episodeDescription,
          audioUrl,
          duration,
          publishedAt,
          imageUrl: episodeImageUrl,
        });
      }
    });

    return {
      title,
      description,
      imageUrl,
      author,
      feedUrl,
      episodes,
    };
  } catch (error) {
    console.error("Error parsing podcast feed:", error);
    // Check if it was a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("Request timed out while fetching podcast feed");
    }
    throw new Error(
      `Failed to parse podcast feed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Parse duration string to seconds
 * Handles formats: "123" (seconds), "1:23" (MM:SS), "1:02:03" (HH:MM:SS)
 */
function parseDuration(durationStr: string): number | undefined {
  if (!durationStr) return undefined;

  // If it's just a number, assume seconds
  if (/^\d+$/.test(durationStr)) {
    return parseInt(durationStr, 10);
  }

  // If it's in HH:MM:SS or MM:SS format
  const parts = durationStr.split(":").map((p) => parseInt(p, 10));

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return undefined;
}

/**
 * Validate a podcast feed URL
 */
export function isValidPodcastUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "feed:"
    );
  } catch {
    return false;
  }
}

/**
 * Search for podcasts by keyword (using iTunes Search API)
 */
export async function searchPodcasts(
  query: string,
  limit: number = 10
): Promise<
  {
    feedUrl: string;
    title: string;
    author: string;
    imageUrl: string;
  }[]
> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT);

    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(
        query
      )}&media=podcast&limit=${limit}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error("Failed to search podcasts");
    }

    const data = await response.json();

    return data.results.map(
      (result: {
        feedUrl: string;
        collectionName: string;
        artistName: string;
        artworkUrl600: string;
      }) => ({
        feedUrl: result.feedUrl,
        title: result.collectionName,
        author: result.artistName,
        imageUrl: result.artworkUrl600,
      })
    );
  } catch (error) {
    console.error("Error searching podcasts:", error);
    return [];
  }
}
