import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Difficulty } from "@prisma/client";
import { generateGeminiContent } from "@/lib/gemini";

const CATEGORIES = [
  "System Design",
  "Databases",
  "Scaling",
  "Security",
  "Microservices",
  "Caching",
  "Distributed Systems",
  "DevOps",
  "Reliability",
  "API Design",
];

async function autoGenerateInitialScenarios() {
  try {
    const prompt = `
You are an expert system design interviewer. Generate a list of 6 unique, realistic software engineering scenarios.
The scenarios should represent real-world dilemmas or architectural crises. Do NOT generate standard programming questions.
Examples of topics: scaling crises, database deadlock issues, security vulnerabilities (like JWT forgery, SQL injection, SSRF), caching stampedes, microservice breakdowns, distributed transactions (Sagas vs 2PC), reliability issues, API breaking changes, or CI/CD pipelines failing under load.

Generate:
- 2 scenarios of difficulty "EASY"
- 2 scenarios of difficulty "MEDIUM"
- 2 scenarios of difficulty "HARD"

Categories you can choose from: ${JSON.stringify(CATEGORIES)}.
Each scenario must be in a category from this list.

Return a JSON array of objects. Each object must have these fields:
- title: A short, compelling title (e.g. "Database Scaling Crisis", "The Stale Cache Stampede").
- description: A detailed description of the scenario. State the current user traffic, CPU metrics, tech stack, constraints, what problem occurred, and explicitly ask what the user would do to solve it.
- category: One of the category names listed above.
- difficulty: Must be exactly "EASY", "MEDIUM", or "HARD".
`;

    const response = await generateGeminiContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              title: { type: "string" as any },
              description: { type: "string" as any },
              category: { type: "string" as any },
              difficulty: { type: "string" as any },
            },
            required: ["title", "description", "category", "difficulty"],
          },
        },
      },
    });

    const text = response.text;
    if (text) {
      const scenarios = JSON.parse(text);
      for (const s of scenarios) {
        const finalCategory = CATEGORIES.includes(s.category) ? s.category : CATEGORIES[0];
        const finalDifficulty = ["EASY", "MEDIUM", "HARD"].includes(s.difficulty)
          ? (s.difficulty as Difficulty)
          : "MEDIUM";

        await prisma.scenario.create({
          data: {
            title: s.title,
            description: s.description,
            difficulty: finalDifficulty,
            category: finalCategory,
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to auto generate scenarios:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if scenario pool is completely empty. If so, automatically generate initial scenarios!
    const totalCount = await prisma.scenario.count();
    if (totalCount === 0) {
      await autoGenerateInitialScenarios();
    }

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get("difficulty");
    const category = searchParams.get("category");

    const where: any = {};
    if (difficulty && ["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      where.difficulty = difficulty as Difficulty;
    }
    if (category && category !== "All") {
      where.category = {
        equals: category,
        mode: "insensitive",
      };
    }

    const scenarios = await prisma.scenario.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        category: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("GET scenarios error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const { title, description, difficulty, category } = await request.json();

    if (!title || !description || !difficulty || !category) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
      return NextResponse.json(
        { message: "Invalid difficulty value" },
        { status: 400 }
      );
    }

    const scenario = await prisma.scenario.create({
      data: {
        title,
        description,
        difficulty: difficulty as Difficulty,
        category,
      },
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error("POST scenario error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
