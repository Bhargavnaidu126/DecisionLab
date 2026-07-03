"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Submission {
  id: string;
  answer: string;
  score: number;
  feedback: string;
  problemUnderstanding: number;
  tradeoffAnalysis: number;
  riskAnalysis: number;
  decisionQuality: number;
  strengths: string; // JSON array of strings
  weaknesses: string; // JSON array of strings
  challengeQuestion: string;
  challengeAnswer: string | null;
  challengeFeedback: string | null;
  createdAt: string;
  scenario: {
    title: string;
    description: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  };
}

export default function SubmissionDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Challenge State
  const [challengeAnswerInput, setChallengeAnswerInput] = useState("");
  const [submittingChallenge, setSubmittingChallenge] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchSubmission() {
      try {
        const res = await fetch(`/api/submissions/${id}`);
        if (!res.ok) {
          setError("Submission details not found");
          return;
        }
        const data = await res.json();
        setSubmission(data);
      } catch (e) {
        setError("Failed to load evaluation details");
      } finally {
        setLoading(false);
      }
    }
    fetchSubmission();
  }, [id]);

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeAnswerInput.trim()) return;

    setSubmittingChallenge(true);
    try {
      const res = await fetch(`/api/submissions/${id}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeAnswer: challengeAnswerInput }),
      });

      if (!res.ok) {
        throw new Error("Failed to evaluate defense");
      }

      const data = await res.json();
      
      // Update local state with the feedback and answer
      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              challengeAnswer: challengeAnswerInput,
              challengeFeedback: data.challengeFeedback,
            }
          : null
      );
    } catch (err) {
      console.error(err);
      alert("Failed to submit your defense. Please try again.");
    } finally {
      setSubmittingChallenge(false);
    }
  };

  const getDifficultyBadge = (diff: string) => {
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
          <p className="text-slate-400 text-sm mt-4">Retrieving evaluation from database...</p>
        </main>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-col min-h-screen bg-[#030712]">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 text-center">
          <div className="p-6 bg-red-950/30 border border-red-900/50 text-red-300 rounded-xl">
            {error || "Submission not found"}
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

  // Parse strengths/weaknesses lists
  const strengthsList: string[] = submission.strengths ? JSON.parse(submission.strengths) : [];
  const weaknessesList: string[] = submission.weaknesses ? JSON.parse(submission.weaknesses) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10 animate-fade-in">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-card-border pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                {submission.scenario.category}
              </span>
              <span className="text-slate-600">•</span>
              <span
                className={`px-2 py-0.5 text-[9px] font-bold border rounded uppercase tracking-wider ${getDifficultyBadge(
                  submission.scenario.difficulty
                )}`}
              >
                {submission.scenario.difficulty}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Evaluation: {submission.scenario.title}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Attempted on {new Date(submission.createdAt).toLocaleString()}
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-card-border hover:bg-slate-800 rounded-lg transition-all self-start"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Score and Rubrics section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Main Score Card (Radial Dial) */}
          <div className="glass-card rounded-2xl border border-card-border p-8 flex flex-col items-center justify-center text-center relative overflow-hidden glow-indigo">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
            
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              Engineering Score
            </h3>

            {/* SVG Progress Circle */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-900 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-indigo-500 fill-none"
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * submission.score) / 100}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-5xl font-extrabold text-white">{submission.score}</span>
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider mt-1">
                  Overall Score
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs mt-8 italic max-w-[200px]">
              "No single correct answer. Reasoning over conclusions."
            </p>
          </div>

          {/* Rubric Scorecard */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-card-border p-8 flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 border-b border-card-border pb-3">
              Grade Breakdown (Max 25 pts each)
            </h3>

            <div className="space-y-6">
              {/* Problem Understanding */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-200 font-medium">Problem Understanding</span>
                  <span className="text-indigo-400 font-bold font-mono">
                    {submission.problemUnderstanding} <span className="text-slate-600 text-xs font-normal">/25</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-950">
                  <div
                    className="bg-indigo-500 h-full"
                    style={{ width: `${(submission.problemUnderstanding / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tradeoff Analysis */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-200 font-medium">Tradeoff Analysis</span>
                  <span className="text-violet-400 font-bold font-mono">
                    {submission.tradeoffAnalysis} <span className="text-slate-600 text-xs font-normal">/25</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-950">
                  <div
                    className="bg-violet-500 h-full"
                    style={{ width: `${(submission.tradeoffAnalysis / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Risk Analysis */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-200 font-medium">Risk Awareness</span>
                  <span className="text-cyan-400 font-bold font-mono">
                    {submission.riskAnalysis} <span className="text-slate-600 text-xs font-normal">/25</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-950">
                  <div
                    className="bg-cyan-500 h-full"
                    style={{ width: `${(submission.riskAnalysis / 25) * 100}%` }}
                  />
                </div>
              </div>

              {/* Decision Quality */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-200 font-medium">Decision Quality</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {submission.decisionQuality} <span className="text-slate-600 text-xs font-normal">/25</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-950">
                  <div
                    className="bg-emerald-500 h-full"
                    style={{ width: `${(submission.decisionQuality / 25) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Feedback: Mentor Narrative, Strengths, Weaknesses */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Overall Mentor Feedback */}
          <div className="glass-card rounded-2xl border border-card-border p-8 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Mentor Feedback Summary
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {submission.feedback}
            </p>

            <div className="mt-8 pt-6 border-t border-card-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Your Submitted Answer
              </h4>
              <div className="bg-slate-900/60 border border-card-border p-4 rounded-xl text-xs text-slate-400 leading-relaxed font-sans max-h-40 overflow-y-auto">
                {submission.answer}
              </div>
            </div>
          </div>

          {/* Right Column: Strengths & Weaknesses */}
          <div className="flex flex-col gap-6">
            {/* Strengths Card */}
            <div className="glass-card rounded-2xl border border-card-border p-6 glow-emerald/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
                ✔ Key Strengths
              </h4>
              {strengthsList.length === 0 ? (
                <p className="text-slate-500 text-xs">No specific strengths noted.</p>
              ) : (
                <ul className="space-y-2.5">
                  {strengthsList.map((str, idx) => (
                    <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-emerald-400 select-none">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Weaknesses Card */}
            <div className="glass-card rounded-2xl border border-card-border p-6 glow-cyan/5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-2">
                ⚠ Risk Factors & Gaps
              </h4>
              {weaknessesList.length === 0 ? (
                <p className="text-slate-500 text-xs">No major gaps identified.</p>
              ) : (
                <ul className="space-y-2.5">
                  {weaknessesList.map((weak, idx) => (
                    <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-cyan-400 select-none">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Mentor Challenge Section */}
        <section className="glass-card rounded-2xl border border-indigo-900/30 p-8 glow-indigo/5">
          <div className="flex items-center gap-3 border-b border-card-border pb-4 mb-6">
            <span className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-violet-400 rounded-full" />
            <div>
              <h3 className="text-base font-bold text-white">Mentor Challenge: Defend Your Decisions</h3>
              <p className="text-xs text-slate-400">Gemini pushes you to address assumptions or oversights.</p>
            </div>
          </div>

          <div className="space-y-6 max-w-4xl">
            {/* The Challenge Question (from Gemini) */}
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0 font-mono">
                AI
              </div>
              <div className="p-4 bg-indigo-950/40 border border-indigo-900/40 rounded-xl rounded-tl-none max-w-xl text-slate-200 text-sm leading-relaxed">
                <strong>Mentor Challenge:</strong>
                <p className="mt-1">{submission.challengeQuestion}</p>
              </div>
            </div>

            {/* Condition 1: User hasn't responded yet */}
            {submission.challengeAnswer === null && (
              <form onSubmit={handleChallengeSubmit} className="pl-12 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Write Your Defense / Justification
                  </label>
                  <textarea
                    required
                    value={challengeAnswerInput}
                    onChange={(e) => setChallengeAnswerInput(e.target.value)}
                    placeholder="Type your response to the mentor challenge. Address the trade-offs, explain your choice, or provide numbers to support your defense."
                    className="w-full h-32 bg-slate-900/80 border border-card-border text-slate-200 text-sm p-4 rounded-xl focus:outline-none focus:border-indigo-500 font-sans resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingChallenge || !challengeAnswerInput.trim()}
                  className="px-6 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-lg transition-all shadow-md shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingChallenge ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-t border-white" />
                      Mentor is reviewing...
                    </>
                  ) : (
                    "Submit Defense"
                  )}
                </button>
              </form>
            )}

            {/* Condition 2: User has responded, show response and feedback */}
            {submission.challengeAnswer !== null && (
              <div className="space-y-6">
                {/* User's response */}
                <div className="flex gap-4 items-start justify-end">
                  <div className="p-4 bg-slate-900 border border-card-border rounded-xl rounded-tr-none max-w-xl text-slate-300 text-sm leading-relaxed">
                    <strong>Your Response:</strong>
                    <p className="mt-1">{submission.challengeAnswer}</p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0 font-mono">
                    ME
                  </div>
                </div>

                {/* Gemini's feedback */}
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0 font-mono">
                    AI
                  </div>
                  <div className="p-5 bg-slate-950 border border-card-border rounded-xl rounded-tl-none max-w-2xl text-slate-200 text-sm leading-relaxed glow-indigo/5">
                    <strong>Mentor Review:</strong>
                    {submission.challengeFeedback ? (
                      <p className="mt-2 text-slate-300 whitespace-pre-wrap">{submission.challengeFeedback}</p>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs animate-pulse">
                        <div className="animate-spin rounded-full h-3 w-3 border-t border-slate-500" />
                        Generating feedback...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
