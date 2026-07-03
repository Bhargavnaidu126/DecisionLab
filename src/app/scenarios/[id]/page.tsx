"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  category: string;
}

export default function ScenarioWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState(0);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function fetchScenario() {
      try {
        const res = await fetch(`/api/scenarios/${id}`);
        if (!res.ok) {
          setError("Scenario not found");
          return;
        }
        const data = await res.json();
        setScenario(data);
      } catch (e) {
        setError("Failed to load scenario");
      } finally {
        setLoading(false);
      }
    }
    fetchScenario();
  }, [id]);

  // Loader stages for submission feedback
  useEffect(() => {
    if (!submitting) return;
    const interval = setInterval(() => {
      setSubmitStage((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [submitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (answer.trim().length < 50) {
      setError("Please write a more detailed response (at least 50 characters) to demonstrate judgment.");
      return;
    }

    setSubmitting(true);
    setSubmitStage(0);

    try {
      // Step 1: Create submission
      const subRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id, answer }),
      });

      if (!subRes.ok) {
        const data = await subRes.json();
        throw new Error(data.message || "Failed to submit answer");
      }

      const { submissionId } = await subRes.json();

      // Step 2: Trigger AI evaluation
      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      if (!evalRes.ok) {
        const data = await evalRes.json();
        throw new Error(data.message || "AI Evaluation failed");
      }

      router.push(`/submissions/${submissionId}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during evaluation.");
      setSubmitting(false);
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

  const getLoaderText = () => {
    switch (submitStage) {
      case 0:
        return "Parsing architecture specifications...";
      case 1:
        return "Evaluating tradeoff justifications...";
      case 2:
        return "Auditing database & operational risk factors...";
      case 3:
        return "Formulating mentor follow-up challenge...";
      default:
        return "Analyzing decisions...";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#030712]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500" />
          <p className="text-slate-400 text-sm mt-4">Loading workspace...</p>
        </main>
      </div>
    );
  }

  if (error && !scenario) {
    return (
      <div className="flex flex-col min-h-screen bg-[#030712]">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 text-center">
          <div className="p-6 bg-red-950/30 border border-red-900/50 text-red-300 rounded-xl">
            {error}
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-500"
          >
            Back to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100">
      <Navbar />

      {submitting ? (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto animate-fade-in">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-900/60 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-violet-900/60 border-t-violet-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Gemini is Evaluating Your Judgment</h2>
          <p className="text-indigo-400 font-mono text-xs mb-4 pulse-glow">
            {getLoaderText()}
          </p>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
            This typically takes 8-15 seconds. Please do not refresh the page while we analyze your reasoning.
          </p>
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
          {/* Top Header Section */}
          <div className="glass-card rounded-2xl border border-card-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  {scenario?.category}
                </span>
                <span className="text-slate-700">•</span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-bold border rounded uppercase tracking-wider ${getDifficultyColor(
                    scenario?.difficulty || "EASY"
                  )}`}
                >
                  {scenario?.difficulty}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {scenario?.title}
              </h1>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-card-border hover:bg-slate-800 rounded-lg transition-all self-start md:self-auto"
            >
              Back to Catalog
            </button>
          </div>

          {/* Two Column Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left Column (60%): Description and Guidelines */}
            <div className="lg:col-span-3 space-y-6">
              {/* Description Card */}
              <div className="glass-card rounded-2xl border border-card-border p-8 space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white border-b border-card-border pb-3">
                  Scenario Overview & Constraints
                </h2>
                
                <div className="readable-prose text-slate-200">
                  {scenario?.description}
                </div>
              </div>

              {/* Guidelines Card */}
              <div className="p-8 bg-slate-950 border border-card-border rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  Mandatory Guidance Checklist
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your response is evaluated by the AI Mentor based on how thoroughly you cover these five critical architectural pillars:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="flex gap-2">
                    <span className="text-indigo-400 font-mono text-xs">1.</span>
                    <p className="text-xs text-slate-300"><strong className="text-white">Identify:</strong> State primary technical bottlenecks and root causes.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-400 font-mono text-xs">2.</span>
                    <p className="text-xs text-slate-300"><strong className="text-white">Propose:</strong> Outline your concrete implementation plan.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-400 font-mono text-xs">3.</span>
                    <p className="text-xs text-slate-300"><strong className="text-white">Justify:</strong> Explain why your stack choices fit the constraints.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-indigo-400 font-mono text-xs">4.</span>
                    <p className="text-xs text-slate-300"><strong className="text-white">Alternatives:</strong> List other solutions and why you rejected them.</p>
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <span className="text-indigo-400 font-mono text-xs">5.</span>
                    <p className="text-xs text-slate-300"><strong className="text-white">Tradeoffs:</strong> Acknowledge risks, pricing overhead, or consistency caveats.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (40%): Spacious Editor */}
            <div className="lg:col-span-2">
              <form
                onSubmit={handleSubmit}
                className="glass-card border border-card-border rounded-2xl p-6 flex flex-col justify-between min-h-[500px]"
              >
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-card-border pb-3 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Your Architectural Response
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {answer.length} characters
                    </span>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-950/40 border border-red-900/40 text-red-300 rounded-lg text-xs text-center">
                      {error}
                    </div>
                  )}

                  <textarea
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Draft your solution here. Be detailed. Address tradeoffs, edge cases, scaling limits, and risks to score higher."
                    className="w-full flex-1 min-h-[350px] bg-slate-900/40 border border-card-border text-slate-100 text-sm p-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed resize-none"
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-card-border flex items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-500 italic">
                    Min 50 chars required
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-indigo-500/10"
                  >
                    Submit for Evaluation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
