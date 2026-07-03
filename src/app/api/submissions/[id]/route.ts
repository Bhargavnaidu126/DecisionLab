import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
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

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        scenario: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    // Access control: Only the author or an ADMIN can view the submission details
    if (submission.userId !== user.userId && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("GET submission by ID error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
