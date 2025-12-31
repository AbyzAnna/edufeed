import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ quizId: string }>;
}

interface SubmittedAnswer {
  questionId: string;
  answer: string;
  timeSpent?: number;
}

// POST - Submit quiz answers
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { quizId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { attemptId, answers, totalTimeSpent } = body as {
      attemptId: string;
      answers: SubmittedAnswer[];
      totalTimeSpent?: number;
    };

    if (!attemptId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "attemptId and answers are required" },
        { status: 400 }
      );
    }

    // Verify attempt exists and belongs to user
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId: session.user.id,
        quizId,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Attempt not found" },
        { status: 404 }
      );
    }

    // Get questions with correct answers
    const questions = await prisma.question.findMany({
      where: { quizId },
      select: {
        id: true,
        text: true,
        correctAnswer: true,
        explanation: true,
        options: true,
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Score answers and create answer records
    let correctCount = 0;
    const results: {
      questionId: string;
      questionText: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string;
    }[] = [];

    for (const submitted of answers) {
      const question = questionMap.get(submitted.questionId);
      if (!question) continue;

      const isCorrect = submitted.answer === question.correctAnswer;
      if (isCorrect) correctCount++;

      // Create answer record
      await prisma.answer.create({
        data: {
          id: crypto.randomUUID(),
          attemptId,
          questionId: submitted.questionId,
          userAnswer: submitted.answer,
          isCorrect,
          timeSpent: submitted.timeSpent || null,
        },
      });

      results.push({
        questionId: question.id,
        questionText: question.text,
        userAnswer: submitted.answer,
        correctAnswer: question.correctAnswer || "",
        isCorrect,
        explanation: question.explanation || "",
      });
    }

    // Calculate final score
    const maxScore = questions.length;
    const percentage = Math.round((correctCount / maxScore) * 100);

    // Update attempt with final results
    await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: correctCount,
        maxScore,
        percentage,
        timeSpent: totalTimeSpent || 0,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      score: correctCount,
      maxScore,
      percentage,
      results,
      passed: percentage >= 70,
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
