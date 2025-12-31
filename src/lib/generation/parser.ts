import * as cheerio from "cheerio";
import axios from "axios";

export interface ParsedContent {
  title: string;
  content: string;
  type: "PDF" | "URL" | "TEXT";
}

/**
 * Extract text content from a PDF buffer
 * Note: PDF parsing is handled separately due to compatibility issues
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  // PDF parsing will be handled by a separate service or at runtime
  // For now, return empty and let the video generation use the title
  console.log("PDF parsing - buffer size:", buffer.length);
  return "";
}

/**
 * Scrape content from a URL
 */
export async function parseURL(url: string): Promise<ParsedContent> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Remove script, style, nav, footer, and other non-content elements
    $("script, style, nav, footer, header, aside, .ads, .comments").remove();

    // Try to get the main content
    let content = "";
    const mainContent =
      $("article").text() ||
      $("main").text() ||
      $(".content").text() ||
      $(".post-content").text() ||
      $("body").text();

    content = mainContent.replace(/\s+/g, " ").trim();

    // Get title
    const title =
      $("h1").first().text().trim() ||
      $("title").text().trim() ||
      "Untitled";

    return {
      title,
      content: content.slice(0, 50000), // Limit content length
      type: "URL",
    };
  } catch (error) {
    console.error("Error parsing URL:", error);
    throw new Error("Failed to fetch URL content");
  }
}

/**
 * Clean and prepare text content
 */
export function parseText(text: string, title?: string): ParsedContent {
  const cleanedContent = text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50000);

  return {
    title: title || extractTitle(cleanedContent),
    content: cleanedContent,
    type: "TEXT",
  };
}

/**
 * Extract a title from content if not provided
 */
function extractTitle(content: string): string {
  // Take first sentence or first 50 chars as title
  const firstSentence = content.split(/[.!?]/)[0];
  if (firstSentence.length <= 60) {
    return firstSentence.trim();
  }
  return content.slice(0, 50).trim() + "...";
}

/**
 * Get word count of content
 */
export function getWordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

/**
 * Estimate reading time in minutes
 */
export function getReadingTime(content: string): number {
  const wordsPerMinute = 200;
  return Math.ceil(getWordCount(content) / wordsPerMinute);
}
