import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { challengeAnswer } = await request.json();

    if (!challengeAnswer || challengeAnswer.trim().length === 0) {
      return NextResponse.json(
        { message: "Answer to challenge is required" },
        { status: 400 }
      );
    }

    // Retrieve submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { scenario: true },
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    // Access check
    if (submission.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Make sure we have an evaluation and a challenge question
    if (!submission.challengeQuestion) {
      return NextResponse.json(
        { message: "This submission has not been evaluated or does not have a challenge question." },
        { status: 400 }
      );
    }

    // Call Gemini to evaluate the defense
    const prompt = `
You are a senior software engineering mentor.
You previously evaluated an engineer's response to the scenario: "${submission.scenario.title}".
Scenario Description:
"""
${submission.scenario.description}
"""

Engineer's Original Answer:
"""
${submission.answer}
"""

You posed this follow-up challenge question:
"${submission.challengeQuestion}"

The engineer has responded with this defense/clarification:
"""
${challengeAnswer}
"""

Evaluate their defense. In 2-3 short paragraphs, provide mentor-like feedback:
1. Did they successfully address your challenge?
2. What part of their reasoning is solid or well-justified?
3. Are there still any residual gaps, operational risks, or assumptions they need to be aware of?

Be professional, encouraging, and highly technical.
`;

    const response = await generateGeminiContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const challengeFeedback = response.text;
    if (!challengeFeedback) {
      throw new Error("Failed to receive feedback from Gemini");
    }

    // Update submission in DB
    await prisma.submission.update({
      where: { id },
      data: {
        challengeAnswer,
        challengeFeedback,
      },
    });

    return NextResponse.json({
      challengeFeedback,
    });
  } catch (error: any) {
    console.error("Challenge reply evaluation error:", error);
    return NextResponse.json(
      { message: "Failed to evaluate challenge response. " + (error.message || "") },
      { status: 500 }
    );
  }
}
