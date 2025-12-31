import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VideoScript {
  title: string;
  hook: string;
  mainPoints: string[];
  conclusion: string;
  fullScript: string;
  visualPrompts: string[];
  estimatedDuration: number; // in seconds
}

/**
 * Generate a video script from source content
 */
export async function generateVideoScript(
  content: string,
  title: string,
  targetDuration: number = 60 // seconds
): Promise<VideoScript> {
  const wordsPerSecond = 2.5; // Average speaking rate
  const targetWords = Math.round(targetDuration * wordsPerSecond);

  const prompt = `You are an expert educational content creator. Create a compelling short-form video script from the following content.

SOURCE CONTENT:
Title: ${title}
Content: ${content.slice(0, 8000)}

REQUIREMENTS:
- Target duration: ${targetDuration} seconds (~${targetWords} words for narration)
- Style: Engaging, TikTok/Reels format
- Start with a hook that grabs attention in the first 3 seconds
- Break down complex concepts into digestible points
- End with a memorable takeaway

OUTPUT FORMAT (JSON):
{
  "title": "Catchy video title",
  "hook": "Opening hook (1-2 sentences, attention-grabbing)",
  "mainPoints": ["Point 1", "Point 2", "Point 3"],
  "conclusion": "Memorable closing statement",
  "fullScript": "The complete narration script",
  "visualPrompts": ["Visual description for each section"],
  "estimatedDuration": ${targetDuration}
}

Respond with valid JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational content creator specializing in short-form video scripts. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      title: result.title || title,
      hook: result.hook || "",
      mainPoints: result.mainPoints || [],
      conclusion: result.conclusion || "",
      fullScript: result.fullScript || "",
      visualPrompts: result.visualPrompts || [],
      estimatedDuration: result.estimatedDuration || targetDuration,
    };
  } catch (error) {
    console.error("Error generating video script:", error);
    throw new Error("Failed to generate video script");
  }
}

/**
 * Generate key concepts from content for visual slides
 */
export async function extractKeyConcepts(
  content: string,
  maxConcepts: number = 5
): Promise<string[]> {
  const prompt = `Extract the ${maxConcepts} most important concepts or facts from this educational content. Return them as a JSON array of short, memorable statements (max 15 words each).

Content: ${content.slice(0, 5000)}

Respond with a JSON array only, e.g.: ["Concept 1", "Concept 2", ...]`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.concepts || result || [];
  } catch (error) {
    console.error("Error extracting concepts:", error);
    return [];
  }
}

/**
 * Generate a summary of the content
 */
export async function generateSummary(
  content: string,
  maxLength: number = 200
): Promise<string> {
  const prompt = `Summarize this educational content in ${maxLength} characters or less. Make it engaging and informative.

Content: ${content.slice(0, 5000)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 100,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating summary:", error);
    return content.slice(0, maxLength);
  }
}
