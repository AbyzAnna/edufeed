import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { generateFlashcards } from "@/lib/generation/flashcard";

// GET - Fetch user's decks
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decks = await prisma.deck.findMany({
      where: { userId: session.user.id },
      include: {
        Source: {
          select: { id: true, title: true, type: true },
        },
        Flashcard: {
          select: {
            id: true,
            nextReviewDate: true,
          },
        },
        _count: {
          select: { Flashcard: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate due cards for each deck
    const decksWithStats = decks.map((deck) => {
      const now = new Date();
      const dueCards = deck.Flashcard.filter(
        (card) => new Date(card.nextReviewDate) <= now
      ).length;

      return {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        color: deck.color,
        source: deck.Source,
        cardCount: deck._count.Flashcard,
        dueCards,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
      };
    });

    return NextResponse.json(decksWithStats);
  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}

// POST - Create a new deck with auto-generated flashcards from source
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      sourceId,
      title,
      description,
      color,
      cardCount = 10,
      generateFromSource = true,
    } = body;

    // If generating from source, fetch and validate the source
    let sourceContent = "";
    let sourceTitle = title || "New Deck";
    let source = null;

    if (sourceId) {
      source = await prisma.source.findFirst({
        where: {
          id: sourceId,
          userId: session.user.id,
        },
      });

      if (!source) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 }
        );
      }

      sourceContent = source.content || "";
      sourceTitle = title || source.title;
    }

    // Create the deck
    const deck = await prisma.deck.create({
      data: {
        userId: session.user.id,
        sourceId: sourceId || null,
        title: sourceTitle,
        description:
          description ||
          (source ? `Flashcards from ${source.title}` : null),
        color: color || "#6366f1", // Default purple
      },
    });

    // Generate flashcards if we have source content
    if (generateFromSource && sourceContent) {
      try {
        const generatedCards = await generateFlashcards(
          sourceContent,
          sourceTitle,
          cardCount
        );

        // Create flashcards in batch
        if (generatedCards.length > 0) {
          await prisma.flashcard.createMany({
            data: generatedCards.map((card) => ({
              deckId: deck.id,
              front: card.front,
              back: card.back,
              hint: card.hint,
            })),
          });
        }
      } catch (genError) {
        console.error("Error generating flashcards:", genError);
        // Don't fail the whole request, just return the empty deck
      }
    }

    // Fetch the deck with cards
    const deckWithCards = await prisma.deck.findUnique({
      where: { id: deck.id },
      include: {
        Flashcard: true,
        Source: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { Flashcard: true },
        },
      },
    });

    return NextResponse.json({
      message: "Deck created successfully",
      deck: deckWithCards,
    });
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
