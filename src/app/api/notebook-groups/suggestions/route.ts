import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

interface SuggestedGroup {
  name: string;
  description: string;
  emoji: string;
  color: string;
  notebooks: Array<{
    id: string;
    title: string;
    description: string | null;
    emoji: string | null;
    similarity: number;
  }>;
  matchReason: string;
}

// Common keywords and their related terms for categorization
const CATEGORY_KEYWORDS: Record<
  string,
  { keywords: string[]; emoji: string; color: string }
> = {
  "AP World History": {
    keywords: [
      "ap world",
      "apwh",
      "world history",
      "ancient civilizations",
      "classical period",
      "medieval",
      "renaissance",
      "enlightenment",
      "industrial revolution",
      "imperialism",
      "world war",
      "cold war",
      "globalization",
      "unit 1",
      "unit 2",
      "unit 3",
      "unit 4",
      "unit 5",
      "unit 6",
      "unit 7",
      "unit 8",
      "unit 9",
    ],
    emoji: "🌍",
    color: "#10b981",
  },
  "AP US History": {
    keywords: [
      "apush",
      "ap us history",
      "american history",
      "colonial",
      "revolution",
      "civil war",
      "reconstruction",
      "gilded age",
      "progressive era",
      "great depression",
      "new deal",
    ],
    emoji: "🇺🇸",
    color: "#3b82f6",
  },
  "AP European History": {
    keywords: [
      "ap euro",
      "european history",
      "french revolution",
      "napoleonic",
      "victorian",
      "world war",
      "european union",
    ],
    emoji: "🏰",
    color: "#8b5cf6",
  },
  Biology: {
    keywords: [
      "biology",
      "cell",
      "genetics",
      "evolution",
      "ecology",
      "anatomy",
      "physiology",
      "dna",
      "rna",
      "protein",
      "mitosis",
      "meiosis",
    ],
    emoji: "🧬",
    color: "#22c55e",
  },
  Chemistry: {
    keywords: [
      "chemistry",
      "chemical",
      "atoms",
      "molecules",
      "reaction",
      "organic",
      "inorganic",
      "periodic table",
      "bonding",
    ],
    emoji: "🧪",
    color: "#f59e0b",
  },
  Physics: {
    keywords: [
      "physics",
      "mechanics",
      "thermodynamics",
      "electricity",
      "magnetism",
      "waves",
      "optics",
      "quantum",
      "relativity",
    ],
    emoji: "⚛️",
    color: "#6366f1",
  },
  Mathematics: {
    keywords: [
      "math",
      "calculus",
      "algebra",
      "geometry",
      "trigonometry",
      "statistics",
      "probability",
      "linear algebra",
    ],
    emoji: "📐",
    color: "#ef4444",
  },
  "Computer Science": {
    keywords: [
      "computer science",
      "programming",
      "algorithm",
      "data structure",
      "software",
      "coding",
      "python",
      "java",
      "javascript",
    ],
    emoji: "💻",
    color: "#0ea5e9",
  },
  Literature: {
    keywords: [
      "literature",
      "novel",
      "poetry",
      "shakespeare",
      "essay",
      "literary",
      "author",
      "narrative",
    ],
    emoji: "📚",
    color: "#a855f7",
  },
  Economics: {
    keywords: [
      "economics",
      "economy",
      "microeconomics",
      "macroeconomics",
      "supply",
      "demand",
      "market",
      "inflation",
    ],
    emoji: "📊",
    color: "#14b8a6",
  },
  Psychology: {
    keywords: [
      "psychology",
      "behavior",
      "cognitive",
      "mental",
      "brain",
      "neuroscience",
      "therapy",
      "development",
    ],
    emoji: "🧠",
    color: "#ec4899",
  },
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1).split(/\s+/));
  const words2 = new Set(normalizeText(text2).split(/\s+/));
  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  return intersection.size / union.size;
}

function findMatchingCategory(
  title: string,
  description: string | null,
  sourceTitles: string[]
): { category: string; score: number; emoji: string; color: string } | null {
  const searchText = normalizeText(
    [title, description || "", ...sourceTitles].join(" ")
  );

  let bestMatch: {
    category: string;
    score: number;
    emoji: string;
    color: string;
  } | null = null;

  for (const [category, { keywords, emoji, color }] of Object.entries(
    CATEGORY_KEYWORDS
  )) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (searchText.includes(normalizeText(keyword))) {
        matchCount++;
      }
    }
    const score = matchCount / keywords.length;

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score, emoji, color };
    }
  }

  return bestMatch;
}

// GET /api/notebook-groups/suggestions - Get AI-powered grouping suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all ungrouped notebooks with their sources
    const ungroupedNotebooks = await prisma.notebook.findMany({
      where: {
        userId: session.user.id,
        groupId: null,
      },
      include: {
        NotebookSource: {
          select: {
            title: true,
            content: true,
          },
          take: 10,
        },
      },
    });

    if (ungroupedNotebooks.length === 0) {
      return NextResponse.json({
        suggestions: [],
        message: "No ungrouped notebooks to analyze",
      });
    }

    // Group notebooks by detected category
    const categoryGroups: Map<
      string,
      {
        notebooks: Array<{
          id: string;
          title: string;
          description: string | null;
          emoji: string | null;
          similarity: number;
        }>;
        emoji: string;
        color: string;
        scores: number[];
      }
    > = new Map();

    // Also track title similarity clusters for uncategorized notebooks
    const uncategorizedNotebooks: Array<{
      id: string;
      title: string;
      description: string | null;
      emoji: string | null;
      sourceTitles: string[];
    }> = [];

    for (const notebook of ungroupedNotebooks) {
      const sourceTitles = notebook.NotebookSource.map((s) => s.title);
      const match = findMatchingCategory(
        notebook.title,
        notebook.description,
        sourceTitles
      );

      if (match && match.score >= 0.1) {
        const existing = categoryGroups.get(match.category);
        if (existing) {
          existing.notebooks.push({
            id: notebook.id,
            title: notebook.title,
            description: notebook.description,
            emoji: notebook.emoji,
            similarity: match.score,
          });
          existing.scores.push(match.score);
        } else {
          categoryGroups.set(match.category, {
            notebooks: [
              {
                id: notebook.id,
                title: notebook.title,
                description: notebook.description,
                emoji: notebook.emoji,
                similarity: match.score,
              },
            ],
            emoji: match.emoji,
            color: match.color,
            scores: [match.score],
          });
        }
      } else {
        uncategorizedNotebooks.push({
          id: notebook.id,
          title: notebook.title,
          description: notebook.description,
          emoji: notebook.emoji,
          sourceTitles,
        });
      }
    }

    // Create suggestions from category groups
    const suggestions: SuggestedGroup[] = [];

    for (const [category, data] of categoryGroups.entries()) {
      if (data.notebooks.length >= 2) {
        // Only suggest groups with 2+ notebooks
        const avgScore =
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        suggestions.push({
          name: category,
          description: `Notebooks related to ${category}`,
          emoji: data.emoji,
          color: data.color,
          notebooks: data.notebooks,
          matchReason: `${data.notebooks.length} notebooks matched ${Math.round(avgScore * 100)}% of ${category} keywords`,
        });
      }
    }

    // Try to find clusters among uncategorized notebooks based on title similarity
    if (uncategorizedNotebooks.length >= 2) {
      const titleClusters: Map<
        string,
        Array<{
          id: string;
          title: string;
          description: string | null;
          emoji: string | null;
          similarity: number;
        }>
      > = new Map();

      // Extract common patterns from titles
      for (let i = 0; i < uncategorizedNotebooks.length; i++) {
        const notebook = uncategorizedNotebooks[i];
        const words = notebook.title.split(/\s+/).filter((w) => w.length > 3);

        for (const word of words) {
          const normalWord = word.toLowerCase();
          // Check if this word appears in other notebooks
          const matching = uncategorizedNotebooks.filter(
            (n, j) =>
              j !== i && n.title.toLowerCase().includes(normalWord)
          );

          if (matching.length >= 1) {
            // Found at least 2 notebooks with this word
            const key = normalWord;
            const cluster = titleClusters.get(key) || [];

            if (!cluster.some((n) => n.id === notebook.id)) {
              cluster.push({
                id: notebook.id,
                title: notebook.title,
                description: notebook.description,
                emoji: notebook.emoji,
                similarity: 0.5,
              });
            }

            for (const match of matching) {
              if (!cluster.some((n) => n.id === match.id)) {
                cluster.push({
                  id: match.id,
                  title: match.title,
                  description: match.description,
                  emoji: match.emoji,
                  similarity: 0.5,
                });
              }
            }

            titleClusters.set(key, cluster);
          }
        }
      }

      // Add title-based clusters as suggestions
      for (const [keyword, cluster] of titleClusters.entries()) {
        if (cluster.length >= 2 && keyword.length > 4) {
          const capitalizedKeyword =
            keyword.charAt(0).toUpperCase() + keyword.slice(1);
          suggestions.push({
            name: `${capitalizedKeyword} Related`,
            description: `Notebooks containing "${keyword}" in their titles`,
            emoji: "📑",
            color: "#6b7280",
            notebooks: cluster,
            matchReason: `${cluster.length} notebooks share the keyword "${keyword}"`,
          });
        }
      }
    }

    // Sort by number of notebooks (largest groups first)
    suggestions.sort((a, b) => b.notebooks.length - a.notebooks.length);

    // Get existing groups to avoid suggesting duplicates
    const existingGroups = await prisma.notebookGroup.findMany({
      where: { userId: session.user.id },
      select: { name: true },
    });
    const existingNames = new Set(
      existingGroups.map((g) => normalizeText(g.name))
    );

    // Filter out suggestions that match existing groups
    const filteredSuggestions = suggestions.filter(
      (s) => !existingNames.has(normalizeText(s.name))
    );

    return NextResponse.json({
      suggestions: filteredSuggestions.slice(0, 10), // Limit to top 10 suggestions
      totalUngrouped: ungroupedNotebooks.length,
    });
  } catch (error) {
    console.error("Error generating grouping suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

// POST /api/notebook-groups/suggestions - Apply a suggestion (create group and assign notebooks)
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, emoji, color, notebookIds } = body;

    if (!name || !notebookIds || !Array.isArray(notebookIds)) {
      return NextResponse.json(
        { error: "name and notebookIds array are required" },
        { status: 400 }
      );
    }

    // Check if group already exists
    const existingGroup = await prisma.notebookGroup.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name.trim(),
        },
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 409 }
      );
    }

    // Verify all notebooks belong to user
    const notebooks = await prisma.notebook.findMany({
      where: {
        id: { in: notebookIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (notebooks.length === 0) {
      return NextResponse.json(
        { error: "No valid notebooks found" },
        { status: 400 }
      );
    }

    // Get max order
    const maxOrder = await prisma.notebookGroup.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    // Create group and assign notebooks in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const group = await tx.notebookGroup.create({
        data: {
          userId: session.user.id,
          name: name.trim(),
          description: description?.trim() || null,
          emoji: emoji || "📁",
          color: color || "#8b5cf6",
          order: (maxOrder?.order ?? -1) + 1,
        },
      });

      await tx.notebook.updateMany({
        where: {
          id: { in: notebooks.map((n) => n.id) },
          userId: session.user.id,
        },
        data: { groupId: group.id },
      });

      return tx.notebookGroup.findUnique({
        where: { id: group.id },
        include: {
          Notebooks: {
            include: {
              _count: {
                select: {
                  NotebookSource: true,
                  NotebookChat: true,
                  NotebookOutput: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
          },
          _count: {
            select: { Notebooks: true },
          },
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error applying suggestion:", error);
    return NextResponse.json(
      { error: "Failed to apply suggestion" },
      { status: 500 }
    );
  }
}
