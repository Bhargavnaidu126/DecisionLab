import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      return NextResponse.json(
        { message: "Scenario not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("GET scenario by ID error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const scenario = await prisma.scenario.findUnique({
      where: { id },
    });

    if (!scenario) {
      return NextResponse.json(
        { message: "Scenario not found" },
        { status: 404 }
      );
    }

    await prisma.scenario.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Scenario deleted successfully",
    });
  } catch (error) {
    console.error("DELETE scenario by ID error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

