import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import {
  generateFlashcardsFromContent,
  generateFlashcardsFromTopic,
} from "@/lib/flashcards/generator";

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// POST /api/flashcards/decks/[deckId]/generate - Generate AI flashcards
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify deck ownership
    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId: session.user.id },
      include: {
        Source: {
          select: {
            title: true,
            content: true,
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      count = 10,
      difficulty = "medium",
      focusAreas = [],
      cardStyle = "mixed",
      topic, // For generating from topic instead of source
    } = body;

    let generatedCards;

    if (topic) {
      // Generate from topic
      generatedCards = await generateFlashcardsFromTopic(topic, {
        count,
        difficulty,
      });
    } else if (deck.Source?.content) {
      // Generate from source content
      generatedCards = await generateFlashcardsFromContent(
        deck.Source.content,
        deck.Source.title,
        { count, difficulty, focusAreas, cardStyle }
      );
    } else {
      return NextResponse.json(
        { error: "No content available. Provide a topic or link a source with content." },
        { status: 400 }
      );
    }

    if (generatedCards.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate flashcards" },
        { status: 500 }
      );
    }

    // Create the cards in the database
    await prisma.flashcard.createMany({
      data: generatedCards.map((card) => ({
        id: crypto.randomUUID(),
        deckId,
        front: card.front,
        back: card.back,
        hint: card.hint || null,
        updatedAt: new Date(),
      })),
    });

    // Fetch the created cards
    const cards = await prisma.flashcard.findMany({
      where: { deckId },
      orderBy: { createdAt: "desc" },
      take: generatedCards.length,
    });

    return NextResponse.json({
      success: true,
      count: cards.length,
      cards,
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
  }
}
