import { put } from "@vercel/blob";
import { VideoScript } from "./summarizer";

export interface SlideData {
  text: string;
  duration: number; // seconds
  backgroundColor: string;
  textColor: string;
  fontSize: "small" | "medium" | "large";
  animation: "fade" | "slide" | "zoom";
}

export interface SlideshowConfig {
  width: number;
  height: number;
  fps: number;
  slides: SlideData[];
  audioUrl?: string;
  backgroundColor: string;
}

// Color themes for educational content
const THEMES = [
  { bg: "#1a1a2e", text: "#eaeaea", accent: "#e94560" },
  { bg: "#16213e", text: "#e8e8e8", accent: "#0f3460" },
  { bg: "#1f1f1f", text: "#ffffff", accent: "#6c63ff" },
  { bg: "#0d1117", text: "#c9d1d9", accent: "#58a6ff" },
  { bg: "#2d132c", text: "#feeafa", accent: "#ee4c7c" },
];

/**
 * Generate slide data from video script
 */
export function generateSlidesFromScript(script: VideoScript): SlideData[] {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const slides: SlideData[] = [];

  // Hook slide
  slides.push({
    text: script.hook,
    duration: 5,
    backgroundColor: theme.bg,
    textColor: theme.accent,
    fontSize: "large",
    animation: "zoom",
  });

  // Main points slides
  script.mainPoints.forEach((point, index) => {
    slides.push({
      text: point,
      duration: Math.floor(script.estimatedDuration / (script.mainPoints.length + 2)),
      backgroundColor: theme.bg,
      textColor: theme.text,
      fontSize: "medium",
      animation: index % 2 === 0 ? "slide" : "fade",
    });
  });

  // Conclusion slide
  slides.push({
    text: script.conclusion,
    duration: 5,
    backgroundColor: theme.bg,
    textColor: theme.accent,
    fontSize: "large",
    animation: "fade",
  });

  return slides;
}

/**
 * Generate slideshow configuration
 */
export function createSlideshowConfig(
  slides: SlideData[],
  audioUrl?: string
): SlideshowConfig {
  return {
    width: 1080,
    height: 1920, // Vertical format for TikTok/Reels
    fps: 30,
    slides,
    audioUrl,
    backgroundColor: slides[0]?.backgroundColor || "#1a1a2e",
  };
}

/**
 * Generate SVG frame for a slide (for static preview/thumbnail)
 */
export function generateSlideSVG(slide: SlideData, width: number = 1080, height: number = 1920): string {
  const fontSize = slide.fontSize === "large" ? 72 : slide.fontSize === "medium" ? 56 : 42;
  const lineHeight = fontSize * 1.4;

  // Word wrap text
  const words = slide.text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  const maxCharsPerLine = Math.floor(width / (fontSize * 0.5));

  words.forEach((word) => {
    if ((currentLine + word).length > maxCharsPerLine) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  });
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  const totalTextHeight = lines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + fontSize;

  const textElements = lines
    .map(
      (line, index) =>
        `<text x="${width / 2}" y="${startY + index * lineHeight}" text-anchor="middle" fill="${slide.textColor}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold">${escapeXml(line)}</text>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${slide.backgroundColor}"/>
  ${textElements}
</svg>`;
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Generate and upload thumbnail
 */
export async function generateThumbnail(
  slide: SlideData,
  videoId: string
): Promise<string> {
  const svg = generateSlideSVG(slide, 1080, 1920);
  const buffer = Buffer.from(svg);

  const blob = await put(`thumbnails/${videoId}.svg`, buffer, {
    access: "public",
    contentType: "image/svg+xml",
  });

  return blob.url;
}

/**
 * Calculate total slideshow duration
 */
export function calculateTotalDuration(slides: SlideData[]): number {
  return slides.reduce((total, slide) => total + slide.duration, 0);
}
