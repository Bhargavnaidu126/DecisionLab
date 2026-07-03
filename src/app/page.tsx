import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030712]">
      <Navbar />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pulse-glow -z-10" />
          
          <span className="px-3 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/80 rounded-full border border-indigo-900 mb-6 inline-block">
            AI-POWERED SIMULATOR FOR TECH LEADERS
          </span>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-slate-400 bg-clip-text text-transparent max-w-4xl mx-auto leading-tight">
            Train Your Engineering Judgment, Not Just Your Syntax
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            DecisionLab simulates production crises, architectural dilemmas, and database failures. Reason through constraints, evaluate tradeoffs, and receive structured AI mentoring.
          </p>
          
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 text-base font-bold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20"
            >
              Start Practicing
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 text-base font-semibold text-slate-300 hover:text-white bg-slate-900 border border-card-border hover:bg-slate-800 rounded-xl transition-all"
            >
              Sign In to Your Dashboard
            </Link>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="w-full max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Why DecisionLab?</h2>
            <p className="text-slate-400 mt-2">Syntax is cheap. Judgment is what makes senior engineers valuable.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl border border-card-border">
              <div className="w-12 h-12 bg-indigo-950 border border-indigo-800 rounded-xl flex items-center justify-center text-indigo-400 text-xl font-bold mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real-World Dilemmas</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                No clean answers or single correct lines of code. Face scaling issues, failovers, microservices separation, or security trade-offs.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-card-border">
              <div className="w-12 h-12 bg-violet-950 border border-violet-800 rounded-xl flex items-center justify-center text-violet-400 text-xl font-bold mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Mandatory Tradeoff Reasoning</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Explain not just *what* you would do, but *why* you chose it, which alternatives you considered, and what risks you accepted.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-card-border">
              <div className="w-12 h-12 bg-cyan-950 border border-cyan-800 rounded-xl flex items-center justify-center text-cyan-400 text-xl font-bold mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Gemini AI Mentor Challenge</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive an objective score, strengths, weaknesses, and a direct follow-up challenge where you defend your design decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Evaluation Rubric Details */}
        <section className="w-full bg-slate-950 border-y border-card-border py-16">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
                The Grading Rubric
              </span>
              <h2 className="text-3xl font-bold text-white mt-2">
                How Your Solutions Are Evaluated
              </h2>
              <p className="text-slate-400 mt-4 leading-relaxed">
                Our AI evaluation mirrors the system design reviews of top-tier technology companies. Every response is graded out of 100 points, split across four pillars:
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex gap-4">
                  <div className="text-indigo-400 font-semibold font-mono">25%</div>
                  <div>
                    <h4 className="text-white font-medium">Problem Understanding</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Identifying actual technical bottlenecks and system constraints.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-violet-400 font-semibold font-mono">25%</div>
                  <div>
                    <h4 className="text-white font-medium">Tradeoff Analysis</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Comparing different system architectures and justifying decisions.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-cyan-400 font-semibold font-mono">25%</div>
                  <div>
                    <h4 className="text-white font-medium">Risk Analysis</h4>
                    <p className="text-slate-400 text-xs mt-0.5">Anticipating failure modes, overhead, data consistency, and operational load.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="text-emerald-400 font-semibold font-mono">25%</div>
                  <div>
                    <h4 className="text-white font-medium">Decision Quality</h4>
                    <p className="text-slate-400 text-xs mt-0.5">The practicality, cost, and efficiency of your proposed design.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-card-border glow-indigo">
              <div className="border-b border-card-border pb-4 mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Example Scenario
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-900 rounded">
                  MEDIUM
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Database Scaling Crisis</h3>
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                Traffic increased from 10,000 requests/minute to 100,000 requests/minute. Database CPU is constantly above 95%. Current stack: Node.js, PostgreSQL.
              </p>
              <div className="mt-4 pt-4 border-t border-card-border">
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                  Guidance Checklist
                </div>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  <li className="flex items-center gap-2">✔ Explain the primary problem you identified.</li>
                  <li className="flex items-center gap-2">✔ Propose a solution with concrete reasoning.</li>
                  <li className="flex items-center gap-2">✔ Outline the alternatives considered.</li>
                  <li className="flex items-center gap-2">✔ Discuss operational risks and tradeoffs.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-card-border mt-16 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} DecisionLab. AI-powered Engineering Judgment Simulator.</p>
        </footer>
      </main>
    </div>
  );
}
