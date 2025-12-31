import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// GET - Fetch a specific deck with all cards
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: session.user.id,
      },
      include: {
        Flashcard: {
          orderBy: { createdAt: "asc" },
        },
        Source: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { Flashcard: true },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Calculate stats
    const now = new Date();
    const dueCards = deck.Flashcard.filter(
      (card) => new Date(card.nextReviewDate) <= now
    );
    const masteredCards = deck.Flashcard.filter((card) => card.repetitions >= 5);

    return NextResponse.json({
      ...deck,
      cards: deck.Flashcard,
      source: deck.Source,
      stats: {
        total: deck._count.Flashcard,
        due: dueCards.length,
        mastered: masteredCards.length,
        learning: deck._count.Flashcard - masteredCards.length,
      },
    });
  } catch (error) {
    console.error("Error fetching deck:", error);
    return NextResponse.json(
      { error: "Failed to fetch deck" },
      { status: 500 }
    );
  }
}

// PATCH - Update deck info
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, color } = body;

    const deck = await prisma.deck.updateMany({
      where: {
        id: deckId,
        userId: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
      },
    });

    if (deck.count === 0) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deck updated successfully" });
  } catch (error) {
    console.error("Error updating deck:", error);
    return NextResponse.json(
      { error: "Failed to update deck" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a deck
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deck = await prisma.deck.deleteMany({
      where: {
        id: deckId,
        userId: session.user.id,
      },
    });

    if (deck.count === 0) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deck deleted successfully" });
  } catch (error) {
    console.error("Error deleting deck:", error);
    return NextResponse.json(
      { error: "Failed to delete deck" },
      { status: 500 }
    );
  }
}

// POST - Add a new card to the deck
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { deckId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify deck ownership
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: session.user.id,
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body = await request.json();
    const { front, back, hint } = body;

    if (!front || !back) {
      return NextResponse.json(
        { error: "Front and back are required" },
        { status: 400 }
      );
    }

    const card = await prisma.flashcard.create({
      data: {
        id: crypto.randomUUID(),
        deckId,
        front,
        back,
        hint: hint || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Card added successfully",
      card,
    });
  } catch (error) {
    console.error("Error adding card:", error);
    return NextResponse.json(
      { error: "Failed to add card" },
      { status: 500 }
    );
  }
}
