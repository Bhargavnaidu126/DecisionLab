"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
}

interface Submission {
  id: string;
  score: number | null;
  createdAt: string;
  scenario: {
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  };
}

const CATEGORIES = [
  "All",
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

export default function Dashboard() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        // Check session
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meRes.ok || !meData.user) {
          router.push("/login");
          return;
        }
        setUser(meData.user);

        // Fetch scenarios
        const scenariosRes = await fetch("/api/scenarios");
        const scenariosData = await scenariosRes.json();
        setScenarios(scenariosData);

        // Fetch submissions
        const submissionsRes = await fetch("/api/submissions");
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);
      } catch (e) {
        console.error("Dashboard load failed:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  // Statistics calculation
  const totalAttempts = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const averageScore =
    gradedSubmissions.length > 0
      ? Math.round(
          gradedSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) /
            gradedSubmissions.length
        )
      : 0;

  // Category coverage details
  const categoryStats = CATEGORIES.filter((c) => c !== "All").map((cat) => {
    const catSubmissions = gradedSubmissions.filter((s) => s.scenario.category === cat);
    const completed = catSubmissions.length;
    const avg =
      completed > 0
        ? Math.round(
            catSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / completed
          )
        : 0;
    return { name: cat, completed, avg };
  });

  const filteredScenarios = scenarios.filter((s) => {
    const matchCat = selectedCategory === "All" || s.category === selectedCategory;
    const matchDiff = selectedDifficulty === "All" || s.difficulty === selectedDifficulty;
    return matchCat && matchDiff;
  });

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-900";
      case "MEDIUM":
        return "bg-amber-950/80 text-amber-400 border-amber-900";
      case "HARD":
        return "bg-red-950/80 text-red-400 border-red-900";
      default:
        return "bg-slate-900 text-slate-400 border-card-border";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#030712]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
          <p className="text-slate-400 text-sm mt-4">Loading your simulator dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030712]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, Engineer
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Select a scenario from the pool below or review your detailed scores history.
            </p>
          </div>
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="self-start px-4 py-2 text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900 rounded-lg transition-all"
            >
              Admin Control Panel
            </Link>
          )}
        </div>

        {/* Analytics Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 rounded-xl border border-card-border flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Attempts
            </span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-extrabold text-white">{totalAttempts}</span>
              <span className="text-xs text-slate-500 font-medium">scenarios</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-card-border flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Score
            </span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-4xl font-extrabold text-indigo-400">
                {averageScore}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 100</span>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-card-border flex flex-col justify-between col-span-1 sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pillars Mastery (Grades)
            </span>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
              {categoryStats.slice(0, 4).map((c) => (
                <div key={c.name} className="flex flex-col justify-end">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium truncate max-w-[120px]">{c.name}</span>
                    <span className="text-slate-400 font-mono">{c.completed > 0 ? `${c.avg}%` : "—"}</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-950">
                    <div
                      className="bg-indigo-500 h-full"
                      style={{ width: `${c.completed > 0 ? c.avg : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Columns - Scenario Pool */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Available Scenario Pool
                <span className="px-2 py-0.5 text-xs bg-slate-900 border border-card-border text-slate-300 rounded-full font-normal">
                  {filteredScenarios.length}
                </span>
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Category Selector */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-card-border text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Difficulty Selector */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-card-border text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="All">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>

            {filteredScenarios.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-xl border border-card-border text-slate-400">
                <p>No scenarios found matching your filters.</p>
                {user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500"
                  >
                    Generate Scenarios
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredScenarios.map((s) => (
                  <div
                    key={s.id}
                    className="glass-card p-6 rounded-xl border border-card-border flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                          {s.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${getDifficultyBadgeColor(
                            s.difficulty
                          )}`}
                        >
                          {s.difficulty}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mb-2 line-clamp-1">
                        {s.title}
                      </h3>
                      <p className="text-slate-400 text-xs line-clamp-3 mb-6 leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    <Link
                      href={`/scenarios/${s.id}`}
                      className="w-full py-2.5 text-center text-xs font-semibold text-white bg-slate-900 hover:bg-indigo-900/40 border border-card-border hover:border-indigo-500/40 rounded-lg transition-all"
                    >
                      Attempt Simulator
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Submissions History */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Your Submissions</h2>

            {submissions.length === 0 ? (
              <div className="glass-card p-8 text-center rounded-xl border border-card-border text-slate-500 text-xs">
                No submissions yet. Attempt a scenario to start practicing.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="glass-card p-4 rounded-xl border border-card-border flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {sub.scenario?.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                          {sub.scenario?.category}
                        </span>
                        <span className="text-[9px] text-slate-600">•</span>
                        <span className="text-[9px] text-slate-500">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {sub.score !== null ? (
                        <div className="flex flex-col items-center">
                          <span className="text-base font-bold text-indigo-400">
                            {sub.score}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">/100</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-500 bg-amber-950/30 border border-amber-900/30 px-2 py-0.5 rounded animate-pulse">
                          Pending
                        </span>
                      )}

                      <Link
                        href={`/submissions/${sub.id}`}
                        className="p-1.5 hover:bg-slate-800 border border-card-border hover:border-slate-700 rounded-lg transition-all"
                        title="View Evaluation"
                      >
                        <svg
                          className="w-4 h-4 text-slate-400 hover:text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
