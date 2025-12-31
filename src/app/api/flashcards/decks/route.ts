import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// GET /api/flashcards/decks - List user's decks
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decks = await prisma.deck.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { Flashcard: true },
        },
        Flashcard: {
          select: {
            nextReviewDate: true,
            repetitions: true,
          },
        },
        Source: {
          select: {
            title: true,
            type: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Calculate stats for each deck
    const decksWithStats = decks.map((deck) => {
      const now = new Date();
      const dueCards = deck.Flashcard.filter(
        (c) => new Date(c.nextReviewDate) <= now
      ).length;
      const newCards = deck.Flashcard.filter((c) => c.repetitions === 0).length;

      return {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        color: deck.color,
        isPublic: deck.isPublic,
        source: deck.Source,
        cardCount: deck._count.Flashcard,
        dueCount: dueCards,
        newCount: newCards,
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

// POST /api/flashcards/decks - Create a new deck
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, color, sourceId, isPublic } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const deck = await prisma.deck.create({
      data: {
        userId: session.user.id,
        title,
        description,
        color,
        sourceId,
        isPublic: isPublic || false,
      },
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { error: "Failed to create deck" },
      { status: 500 }
    );
  }
}
