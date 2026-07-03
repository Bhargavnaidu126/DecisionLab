"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Scenario {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
  createdAt: string;
}

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

export default function AdminDashboard() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Pool counts
  const [counts, setCounts] = useState({ EASY: 0, MEDIUM: 0, HARD: 0 });

  // Generation forms
  const [manualDiff, setManualDiff] = useState("EASY");
  const [manualCat, setManualCat] = useState("System Design");
  const [manualCount, setManualCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function initAdmin() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (!meRes.ok || !meData.user) {
          router.push("/login");
          return;
        }
        if (meData.user.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }
        setUser(meData.user);

        // Fetch data
        await refreshData();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, [router]);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/scenarios");
      const data = await res.json();
      setScenarios(data);

      // Calculate counts
      const newCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };
      data.forEach((s: Scenario) => {
        if (s.difficulty in newCounts) {
          newCounts[s.difficulty]++;
        }
      });
      setCounts(newCounts);
    } catch (e) {
      console.error("Failed to reload data:", e);
    }
  };

  const handleAutoCheck = async () => {
    setGenerating(true);
    setGenMessage("Checking pool sizes and generating new scenarios using Gemini...");
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkThreshold: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to run check");
      }
      setGenMessage(data.message || "Auto-check completed successfully");
      await refreshData();
    } catch (e: any) {
      setGenMessage(`Error: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleManualGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenMessage(`Generating ${manualCount} scenario(s) of difficulty ${manualDiff} for category ${manualCat}...`);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty: manualDiff,
          category: manualCat,
          count: manualCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate");
      }
      setGenMessage(`Successfully generated ${data.scenarios?.length || 0} scenarios!`);
      await refreshData();
    } catch (e: any) {
      setGenMessage(`Error: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scenario? This will also delete all its submissions.")) {
      return;
    }

    try {
      // In Next.js route handlers, we haven't implemented a specific DELETE handler for scenarios/[id] yet,
      // but we can add it or write a simple fetch with headers check.
      // Let's implement delete directly or write a route handler for it!
      // Wait, we can implement it by calling a route delete! Let's make sure `/api/scenarios/[id]` supports DELETE.
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await refreshData();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete scenario");
      }
    } catch (e) {
      alert("Error occurred deleting scenario.");
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "EASY":
        return "text-emerald-400 bg-emerald-950/80 border-emerald-900";
      case "MEDIUM":
        return "text-amber-400 bg-amber-950/80 border-amber-900";
      case "HARD":
        return "text-red-400 bg-red-950/80 border-red-900";
      default:
        return "text-slate-400 bg-slate-900 border-card-border";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#030712]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
          <p className="text-slate-400 text-sm mt-4">Authenticating admin session...</p>
        </main>
      </div>
    );
  }

  const TARGET_THRESHOLD = 20;

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Admin Control Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor the database scenario pool, generate new scenarios via Gemini, and review resources.
          </p>
        </div>

        {/* Pool Status Indicators */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => {
            const current = counts[diff];
            const isHealthy = current >= TARGET_THRESHOLD;
            return (
              <div
                key={diff}
                className={`glass-card p-6 rounded-xl border flex flex-col justify-between ${
                  isHealthy ? "border-card-border" : "border-amber-900/40 glow-cyan/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {diff} Pool
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                      isHealthy
                        ? "text-emerald-400 bg-emerald-950/80 border-emerald-900"
                        : "text-amber-400 bg-amber-950/80 border-amber-900"
                    }`}
                  >
                    {isHealthy ? "Healthy" : "Below Threshold"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-extrabold text-white">{current}</span>
                  <span className="text-xs text-slate-500">/ {TARGET_THRESHOLD} scenarios</span>
                </div>

                {!isHealthy && (
                  <div className="text-[10px] text-amber-400 mt-2 italic">
                    Requires {(TARGET_THRESHOLD - current)} more scenarios.
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Generator Controls */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Automatic checks */}
          <div className="glass-card p-8 rounded-2xl border border-card-border flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-2">
                Scenario Pool Auto-Generator
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Checks counts for EASY, MEDIUM, and HARD difficulty. If any counts fall below the {TARGET_THRESHOLD}+ threshold, it calls Gemini to generate additional scenarios in batches.
              </p>
            </div>

            <button
              onClick={handleAutoCheck}
              disabled={generating}
              className="w-full py-3 px-4 font-semibold text-white bg-slate-900 hover:bg-slate-800 border border-card-border rounded-lg text-xs tracking-wider uppercase transition-all disabled:opacity-50"
            >
              Run Threshold Check & Auto-Fill
            </button>
          </div>

          {/* Manual Generator Form */}
          <div className="glass-card p-8 rounded-2xl border border-card-border lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
              Manual AI Generator Form
            </h3>

            <form onSubmit={handleManualGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Category
                </label>
                <select
                  value={manualCat}
                  onChange={(e) => setManualCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-card-border text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Difficulty
                </label>
                <select
                  value={manualDiff}
                  onChange={(e) => setManualDiff(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-card-border text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Count
                </label>
                <select
                  value={manualCount}
                  onChange={(e) => setManualCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-card-border text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="1">1 scenario</option>
                  <option value="2">2 scenarios</option>
                  <option value="3">3 scenarios</option>
                </select>
              </div>

              <div className="md:col-span-3 mt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="w-full py-2.5 px-4 font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  Trigger Gemini Generation
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Logs Console */}
        {genMessage && (
          <div className="bg-slate-950 border border-card-border p-4 rounded-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              System Operations Console
            </h4>
            <div className="text-xs font-mono text-indigo-400 select-all whitespace-pre-wrap leading-relaxed">
              {generating && (
                <span className="inline-block animate-pulse mr-2">●</span>
              )}
              {genMessage}
            </div>
          </div>
        )}

        {/* Scenarios Manager List */}
        <section className="glass-card rounded-2xl border border-card-border p-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6 border-b border-card-border pb-3">
            Scenario Pool Manager ({scenarios.length} scenarios)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-card-border text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 pr-4">Scenario Title</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Difficulty</th>
                  <th className="pb-3 pr-4">Created Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border text-slate-300">
                {scenarios.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/30">
                    <td className="py-3.5 pr-4 font-medium text-white">{s.title}</td>
                    <td className="py-3.5 pr-4 text-slate-400">{s.category}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${getDifficultyColor(
                          s.difficulty
                        )}`}
                      >
                        {s.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteScenario(s.id)}
                        className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {scenarios.length === 0 && (
              <div className="text-center text-slate-500 py-12">
                No scenarios in database. Run the check or trigger manually to populate.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
