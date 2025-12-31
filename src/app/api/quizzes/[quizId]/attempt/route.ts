import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

// POST - Start a new quiz attempt
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { quizId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify quiz exists and user has access
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: session.user.id,
      },
      include: {
        Question: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        id: crypto.randomUUID(),
        quizId,
        userId: session.user.id,
        score: 0,
        maxScore: quiz.Question.length,
        percentage: 0,
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        timeLimit: quiz.timeLimit,
        questions: quiz.Question.map((q) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          options: q.options,
          order: q.order,
        })),
      },
    });
  } catch (error) {
    console.error("Error starting quiz attempt:", error);
    return NextResponse.json(
      { error: "Failed to start quiz attempt" },
      { status: 500 }
    );
  }
}
