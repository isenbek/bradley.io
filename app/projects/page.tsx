"use client"

import Link from "next/link"
import { GitHubRepos } from "@/components/sections/github-repos"

export default function ProjectsPage() {
  const featuredProjects = [
    {
      name: "Plumbr",
      tagline: "C++ distributed system management with lock-free task queuing",
      category: "Distributed Systems",
      technologies: ["C++", "IPv6", "mDNS", "Ed25519", "seccomp-bpf"],
      highlight: "Lock-free circular buffer task queue with work stealing",
    },
    {
      name: "Zephyr",
      tagline: "WiFi AI mesh network using raw 802.11 frames",
      category: "Mesh Networks",
      technologies: ["Python", "802.11", "LLM", "Ollama", "Vector Embeddings"],
      highlight: "Custom wireless protocol for distributed AI communication",
    },
    {
      name: "Spondr",
      tagline: "Real-time aviation intelligence with ML pipeline",
      category: "AI/ML",
      technologies: ["Python", "ADS-B", "DuckDB", "scikit-learn", "WebSocket"],
      highlight: "50+ aircraft/second processing with <100ms latency",
    },
    {
      name: "Hotbits",
      tagline: "True random number generator from hardware timing jitter",
      category: "Cryptography",
      technologies: ["Python", "FFT", "Signal Processing", "NIST STS"],
      highlight: "Cryptographic-grade entropy passing dieharder tests",
    },
    {
      name: "Lochness",
      tagline: "Multi-schema data warehouse for email marketing analytics",
      category: "Data Engineering",
      technologies: ["Snowflake", "SQL", "S3", "ETL"],
      highlight: "158M contacts and 14.5B events with fractional ownership",
    },
    {
      name: "Sovereign",
      tagline: "Assembly-like agentic programming language for self-improving systems",
      category: "Language Design",
      technologies: ["Python", "Lark Parser", "Ollama", "LLM"],
      highlight: "32-instruction minimal language with error-driven evolution",
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Projects
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            A collection of production systems and experimental projects.
            From enterprise data platforms to garage lab experiments—all built
            with the same philosophy: elegant solutions to real problems.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Featured Projects */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Featured Projects</h2>
            <Link
              href="/"
              className="text-sm text-teal-600 hover:text-teal-800"
            >
              View all on resume →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {featuredProjects.map((project) => (
              <div
                key={project.name}
                className="p-5 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {project.category}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{project.tagline}</p>
                <p className="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded mb-3">
                  {project.highlight}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 4 && (
                    <span className="text-xs text-slate-400">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="bg-slate-50 -mx-4 px-4 py-8 md:rounded-lg md:mx-0 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-mono font-bold text-teal-600">33</div>
              <div className="text-sm text-slate-600">Documented Projects</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-teal-600">67</div>
              <div className="text-sm text-slate-600">Total Repositories</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-amber-600">15+</div>
              <div className="text-sm text-slate-600">Years Experience</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-amber-600">100%</div>
              <div className="text-sm text-slate-600">Open Source</div>
            </div>
          </div>
        </section>

        {/* GitHub Repos */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            GitHub Repositories
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
                TinyMachines Organization
              </h3>
              <GitHubRepos source="org" limit={6} showStats={true} />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">
            Project Categories
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Distributed Systems", count: 8, color: "teal" },
              { name: "Data Engineering", count: 6, color: "teal" },
              { name: "AI/ML Integration", count: 7, color: "purple" },
              { name: "Edge Computing", count: 5, color: "amber" },
              { name: "Mesh Networks", count: 4, color: "amber" },
              { name: "API Architecture", count: 6, color: "teal" },
            ].map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200"
              >
                <span className="text-slate-700">{cat.name}</span>
                <span
                  className={`text-sm font-mono font-bold ${
                    cat.color === "teal"
                      ? "text-teal-600"
                      : cat.color === "amber"
                      ? "text-amber-600"
                      : "text-purple-600"
                  }`}
                >
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-200 pt-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Interested in collaborating?
          </h2>
          <p className="text-slate-600 mb-6">
            All projects are open source. Feel free to explore, fork, or reach out.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://github.com/tinymachines"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              View on GitHub
            </a>
            <Link
              href="/terminal"
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:border-slate-400 transition-colors"
            >
              Try the Terminal
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
