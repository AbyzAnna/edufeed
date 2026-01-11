import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VideoSegment {
  title: string;
  narration: string;
  visualDescription: string;
  duration: number; // seconds
  visualType: "intro" | "content" | "transition" | "outro";
  onScreenText?: string;
  backgroundMood?: string;
}

export interface VideoScript {
  title: string;
  hook: string;
  mainPoints: string[];
  conclusion: string;
  fullScript: string;
  visualPrompts: string[];
  estimatedDuration: number;
  // New professional fields
  segments: VideoSegment[];
  targetAudience: string;
  tone: string;
  callToAction: string;
  metadata: {
    topic: string;
    complexity: "beginner" | "intermediate" | "advanced";
    category: string;
  };
}

/**
 * Generate a professional YouTube-quality video script from source content
 * Uses advanced prompting for engaging, educational narration
 */
export async function generateVideoScript(
  content: string,
  title: string,
  targetDuration: number = 90 // seconds - longer for better quality
): Promise<VideoScript> {
  const wordsPerSecond = 2.5; // Average speaking rate for clear narration
  const targetWords = Math.round(targetDuration * wordsPerSecond);

  // Calculate segment distribution
  const introSeconds = 8;
  const outroSeconds = 10;
  const contentSeconds = targetDuration - introSeconds - outroSeconds;
  const segmentsCount = Math.max(3, Math.min(6, Math.floor(contentSeconds / 15))); // 15-20s per main segment

  const prompt = `You are a world-class educational video scriptwriter who creates viral YouTube content. Your scripts are known for:
- Captivating hooks that create immediate curiosity
- Clear, memorable explanations of complex topics
- Dynamic pacing that maintains viewer attention
- Professional narration that sounds natural when spoken
- Strategic use of visual cues and on-screen text

SOURCE MATERIAL:
Title: ${title}
Content: ${content.slice(0, 12000)}

SCRIPT REQUIREMENTS:
- Total duration: ${targetDuration} seconds (~${targetWords} words for narration)
- Number of content segments: ${segmentsCount}
- Format: Professional YouTube educational video (NOT TikTok/Reels - this is longer-form content)

STRUCTURE GUIDELINES:

1. INTRO (${introSeconds} seconds):
   - Start with a pattern-interrupt hook (question, surprising fact, or bold statement)
   - Create a "curiosity gap" - make them NEED to know the answer
   - Briefly preview what they'll learn
   - NO generic openings like "Hey guys" or "Welcome to..."

2. CONTENT SEGMENTS (${segmentsCount} segments, ~${Math.round(contentSeconds / segmentsCount)}s each):
   - Each segment should teach ONE clear concept
   - Use the "BUT" and "THEREFORE" technique (not "AND THEN")
   - Include specific examples, numbers, or analogies
   - Build on previous segments logically
   - Add micro-hooks between segments to maintain interest

3. OUTRO (${outroSeconds} seconds):
   - Summarize the key transformation/insight
   - Strong call-to-action (specific, not generic)
   - End with a memorable statement or callback to the hook

NARRATION STYLE:
- Conversational but authoritative (imagine explaining to a smart friend)
- Use "you" to address the viewer directly
- Vary sentence length for natural rhythm
- Include brief pauses (marked with "...") for emphasis
- Avoid jargon unless explained
- Use power words: discover, secret, proven, essential, transform, unlock

VISUAL DESCRIPTIONS:
For each segment, describe visuals that:
- Support the narration (not just repeat it)
- Use metaphors and visual analogies
- Include text overlays for key points
- Suggest transitions between segments

OUTPUT FORMAT (JSON):
{
  "title": "Compelling video title (YouTube-optimized, creates curiosity)",
  "hook": "Opening 2-3 sentences that stop the scroll",
  "mainPoints": ["Key point 1", "Key point 2", ...],
  "conclusion": "Memorable closing statement",
  "fullScript": "Complete narration script with [PAUSE] markers",
  "visualPrompts": ["Visual description for each major section"],
  "estimatedDuration": ${targetDuration},
  "segments": [
    {
      "title": "Segment title for on-screen display",
      "narration": "Full narration text for this segment",
      "visualDescription": "Detailed visual description for AI image generation",
      "duration": <seconds>,
      "visualType": "intro|content|transition|outro",
      "onScreenText": "Key text to display on screen",
      "backgroundMood": "cinematic|energetic|calm|dramatic|inspiring"
    }
  ],
  "targetAudience": "Description of ideal viewer",
  "tone": "professional|casual|inspiring|educational|entertaining",
  "callToAction": "What you want viewers to do",
  "metadata": {
    "topic": "Main topic",
    "complexity": "beginner|intermediate|advanced",
    "category": "education|science|history|technology|lifestyle|business"
  }
}

CRITICAL RULES:
1. NEVER use filler phrases like "So, let's dive in" or "Without further ado"
2. NEVER start with "In this video, we're going to..."
3. Every sentence must add value - cut ruthlessly
4. Make complex things simple, but never dumb things down
5. The viewer should feel SMARTER after watching

Respond with valid JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use full GPT-4o for quality
      messages: [
        {
          role: "system",
          content: `You are an elite educational content creator with 10+ years experience producing viral YouTube videos. Your specialty is transforming complex information into captivating, binge-worthy content that educates AND entertains. You understand YouTube's algorithm and viewer psychology. Your scripts consistently achieve 70%+ retention rates. Always respond with valid JSON.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8, // Slightly higher for creativity
      max_tokens: 4000, // More tokens for detailed scripts
      response_format: { type: "json_object" },
    });

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      console.error("No content in OpenAI response for video script");
      throw new Error("No content in OpenAI response");
    }
    const result = JSON.parse(messageContent);

    // Ensure all segments have proper structure
    const segments: VideoSegment[] = (result.segments || []).map((seg: Partial<VideoSegment>, idx: number) => ({
      title: seg.title || `Section ${idx + 1}`,
      narration: seg.narration || "",
      visualDescription: seg.visualDescription || "Educational visual content",
      duration: seg.duration || Math.round(targetDuration / (result.segments?.length || 5)),
      visualType: seg.visualType || "content",
      onScreenText: seg.onScreenText || seg.title,
      backgroundMood: seg.backgroundMood || "cinematic",
    }));

    // If no segments were generated, create them from mainPoints
    if (segments.length === 0 && result.mainPoints && result.mainPoints.length > 0) {
      const segmentDuration = Math.round((targetDuration - introSeconds - outroSeconds) / result.mainPoints.length);

      // Add intro segment
      segments.push({
        title: "Introduction",
        narration: result.hook || "",
        visualDescription: "Dynamic opening visual with bold typography introducing the topic",
        duration: introSeconds,
        visualType: "intro",
        onScreenText: result.title || title,
        backgroundMood: "dramatic",
      });

      // Add content segments
      result.mainPoints.forEach((point: string, idx: number) => {
        segments.push({
          title: `Key Insight ${idx + 1}`,
          narration: point,
          visualDescription: result.visualPrompts?.[idx] || "Educational infographic explaining the concept",
          duration: segmentDuration,
          visualType: "content",
          onScreenText: point.split(".")[0]?.slice(0, 50) || point.slice(0, 50),
          backgroundMood: idx % 2 === 0 ? "energetic" : "calm",
        });
      });

      // Add outro segment
      segments.push({
        title: "Summary",
        narration: result.conclusion || "",
        visualDescription: "Inspiring closing visual with call-to-action text",
        duration: outroSeconds,
        visualType: "outro",
        onScreenText: result.callToAction || "Subscribe for more",
        backgroundMood: "inspiring",
      });
    }

    return {
      title: result.title || title,
      hook: result.hook || "",
      mainPoints: result.mainPoints || [],
      conclusion: result.conclusion || "",
      fullScript: result.fullScript || segments.map(s => s.narration).join(" "),
      visualPrompts: result.visualPrompts || segments.map(s => s.visualDescription),
      estimatedDuration: result.estimatedDuration || targetDuration,
      segments,
      targetAudience: result.targetAudience || "Curious learners seeking to expand their knowledge",
      tone: result.tone || "educational",
      callToAction: result.callToAction || "Like and subscribe for more insights",
      metadata: {
        topic: result.metadata?.topic || title,
        complexity: result.metadata?.complexity || "intermediate",
        category: result.metadata?.category || "education",
      },
    };
  } catch (error) {
    console.error("Error generating video script:", error);
    throw new Error("Failed to generate video script");
  }
}

/**
 * Generate enhanced visual prompts for AI image generation
 */
export async function generateVisualPrompts(
  segments: VideoSegment[],
  style: string = "modern educational"
): Promise<string[]> {
  const prompts: string[] = [];

  for (const segment of segments) {
    const stylePrefix = getStylePrefix(segment.backgroundMood || "cinematic", style);

    const enhancedPrompt = `${stylePrefix}, ${segment.visualDescription}, ${getVisualTypeStyle(segment.visualType)}, professional quality, 4K resolution, clean composition`;

    prompts.push(enhancedPrompt);
  }

  return prompts;
}

function getStylePrefix(mood: string, baseStyle: string): string {
  const moodStyles: Record<string, string> = {
    cinematic: "Cinematic lighting, dramatic shadows, professional color grading",
    energetic: "Vibrant colors, dynamic composition, high contrast",
    calm: "Soft lighting, muted colors, serene atmosphere",
    dramatic: "High contrast, bold shadows, intense atmosphere",
    inspiring: "Golden hour lighting, warm tones, uplifting atmosphere",
  };

  return `${moodStyles[mood] || moodStyles.cinematic}, ${baseStyle}`;
}

function getVisualTypeStyle(type: string): string {
  const typeStyles: Record<string, string> = {
    intro: "bold typography, attention-grabbing, centered composition",
    content: "informative infographic, clean layout, supporting visuals",
    transition: "smooth gradient, minimal design, connecting elements",
    outro: "call-to-action focused, memorable imagery, strong ending",
  };

  return typeStyles[type] || typeStyles.content;
}

/**
 * Generate key concepts from content for visual slides
 */
export async function extractKeyConcepts(
  content: string,
  maxConcepts: number = 5
): Promise<string[]> {
  const prompt = `Extract the ${maxConcepts} most important concepts or facts from this educational content.

For each concept:
- Make it a complete, memorable statement
- Include specific details, numbers, or examples when available
- Write it as if explaining to someone who knows nothing about the topic
- Maximum 20 words each

Content: ${content.slice(0, 8000)}

Respond with a JSON object containing a "concepts" array, e.g.: {"concepts": ["Concept 1", "Concept 2", ...]}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at distilling complex information into clear, memorable key points.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const conceptsContent = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(conceptsContent);
    return result.concepts || [];
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
  const prompt = `Write a compelling video description for YouTube (${maxLength} characters max).

The description should:
- Hook readers in the first line
- Summarize what they'll learn
- Include relevant keywords naturally
- End with a reason to watch NOW

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
      temperature: 0.6,
      max_tokens: 150,
    });

    return response.choices[0].message.content?.trim() || "";
  } catch (error) {
    console.error("Error generating summary:", error);
    return content.slice(0, maxLength);
  }
}

/**
 * Enhance an existing script with better narration
 */
export async function enhanceScript(
  script: VideoScript
): Promise<VideoScript> {
  const prompt = `Improve this video script narration to be more engaging and professional.

Current Script:
${script.fullScript}

Requirements:
- Make it more conversational and natural
- Add strategic pauses [PAUSE] for emphasis
- Vary sentence length for better rhythm
- Remove any awkward phrasing
- Ensure it sounds great when read aloud

Return the enhanced full script text only, no JSON wrapper.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional voice-over script editor. Your job is to make scripts sound natural and engaging when spoken aloud.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 2000,
    });

    const enhancedScript = response.choices[0].message.content?.trim() || script.fullScript;

    return {
      ...script,
      fullScript: enhancedScript,
    };
  } catch (error) {
    console.error("Error enhancing script:", error);
    return script;
  }
}
