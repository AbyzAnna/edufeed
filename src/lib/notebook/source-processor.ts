import { NotebookSourceType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface ProcessResult {
  content: string;
  wordCount: number;
  metadata?: Prisma.InputJsonValue;
  error?: string;
}

// Main processor that routes to specific handlers
export async function processSource(
  sourceId: string,
  type: NotebookSourceType,
  url?: string,
  rawContent?: string
): Promise<ProcessResult> {
  try {
    // Update status to processing
    await prisma.notebookSource.update({
      where: { id: sourceId },
      data: { status: "PROCESSING" },
    });

    let result: ProcessResult;

    switch (type) {
      case "URL":
        result = await processUrl(url!);
        break;
      case "PDF":
        result = await processPdf(url!);
        break;
      case "YOUTUBE":
        result = await processYoutube(url!);
        break;
      case "TEXT":
        result = processText(rawContent!);
        break;
      case "GOOGLE_DOC":
        result = await processGoogleDoc(url!);
        break;
      case "IMAGE":
        result = await processImage(url!);
        break;
      case "AUDIO":
        result = await processAudio(url!);
        break;
      default:
        throw new Error(`Unsupported source type: ${type}`);
    }

    // Update source with processed content
    await prisma.notebookSource.update({
      where: { id: sourceId },
      data: {
        content: result.content,
        wordCount: result.wordCount,
        metadata: result.metadata,
        status: result.error ? "FAILED" : "COMPLETED",
        errorMessage: result.error,
      },
    });

    // Create embeddings if successful
    if (!result.error && result.content) {
      await createEmbeddings(sourceId, result.content);
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.notebookSource.update({
      where: { id: sourceId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });

    return { content: "", wordCount: 0, error: errorMessage };
  }
}

// Process URL - extract webpage content
async function processUrl(url: string): Promise<ProcessResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EduFeed/1.0; +https://edufeed.app)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();

    // Use cheerio for parsing (assuming it's installed)
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script, style, nav, footer, header, aside, .ads, .sidebar").remove();

    // Extract main content
    const content =
      $("article, main, .content, .post-content, .entry-content").text() ||
      $("body").text();

    const cleanedContent = content
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();

    const wordCount = cleanedContent.split(/\s+/).length;

    return {
      content: cleanedContent,
      wordCount,
      metadata: {
        title: $("title").text(),
        description: $('meta[name="description"]').attr("content"),
        url,
      },
    };
  } catch (error) {
    return {
      content: "",
      wordCount: 0,
      error: error instanceof Error ? error.message : "Failed to process URL",
    };
  }
}

// Process PDF
async function processPdf(fileUrl: string): Promise<ProcessResult> {
  try {
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();

    // Use pdf-parse (assuming it's installed)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const pdf = await pdfParse(Buffer.from(buffer));

    const content = pdf.text.replace(/\s+/g, " ").trim();
    const wordCount = content.split(/\s+/).length;

    return {
      content,
      wordCount,
      metadata: {
        pages: pdf.numpages,
        info: pdf.info,
      },
    };
  } catch (error) {
    return {
      content: "",
      wordCount: 0,
      error: error instanceof Error ? error.message : "Failed to process PDF",
    };
  }
}

// Process YouTube video - get transcript
async function processYoutube(url: string): Promise<ProcessResult> {
  try {
    // Extract video ID
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );

    if (!videoIdMatch) {
      throw new Error("Invalid YouTube URL");
    }

    const videoId = videoIdMatch[1];

    // Try to get transcript via YouTube API or third-party service
    // For now, using a placeholder - in production use youtube-transcript-api or similar
    const workersUrl = process.env.WORKERS_URL;

    if (workersUrl) {
      const response = await fetch(`${workersUrl}/api/youtube/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.transcript || "";
        const wordCount = content.split(/\s+/).length;

        return {
          content,
          wordCount,
          metadata: {
            videoId,
            title: data.title,
            duration: data.duration,
            channelName: data.channelName,
          },
        };
      }
    }

    // Fallback: just store metadata without transcript
    return {
      content: `[YouTube Video: ${url}] - Transcript not available. Please try again later.`,
      wordCount: 0,
      metadata: { videoId, url },
    };
  } catch (error) {
    return {
      content: "",
      wordCount: 0,
      error:
        error instanceof Error ? error.message : "Failed to process YouTube video",
    };
  }
}

// Process plain text
function processText(content: string): ProcessResult {
  const cleanedContent = content.trim();
  const wordCount = cleanedContent.split(/\s+/).length;

  return {
    content: cleanedContent,
    wordCount,
    metadata: { type: "plain_text" },
  };
}

// Process Google Doc (placeholder - needs OAuth)
async function processGoogleDoc(url: string): Promise<ProcessResult> {
  // This would require Google Docs API integration
  // For now, return a message
  return {
    content: "",
    wordCount: 0,
    error:
      "Google Docs integration requires OAuth setup. Please export as PDF or copy text.",
    metadata: { url },
  };
}

// Process Image (OCR)
async function processImage(fileUrl: string): Promise<ProcessResult> {
  try {
    const workersUrl = process.env.WORKERS_URL;

    if (workersUrl) {
      const response = await fetch(`${workersUrl}/api/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: fileUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.text || "";
        const wordCount = content.split(/\s+/).length;

        return {
          content,
          wordCount,
          metadata: { imageUrl: fileUrl },
        };
      }
    }

    return {
      content: "",
      wordCount: 0,
      error: "OCR service not available",
    };
  } catch (error) {
    return {
      content: "",
      wordCount: 0,
      error: error instanceof Error ? error.message : "Failed to process image",
    };
  }
}

// Process Audio (transcription)
async function processAudio(fileUrl: string): Promise<ProcessResult> {
  try {
    const workersUrl = process.env.WORKERS_URL;

    if (workersUrl) {
      const response = await fetch(`${workersUrl}/api/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: fileUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.transcript || "";
        const wordCount = content.split(/\s+/).length;

        return {
          content,
          wordCount,
          metadata: {
            audioUrl: fileUrl,
            duration: data.duration,
          },
        };
      }
    }

    return {
      content: "",
      wordCount: 0,
      error: "Transcription service not available",
    };
  } catch (error) {
    return {
      content: "",
      wordCount: 0,
      error: error instanceof Error ? error.message : "Failed to process audio",
    };
  }
}

// Create embeddings for vector search (RAG)
async function createEmbeddings(sourceId: string, content: string): Promise<void> {
  try {
    // Chunk content into smaller pieces (max ~500 tokens each)
    const chunks = chunkText(content, 2000); // ~500 words per chunk

    const workersUrl = process.env.WORKERS_URL;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Get embedding from Cloudflare Workers AI
      let vectorId: string | undefined;

      if (workersUrl) {
        const response = await fetch(`${workersUrl}/api/embed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: chunk,
            sourceId,
            chunkIndex: i,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          vectorId = data.vectorId;
        }
      }

      // Store embedding reference
      await prisma.sourceEmbedding.create({
        data: {
          id: crypto.randomUUID(),
          sourceId,
          chunkIndex: i,
          chunkText: chunk,
          vectorId,
        },
      });
    }
  } catch (error) {
    console.error("Failed to create embeddings:", error);
    // Don't fail the whole process for embedding errors
  }
}

// Helper: Chunk text into smaller pieces
function chunkText(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Export for Inngest job
export async function processSourceJob(sourceId: string): Promise<void> {
  const source = await prisma.notebookSource.findUnique({
    where: { id: sourceId },
  });

  if (!source) {
    throw new Error("Source not found");
  }

  await processSource(
    sourceId,
    source.type,
    source.originalUrl || source.fileUrl || undefined,
    source.rawContent || undefined
  );
}
