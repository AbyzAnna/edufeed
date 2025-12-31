import { inngest } from "./client";
import { generateVideo } from "@/lib/generation";

// Video generation function
export const generateVideoFunction = inngest.createFunction(
  {
    id: "generate-video",
    name: "Generate Video",
    retries: 2,
  },
  { event: "video/generate" },
  async ({ event, step }) => {
    const { videoId, sourceId, generationType } = event.data;

    // Step 1: Generate the video
    const result = await step.run("generate-video", async () => {
      return await generateVideo(videoId, sourceId, generationType);
    });

    if (!result.success) {
      throw new Error(result.error || "Video generation failed");
    }

    return {
      success: true,
      videoId,
      videoUrl: result.videoUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
    };
  }
);

// Parse source content function
export const parseSourceFunction = inngest.createFunction(
  {
    id: "parse-source",
    name: "Parse Source Content",
    retries: 1,
  },
  { event: "source/parse" },
  async ({ event, step }) => {
    const { sourceId, type, url, fileUrl } = event.data;

    const result = await step.run("parse-content", async () => {
      const { parseURL, parsePDF } = await import("@/lib/generation/parser");
      const prisma = (await import("@/lib/prisma")).default;

      let content = "";

      if (type === "URL" && url) {
        const parsed = await parseURL(url);
        content = parsed.content;
      } else if (type === "PDF" && fileUrl) {
        // In production, fetch the PDF from storage and parse it
        // For now, we'll skip this step
        content = "";
      }

      if (content) {
        await prisma.source.update({
          where: { id: sourceId },
          data: { content },
        });
      }

      return { content: content.length };
    });

    return result;
  }
);

// Export all functions for the serve handler
export const functions = [generateVideoFunction, parseSourceFunction];
