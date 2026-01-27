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
  const startTime = Date.now();
  console.log(`[Source Processor] Starting ${type} processing for source ${sourceId}`);

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

    const processingTime = Date.now() - startTime;
    console.log(`[Source Processor] Content extraction completed in ${processingTime}ms`);

    // Update source with processed content - mark as COMPLETED immediately
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

    // Create embeddings in the background (non-blocking) - don't wait for this
    if (!result.error && result.content && result.content.length >= 50) {
      createEmbeddings(sourceId, result.content).catch((embError) => {
        console.error(`[Source Processor] Embedding creation failed (non-critical):`, embError);
      });
    }

    const totalTime = Date.now() - startTime;
    console.log(`[Source Processor] Source ${sourceId} processed successfully in ${totalTime}ms`);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[Source Processor] Failed for source ${sourceId}: ${errorMessage}`);

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

// Process PDF with timeout and better error handling
async function processPdf(fileUrl: string): Promise<ProcessResult> {
  const TIMEOUT_MS = 60000; // 60 second timeout for PDF processing

  try {
    console.log(`[PDF Processor] Starting processing for: ${fileUrl.substring(0, 100)}...`);

    // First, fetch the PDF as a buffer (more reliable than letting pdf-parse fetch)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let pdfBuffer: ArrayBuffer;
    try {
      console.log('[PDF Processor] Fetching PDF file...');
      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/pdf',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }

      pdfBuffer = await response.arrayBuffer();
      console.log(`[PDF Processor] PDF fetched, size: ${(pdfBuffer.byteLength / 1024).toFixed(2)} KB`);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('PDF download timed out. The file may be too large.');
      }
      throw fetchError;
    }

    // Use pdf-parse v2 API with buffer
    const { PDFParse } = await import("pdf-parse");

    console.log('[PDF Processor] Parsing PDF content...');
    const parser = new PDFParse(Buffer.from(pdfBuffer));
    const result = await parser.getText();

    const content = result.text.replace(/\s+/g, " ").trim();
    const wordCount = content.split(/\s+/).length;
    console.log(`[PDF Processor] Extracted ${wordCount} words`);

    // Get document info
    let info = {};
    let numPages = 0;
    try {
      const infoResult = await parser.getInfo();
      info = infoResult.info || {};
      numPages = infoResult.total || 0;
    } catch {
      // Info extraction failed, continue with text only
      console.log('[PDF Processor] Could not extract PDF metadata');
    }

    if (!content || wordCount < 10) {
      console.log('[PDF Processor] Warning: Very little text extracted from PDF');
      return {
        content: content || `[PDF Document] - Could not extract text. The PDF may be scanned or image-based. Try uploading as an image for OCR.`,
        wordCount: wordCount || 20,
        metadata: {
          pages: numPages,
          info,
          warning: 'Low text content extracted',
        },
      };
    }

    console.log(`[PDF Processor] Success! ${numPages} pages, ${wordCount} words`);
    return {
      content,
      wordCount,
      metadata: {
        pages: numPages,
        info,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to process PDF";
    console.error(`[PDF Processor] Error: ${errorMessage}`);
    return {
      content: "",
      wordCount: 0,
      error: errorMessage,
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
    const workersUrl = process.env.WORKERS_URL || "https://edufeed-ai-worker.steep-mouse-b843.workers.dev";

    const response = await fetch(`${workersUrl}/api/youtube/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });

    if (response.ok) {
      const data = await response.json() as {
        transcript?: string;
        title?: string;
        duration?: number;
        channelName?: string;
        hasTranscript?: boolean;
        wordCount?: number;
      };

      const content = data.transcript || "";
      const wordCount = data.wordCount || content.split(/\s+/).filter(Boolean).length;

      // Even if no transcript, we still have useful metadata
      return {
        content: content || `[YouTube Video: ${data.title || url}] - Transcript extraction in progress or not available.`,
        wordCount: wordCount || 0,
        metadata: {
          videoId,
          title: data.title,
          duration: data.duration,
          channelName: data.channelName,
          hasTranscript: data.hasTranscript,
          url,
        },
      };
    }

    // Fallback: store video info without transcript
    return {
      content: `[YouTube Video: ${url}] - Unable to extract transcript. The video may not have captions enabled.`,
      wordCount: 15,
      metadata: { videoId, url, hasTranscript: false },
    };
  } catch (error) {
    return {
      content: `[YouTube Video: ${url}] - Processing failed. Please try again.`,
      wordCount: 8,
      error: error instanceof Error ? error.message : "Failed to process YouTube video",
      metadata: { url },
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
    const workersUrl = process.env.WORKERS_URL || "https://edufeed-ai-worker.steep-mouse-b843.workers.dev";

    const response = await fetch(`${workersUrl}/api/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: fileUrl }),
    });

    if (response.ok) {
      const data = await response.json() as { text?: string; success?: boolean };
      const content = data.text || "";
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      if (content) {
        return {
          content,
          wordCount,
          metadata: { imageUrl: fileUrl, ocrSuccess: true },
        };
      }
    }

    // Fallback: store image reference
    return {
      content: `[Image: ${fileUrl}] - Text extraction was not successful. The image may not contain readable text.`,
      wordCount: 12,
      metadata: { imageUrl: fileUrl, ocrSuccess: false },
    };
  } catch (error) {
    return {
      content: `[Image: ${fileUrl}] - Processing failed.`,
      wordCount: 4,
      error: error instanceof Error ? error.message : "Failed to process image",
      metadata: { imageUrl: fileUrl },
    };
  }
}

// Process Audio (transcription)
async function processAudio(fileUrl: string): Promise<ProcessResult> {
  try {
    const workersUrl = process.env.WORKERS_URL || "https://edufeed-ai-worker.steep-mouse-b843.workers.dev";

    const response = await fetch(`${workersUrl}/api/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl: fileUrl }),
    });

    if (response.ok) {
      const data = await response.json() as { transcript?: string; duration?: number; success?: boolean };
      const content = data.transcript || "";
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      if (content) {
        return {
          content,
          wordCount,
          metadata: {
            audioUrl: fileUrl,
            duration: data.duration,
            transcriptionSuccess: true,
          },
        };
      }
    }

    // Fallback: store audio reference
    return {
      content: `[Audio: ${fileUrl}] - Transcription was not successful. Please try again or add content manually.`,
      wordCount: 12,
      metadata: { audioUrl: fileUrl, transcriptionSuccess: false },
    };
  } catch (error) {
    return {
      content: `[Audio: ${fileUrl}] - Processing failed.`,
      wordCount: 4,
      error: error instanceof Error ? error.message : "Failed to process audio",
      metadata: { audioUrl: fileUrl },
    };
  }
}

// Create embeddings for vector search (RAG)
async function createEmbeddings(sourceId: string, content: string): Promise<void> {
  try {
    // Skip if content is too short
    if (!content || content.length < 50) {
      return;
    }

    // Chunk content into smaller pieces (max ~500 tokens each)
    const chunks = chunkText(content, 2000); // ~500 words per chunk
    const workersUrl = process.env.WORKERS_URL || "https://edufeed-ai-worker.steep-mouse-b843.workers.dev";

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Get embedding from Cloudflare Workers AI
      let vectorId: string | undefined;

      try {
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
          const data = await response.json() as { vectorId?: string };
          vectorId = data.vectorId;
        }
      } catch {
        // Embedding generation failed, continue without vectorId
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
