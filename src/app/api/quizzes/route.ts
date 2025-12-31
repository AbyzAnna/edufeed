import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { generateQuizQuestions } from "@/lib/generation/flashcard";

// GET - Fetch user's quizzes
export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { userId: session.user.id },
      include: {
        Source: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { Question: true, QuizAttempt: true },
        },
        QuizAttempt: {
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            score: true,
            percentage: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const quizzesWithStats = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      source: quiz.Source,
      questionCount: quiz._count.Question,
      attemptCount: quiz._count.QuizAttempt,
      lastAttempt: quiz.QuizAttempt[0] || null,
      createdAt: quiz.createdAt,
    }));

    return NextResponse.json(quizzesWithStats);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST - Create a new quiz from source
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
      questionCount = 5,
      difficulty = "MEDIUM",
      timeLimit,
      generateFromSource = true,
    } = body;

    let sourceContent = "";
    let sourceTitle = title || "New Quiz";
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
      sourceTitle = title || `${source.title} - Quiz`;
    }

    // Create the quiz
    const quiz = await prisma.quiz.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        sourceId: sourceId || null,
        title: sourceTitle,
        description:
          description || (source ? `Quiz generated from ${source.title}` : null),
        difficulty,
        timeLimit: timeLimit || null,
      },
    });

    // Generate questions if we have source content
    if (generateFromSource && sourceContent) {
      try {
        const generatedQuestions = await generateQuizQuestions(
          sourceContent,
          sourceTitle,
          questionCount,
          difficulty
        );

        if (generatedQuestions.length > 0) {
          await prisma.question.createMany({
            data: generatedQuestions.map((q, index) => ({
              id: crypto.randomUUID(),
              quizId: quiz.id,
              type: "MULTIPLE_CHOICE",
              text: q.question,
              options: q.options,
              correctAnswer: q.options.find((o) => o.isCorrect)?.id || "A",
              explanation: q.explanation,
              order: index,
            })),
          });
        }
      } catch (genError) {
        console.error("Error generating questions:", genError);
      }
    }

    const quizWithQuestions = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        Question: {
          orderBy: { order: "asc" },
        },
        Source: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: { Question: true },
        },
      },
    });

    return NextResponse.json({
      message: "Quiz created successfully",
      quiz: quizWithQuestions,
    });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
