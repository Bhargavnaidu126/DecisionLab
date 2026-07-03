import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { message: "Submission ID is required" },
        { status: 400 }
      );
    }

    // Retrieve submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { scenario: true },
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (submission.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // If already evaluated, return the cached result
    if (submission.score !== null) {
      return NextResponse.json({
        score: submission.score,
        feedback: submission.feedback,
        breakdown: {
          problemUnderstanding: submission.problemUnderstanding,
          tradeoffAnalysis: submission.tradeoffAnalysis,
          riskAnalysis: submission.riskAnalysis,
          decisionQuality: submission.decisionQuality,
        },
        strengths: submission.strengths ? JSON.parse(submission.strengths) : [],
        weaknesses: submission.weaknesses ? JSON.parse(submission.weaknesses) : [],
        challengeQuestion: submission.challengeQuestion,
      });
    }

    // Call Gemini to evaluate
    const prompt = `
You are a senior software engineering mentor evaluating a candidate's or junior engineer's decision-making skills.
Scenario Title: "${submission.scenario.title}"
Scenario Category: "${submission.scenario.category}"
Scenario Difficulty: "${submission.scenario.difficulty}"
Scenario Description:
"""
${submission.scenario.description}
"""

Engineer's Proposed Answer:
"""
${submission.answer}
"""

Evaluate the answer using the following 4 rubrics, each worth 25 points max (total 100 points):
1. Problem Understanding (0-25 points): Did the engineer correctly identify the primary bottlenecks, root causes, and technical constraints?
2. Tradeoff Analysis (0-25 points): Did they compare alternative options and justify why they chose a specific path?
3. Risk Analysis (0-25 points): Did they identify failure modes, security risks, operational overhead, or unintended consequences?
4. Decision Quality (0-25 points): Is the final recommendation practical, realistic, and aligned with industry best practices for the given scenario constraints?

Ensure the total score is exactly the sum of the four rubric scores.
Provide constructive, high-quality feedback.
Identify 2-3 specific strengths and 2-3 specific weaknesses of their answer.
Finally, draft a "challengeQuestion" (a mentor-style follow-up question) challenging an assumption they made, an alternative they ignored, or a major risk they left unmitigated. Make it direct and conversational (e.g. "Why did you choose Redis for caching here without knowing if the traffic is read-heavy or write-heavy?").
`;

    // We pass a standard JSON schema to instruct Gemini
    const response = await generateGeminiContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object" as any,
          properties: {
            score: { type: "integer" as any },
            feedback: { type: "string" as any },
            breakdown: {
              type: "object" as any,
              properties: {
                problemUnderstanding: { type: "integer" as any },
                tradeoffAnalysis: { type: "integer" as any },
                riskAnalysis: { type: "integer" as any },
                decisionQuality: { type: "integer" as any },
              },
              required: ["problemUnderstanding", "tradeoffAnalysis", "riskAnalysis", "decisionQuality"],
            },
            strengths: {
              type: "array" as any,
              items: { type: "string" as any },
            },
            weaknesses: {
              type: "array" as any,
              items: { type: "string" as any },
            },
            challengeQuestion: { type: "string" as any },
          },
          required: ["score", "feedback", "breakdown", "strengths", "weaknesses", "challengeQuestion"],
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Empty response from Gemini");
    }

    const evaluation = JSON.parse(jsonText);

    // Save evaluation to database
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: evaluation.score,
        feedback: evaluation.feedback,
        problemUnderstanding: evaluation.breakdown.problemUnderstanding,
        tradeoffAnalysis: evaluation.breakdown.tradeoffAnalysis,
        riskAnalysis: evaluation.breakdown.riskAnalysis,
        decisionQuality: evaluation.breakdown.decisionQuality,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        challengeQuestion: evaluation.challengeQuestion,
      },
    });

    return NextResponse.json({
      score: evaluation.score,
      feedback: evaluation.feedback,
      breakdown: {
        problemUnderstanding: evaluation.breakdown.problemUnderstanding,
        tradeoffAnalysis: evaluation.breakdown.tradeoffAnalysis,
        riskAnalysis: evaluation.breakdown.riskAnalysis,
        decisionQuality: evaluation.breakdown.decisionQuality,
      },
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      challengeQuestion: evaluation.challengeQuestion,
    });
  } catch (error: any) {
    console.error("AI Evaluation error:", error);
    return NextResponse.json(
      { message: "Failed to evaluate submission. " + (error.message || "") },
      { status: 500 }
    );
  }
}
