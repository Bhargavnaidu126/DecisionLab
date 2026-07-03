import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        scenario: {
          select: {
            title: true,
            difficulty: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("GET submissions error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { scenarioId, answer } = await request.json();

    if (!scenarioId || !answer) {
      return NextResponse.json(
        { message: "Scenario ID and answer are required" },
        { status: 400 }
      );
    }

    // Check if scenario exists
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      return NextResponse.json(
        { message: "Scenario not found" },
        { status: 404 }
      );
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        scenarioId,
        answer,
        userId: user.userId,
      },
    });

    return NextResponse.json({
      submissionId: submission.id,
    }, { status: 201 });
  } catch (error) {
    console.error("POST submission error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
