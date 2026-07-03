import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateGeminiContent } from "@/lib/gemini";
import { getCurrentUser } from "@/lib/auth";
import { Difficulty } from "@prisma/client";

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

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized: Admins only" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const checkThreshold = body.checkThreshold ?? false;
    const requestedDifficulty = body.difficulty;
    const requestedCategory = body.category;
    let generateCount = body.count ?? 1;

    // Threshold check logic
    let difficultiesToGenerate: Difficulty[] = [];
    if (checkThreshold) {
      const counts = await prisma.$transaction([
        prisma.scenario.count({ where: { difficulty: "EASY" } }),
        prisma.scenario.count({ where: { difficulty: "MEDIUM" } }),
        prisma.scenario.count({ where: { difficulty: "HARD" } }),
      ]);

      const [easyCount, mediumCount, hardCount] = counts;
      // Target pool is 20 for MVP, but to avoid Gemini API timeouts we generate in batches of 3.
      // If any of the counts is below 20, we trigger generation.
      const TARGET_THRESHOLD = 20;
      if (easyCount < TARGET_THRESHOLD) difficultiesToGenerate.push("EASY");
      if (mediumCount < TARGET_THRESHOLD) difficultiesToGenerate.push("MEDIUM");
      if (hardCount < TARGET_THRESHOLD) difficultiesToGenerate.push("HARD");

      if (difficultiesToGenerate.length === 0) {
        return NextResponse.json({
          message: "Scenario pool is healthy. No generation needed.",
          poolCounts: { EASY: easyCount, MEDIUM: mediumCount, HARD: hardCount },
        });
      }
      
      // Let's generate 2 scenarios for each difficulty that is below threshold in this call
      generateCount = 2; 
    } else {
      if (requestedDifficulty) {
        difficultiesToGenerate = [requestedDifficulty as Difficulty];
      } else {
        difficultiesToGenerate = ["EASY", "MEDIUM", "HARD"];
      }
    }

    // Fetch existing scenario titles to avoid duplicates
    const existingScenarios = await prisma.scenario.findMany({
      select: { title: true },
    });
    const existingTitles = existingScenarios.map((s) => s.title);

    const generatedScenariosList: any[] = [];

    // We generate for each selected difficulty
    for (const diff of difficultiesToGenerate) {
      const prompt = `
You are an expert system design interviewer. Generate a list of ${generateCount} unique, realistic software engineering scenarios of difficulty level "${diff}".
The scenario should represent a real-world dilemma or architectural crisis. Do NOT generate standard programming questions.
Examples of topics: scaling crises, database deadlock issues, security vulnerabilities (like JWT forgery, SQL injection, SSRF), caching stampedes, microservice breakdowns, distributed transactions (Sagas vs 2PC), reliability issues, API breaking changes, or CI/CD pipelines failing under load.

Categories you can choose from: ${JSON.stringify(CATEGORIES)}.
Each scenario must be in a category from this list.

Existing scenario titles (DO NOT REPLICATE OR COPY THESE):
${JSON.stringify(existingTitles)}

Return a JSON array of objects. Each object must have these fields:
- title: A short, compelling title (e.g. "Database Scaling Crisis", "The Stale Cache Stampede").
- description: A detailed description of the scenario. State the current user traffic, CPU metrics, tech stack, constraints, what problem occurred, and explicitly ask what the user would do to solve it.
- category: One of the category names listed above.
- difficulty: Must be exactly "${diff}".
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
          // Double check category and difficulty validation
          const finalCategory = CATEGORIES.includes(s.category) ? s.category : CATEGORIES[0];
          const finalDifficulty = ["EASY", "MEDIUM", "HARD"].includes(s.difficulty)
            ? (s.difficulty as Difficulty)
            : diff;

          const created = await prisma.scenario.create({
            data: {
              title: s.title,
              description: s.description,
              difficulty: finalDifficulty,
              category: finalCategory,
            },
          });
          generatedScenariosList.push(created);
          existingTitles.push(s.title); // add to local list to prevent duplicates in current run
        }
      }
    }

    return NextResponse.json({
      message: `Successfully generated ${generatedScenariosList.length} scenarios`,
      scenarios: generatedScenariosList.map((s) => ({
        id: s.id,
        title: s.title,
        difficulty: s.difficulty,
        category: s.category,
      })),
    });
  } catch (error: any) {
    console.error("Scenario generation error:", error);
    return NextResponse.json(
      { message: "Failed to generate scenarios. " + (error.message || "") },
      { status: 500 }
    );
  }
}
