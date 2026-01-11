import { put } from "@vercel/blob";
import { VideoScript, VideoSegment } from "./summarizer";

export interface SlideData {
  text: string;
  duration: number; // seconds
  backgroundColor: string;
  textColor: string;
  fontSize: "small" | "medium" | "large" | "xlarge";
  animation: "fade" | "slide" | "zoom" | "typewriter" | "pulse";
  // Enhanced properties
  type: "intro" | "content" | "key-point" | "transition" | "outro" | "cta";
  subtext?: string;
  accentColor: string;
  gradientColors?: [string, string];
  showLogo?: boolean;
  showProgressBar?: boolean;
  imageUrl?: string;
  overlayOpacity?: number;
}

export interface SlideshowConfig {
  width: number;
  height: number;
  fps: number;
  slides: SlideData[];
  audioUrl?: string;
  backgroundColor: string;
  // New config options
  aspectRatio: "16:9" | "9:16" | "1:1";
  brandColor?: string;
  logoUrl?: string;
}

// Professional color themes for educational content
const THEMES = {
  modern: {
    bg: "#0f0f0f",
    text: "#ffffff",
    accent: "#6366f1",
    gradient: ["#6366f1", "#8b5cf6"] as [string, string],
  },
  elegant: {
    bg: "#1a1a2e",
    text: "#eaeaea",
    accent: "#e94560",
    gradient: ["#e94560", "#ff6b6b"] as [string, string],
  },
  professional: {
    bg: "#0d1117",
    text: "#c9d1d9",
    accent: "#58a6ff",
    gradient: ["#58a6ff", "#79c0ff"] as [string, string],
  },
  warm: {
    bg: "#1c1917",
    text: "#fafaf9",
    accent: "#f97316",
    gradient: ["#f97316", "#fb923c"] as [string, string],
  },
  nature: {
    bg: "#14181f",
    text: "#e2e8f0",
    accent: "#22c55e",
    gradient: ["#22c55e", "#4ade80"] as [string, string],
  },
  royal: {
    bg: "#1e1b4b",
    text: "#e0e7ff",
    accent: "#a78bfa",
    gradient: ["#8b5cf6", "#a78bfa"] as [string, string],
  },
};

type ThemeName = keyof typeof THEMES;

/**
 * Select theme based on content category
 */
function selectThemeForCategory(category: string): ThemeName {
  const categoryThemes: Record<string, ThemeName> = {
    education: "modern",
    science: "professional",
    history: "elegant",
    technology: "professional",
    lifestyle: "warm",
    business: "elegant",
    nature: "nature",
    arts: "royal",
  };
  return categoryThemes[category] || "modern";
}

/**
 * Generate professional slide data from video script
 */
export function generateSlidesFromScript(
  script: VideoScript,
  options: { category?: string; brandColor?: string } = {}
): SlideData[] {
  const themeName = selectThemeForCategory(options.category || script.metadata?.category || "education");
  const theme = THEMES[themeName];
  const slides: SlideData[] = [];

  // Use segments if available (new format)
  if (script.segments && script.segments.length > 0) {
    script.segments.forEach((segment, index) => {
      const slide = createSlideFromSegment(segment, theme, index, script.segments.length);
      slides.push(slide);
    });
  } else {
    // Fallback to legacy format
    slides.push(...createLegacySlides(script, theme));
  }

  return slides;
}

/**
 * Create a slide from a video segment
 */
function createSlideFromSegment(
  segment: VideoSegment,
  theme: typeof THEMES.modern,
  index: number,
  totalSegments: number
): SlideData {
  const slideType = mapVisualTypeToSlideType(segment.visualType);

  const baseSlide: SlideData = {
    text: segment.onScreenText || segment.title,
    subtext: segment.visualType === "intro" ? segment.narration.split(".")[0] : undefined,
    duration: segment.duration,
    backgroundColor: theme.bg,
    textColor: theme.text,
    accentColor: theme.accent,
    gradientColors: theme.gradient,
    fontSize: getFontSizeForType(slideType),
    animation: getAnimationForType(slideType, index),
    type: slideType,
    showProgressBar: slideType === "content" || slideType === "key-point",
    overlayOpacity: 0.6,
  };

  // Customize based on segment type
  switch (slideType) {
    case "intro":
      return {
        ...baseSlide,
        fontSize: "xlarge",
        animation: "zoom",
        showLogo: true,
        textColor: theme.accent,
        showProgressBar: false,
      };
    case "outro":
      return {
        ...baseSlide,
        fontSize: "large",
        animation: "fade",
        textColor: theme.accent,
        showProgressBar: false,
      };
    case "cta":
      return {
        ...baseSlide,
        fontSize: "large",
        animation: "pulse",
        textColor: theme.accent,
        showProgressBar: false,
      };
    default:
      return baseSlide;
  }
}

function mapVisualTypeToSlideType(visualType: string): SlideData["type"] {
  const mapping: Record<string, SlideData["type"]> = {
    intro: "intro",
    content: "content",
    transition: "transition",
    outro: "outro",
  };
  return mapping[visualType] || "content";
}

function getFontSizeForType(type: SlideData["type"]): SlideData["fontSize"] {
  const sizes: Record<SlideData["type"], SlideData["fontSize"]> = {
    intro: "xlarge",
    content: "medium",
    "key-point": "large",
    transition: "medium",
    outro: "large",
    cta: "large",
  };
  return sizes[type] || "medium";
}

function getAnimationForType(type: SlideData["type"], index: number): SlideData["animation"] {
  if (type === "intro") return "zoom";
  if (type === "outro") return "fade";
  if (type === "cta") return "pulse";
  // Alternate animations for content
  const contentAnimations: SlideData["animation"][] = ["fade", "slide", "typewriter"];
  return contentAnimations[index % contentAnimations.length];
}

/**
 * Create slides from legacy script format (mainPoints array)
 */
function createLegacySlides(script: VideoScript, theme: typeof THEMES.modern): SlideData[] {
  const slides: SlideData[] = [];

  // Professional intro slide
  slides.push({
    text: script.title,
    subtext: script.hook.split(".")[0] || "",
    duration: 5,
    backgroundColor: theme.bg,
    textColor: theme.accent,
    accentColor: theme.accent,
    gradientColors: theme.gradient,
    fontSize: "xlarge",
    animation: "zoom",
    type: "intro",
    showLogo: true,
    showProgressBar: false,
    overlayOpacity: 0.7,
  });

  // Hook slide
  if (script.hook && script.hook.length > 50) {
    slides.push({
      text: script.hook,
      duration: 6,
      backgroundColor: theme.bg,
      textColor: theme.text,
      accentColor: theme.accent,
      gradientColors: theme.gradient,
      fontSize: "large",
      animation: "fade",
      type: "content",
      showProgressBar: true,
      overlayOpacity: 0.6,
    });
  }

  // Main content slides (guard against division by zero)
  const mainPointsCount = Math.max(1, script.mainPoints.length);
  const contentDuration = Math.max(5, Math.floor((script.estimatedDuration - 20) / mainPointsCount));

  script.mainPoints.forEach((point, index) => {
    // Add a key point slide
    slides.push({
      text: `${index + 1}`,
      subtext: point.length > 100 ? point.slice(0, 100) + "..." : point,
      duration: contentDuration,
      backgroundColor: theme.bg,
      textColor: theme.text,
      accentColor: theme.accent,
      gradientColors: theme.gradient,
      fontSize: "medium",
      animation: index % 2 === 0 ? "slide" : "fade",
      type: "key-point",
      showProgressBar: true,
      overlayOpacity: 0.5,
    });
  });

  // Conclusion slide
  slides.push({
    text: "Key Takeaway",
    subtext: script.conclusion,
    duration: 5,
    backgroundColor: theme.bg,
    textColor: theme.accent,
    accentColor: theme.accent,
    gradientColors: theme.gradient,
    fontSize: "large",
    animation: "fade",
    type: "outro",
    showProgressBar: false,
    overlayOpacity: 0.6,
  });

  // Call to action slide
  slides.push({
    text: script.callToAction || "Subscribe for more!",
    duration: 4,
    backgroundColor: theme.bg,
    textColor: theme.accent,
    accentColor: theme.accent,
    gradientColors: theme.gradient,
    fontSize: "large",
    animation: "pulse",
    type: "cta",
    showLogo: true,
    showProgressBar: false,
    overlayOpacity: 0.7,
  });

  return slides;
}

/**
 * Generate slideshow configuration
 */
export function createSlideshowConfig(
  slides: SlideData[],
  audioUrl?: string,
  options: { aspectRatio?: "16:9" | "9:16" | "1:1"; brandColor?: string; logoUrl?: string } = {}
): SlideshowConfig {
  const aspectRatio = options.aspectRatio || "16:9";

  // Set dimensions based on aspect ratio
  const dimensions = {
    "16:9": { width: 1920, height: 1080 },
    "9:16": { width: 1080, height: 1920 },
    "1:1": { width: 1080, height: 1080 },
  };

  const { width, height } = dimensions[aspectRatio];

  return {
    width,
    height,
    fps: 30,
    slides,
    audioUrl,
    backgroundColor: slides[0]?.backgroundColor || "#0f0f0f",
    aspectRatio,
    brandColor: options.brandColor,
    logoUrl: options.logoUrl,
  };
}

/**
 * Generate professional SVG frame for a slide
 */
export function generateSlideSVG(
  slide: SlideData,
  width: number = 1920,
  height: number = 1080
): string {
  const fontSizes = {
    small: 36,
    medium: 48,
    large: 64,
    xlarge: 84,
  };

  const fontSize = fontSizes[slide.fontSize];
  const subtextFontSize = Math.round(fontSize * 0.5);
  const lineHeight = fontSize * 1.3;

  // Create gradient definition
  const gradientDef = slide.gradientColors
    ? `
    <defs>
      <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:${slide.gradientColors[0]};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${slide.gradientColors[1]};stop-opacity:1" />
      </linearGradient>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${slide.backgroundColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${adjustColor(slide.backgroundColor, -20)};stop-opacity:1" />
      </linearGradient>
    </defs>
  `
    : "";

  // Word wrap main text
  const maxCharsPerLine = Math.floor(width / (fontSize * 0.55));
  const mainLines = wrapText(slide.text, maxCharsPerLine);
  const subtextLines = slide.subtext ? wrapText(slide.subtext, Math.floor(width / (subtextFontSize * 0.55))) : [];

  // Calculate vertical positions
  const totalTextHeight = mainLines.length * lineHeight + (subtextLines.length > 0 ? subtextLines.length * (subtextFontSize * 1.3) + 20 : 0);
  const startY = (height - totalTextHeight) / 2 + fontSize;

  // Generate main text elements
  const mainTextElements = mainLines
    .map((line, index) => {
      const fill = slide.type === "intro" || slide.type === "cta" ? "url(#textGradient)" : slide.textColor;
      return `<text x="${width / 2}" y="${startY + index * lineHeight}" text-anchor="middle" fill="${fill}" font-family="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="-0.02em">${escapeXml(line)}</text>`;
    })
    .join("\n");

  // Generate subtext elements
  const subtextStartY = startY + mainLines.length * lineHeight + 30;
  const subtextElements = subtextLines
    .map((line, index) => {
      return `<text x="${width / 2}" y="${subtextStartY + index * (subtextFontSize * 1.3)}" text-anchor="middle" fill="${slide.textColor}99" font-family="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${subtextFontSize}" font-weight="400">${escapeXml(line)}</text>`;
    })
    .join("\n");

  // Accent bar for intro/outro
  const accentBar =
    slide.type === "intro" || slide.type === "outro"
      ? `<rect x="${width / 2 - 40}" y="${startY - fontSize - 30}" width="80" height="4" fill="url(#textGradient)" rx="2"/>`
      : "";

  // Progress bar
  const progressBar = slide.showProgressBar
    ? `
    <rect x="60" y="${height - 30}" width="${width - 120}" height="3" fill="${slide.textColor}20" rx="1.5"/>
    <rect x="60" y="${height - 30}" width="${(width - 120) * 0.5}" height="3" fill="${slide.accentColor}" rx="1.5"/>
  `
    : "";

  // Decorative elements for visual interest
  const decorativeElements = generateDecorativeElements(slide, width, height);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  ${gradientDef}
  <rect width="100%" height="100%" fill="url(#bgGradient)"/>
  ${decorativeElements}
  ${accentBar}
  ${mainTextElements}
  ${subtextElements}
  ${progressBar}
</svg>`;
}

/**
 * Generate decorative background elements
 */
function generateDecorativeElements(slide: SlideData, width: number, height: number): string {
  if (slide.type === "intro" || slide.type === "outro") {
    // Subtle gradient orbs for dramatic effect
    return `
      <circle cx="${width * 0.2}" cy="${height * 0.3}" r="${width * 0.15}" fill="${slide.accentColor}08"/>
      <circle cx="${width * 0.8}" cy="${height * 0.7}" r="${width * 0.2}" fill="${slide.accentColor}06"/>
    `;
  }
  return "";
}

/**
 * Word wrap text for SVG
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length > maxCharsPerLine) {
      if (currentLine) {
        lines.push(currentLine.trim());
      }
      currentLine = word + " ";
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines;
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
 * Adjust color brightness
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Generate and upload thumbnail
 */
export async function generateThumbnail(
  slide: SlideData,
  videoId: string,
  options: { width?: number; height?: number } = {}
): Promise<string> {
  const width = options.width || 1920;
  const height = options.height || 1080;

  const svg = generateSlideSVG(slide, width, height);
  const buffer = Buffer.from(svg);

  const blob = await put(`thumbnails/${videoId}.svg`, buffer, {
    access: "public",
    contentType: "image/svg+xml",
  });

  return blob.url;
}

/**
 * Generate PNG thumbnail using canvas (for better compatibility)
 */
export async function generatePNGThumbnail(
  slide: SlideData,
  videoId: string,
  options: { width?: number; height?: number } = {}
): Promise<string> {
  // For server-side PNG generation, we'd need canvas or sharp
  // For now, return SVG thumbnail
  return generateThumbnail(slide, videoId, options);
}

/**
 * Calculate total slideshow duration
 */
export function calculateTotalDuration(slides: SlideData[]): number {
  return slides.reduce((total, slide) => total + slide.duration, 0);
}

/**
 * Get slides optimized for FFmpeg processing
 */
export function getSlidesForFFmpeg(slides: SlideData[]): Array<{
  svg: string;
  duration: number;
  title: string;
}> {
  return slides.map((slide) => ({
    svg: generateSlideSVG(slide),
    duration: slide.duration,
    title: slide.text,
  }));
}
