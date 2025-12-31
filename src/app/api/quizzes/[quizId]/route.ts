import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

// GET - Fetch a specific quiz with questions
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { quizId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      include: {
        Question: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            type: true,
            text: true,
            options: true,
            order: true,
            // Don't include correctAnswer for active quiz taking
          },
        },
        Source: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { Question: true, QuizAttempt: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Get user's best attempt
    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id,
      },
      orderBy: { percentage: "desc" },
    });

    return NextResponse.json({
      ...quiz,
      bestAttempt: bestAttempt
        ? {
            score: bestAttempt.score,
            maxScore: bestAttempt.maxScore,
            percentage: bestAttempt.percentage,
            completedAt: bestAttempt.completedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// PATCH - Update quiz info
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { quizId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, difficulty, timeLimit } = body;

    const quiz = await prisma.quiz.updateMany({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(difficulty && { difficulty }),
        ...(timeLimit !== undefined && { timeLimit }),
      },
    });

    if (quiz.count === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz updated successfully" });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quiz
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { quizId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.deleteMany({
      where: {
        id: quizId,
        userId: session.user.id,
      },
    });

    if (quiz.count === 0) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}
