"use client";

import useSWR from "swr";
import { ProjectCard, SkillBadge, DataRefreshIndicator } from "@/components/resume";
import type { ResumeData } from "@/components/resume";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ResumePage() {
  const { data, error, isLoading, mutate } = useSWR<ResumeData>(
    "/api/resume",
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Resume</h1>
          <p className="text-slate-600">Please try refreshing the page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Bradley S. Isenbek
              </h1>
              <p className="text-lg text-slate-600">
                Software Architect • Systems Integrator • Maker
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Grand Rapids, MI • brad@isenbek.io
              </p>
            </div>
            {data?.generated && (
              <DataRefreshIndicator
                lastUpdated={data.generated}
                isLoading={isLoading}
                onRefresh={() => mutate()}
              />
            )}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {data && (
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-teal-600">
                  {data.projectCount}
                </span>
                <span className="text-slate-600">Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-teal-600">
                  {data.themes.distributedSystems}
                </span>
                <span className="text-slate-600">Distributed Systems</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-amber-600">
                  {data.themes.edgeComputing}
                </span>
                <span className="text-slate-600">Edge/IoT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-purple-600">
                  {data.themes.aiMl}
                </span>
                <span className="text-slate-600">AI/ML</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold text-orange-600">
                  {data.claudeContributions.length}
                </span>
                <span className="text-slate-600">Claude Collabs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-12">
          {/* Introduction */}
          <section>
            <p className="text-lg text-slate-700 leading-relaxed">
              Full Stack Developer with 15+ years architecting high-volume production systems.
              Expert in distributed systems, data processing at scale, and cloud infrastructure.
              Known for building elegant solutions to complex problems—whether processing billions
              of data points in production or building distributed systems from salvaged hardware
              in my garage lab.
            </p>
          </section>

          {/* Top Technologies */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Technologies
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.topTechnologies.slice(0, 15).map((tech) => (
                <SkillBadge
                  key={tech.name}
                  name={tech.name}
                  count={tech.count}
                  variant="default"
                />
              ))}
            </div>
          </section>

          {/* Professional Projects */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Professional Portfolio
              </h2>
              <span className="text-sm text-teal-600 font-mono">
                {data.professionalProjects.length} projects
              </span>
            </div>
            <div className="grid gap-4">
              {data.professionalProjects.slice(0, 6).map((project) => (
                <ProjectCard
                  key={project.project_dir}
                  project={project}
                  variant="professional"
                />
              ))}
            </div>
            {data.professionalProjects.length > 6 && (
              <p className="mt-4 text-sm text-slate-500 text-center">
                + {data.professionalProjects.length - 6} more professional projects
              </p>
            )}
          </section>

          {/* Adventures */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Adventures in Computing
              </h2>
              <span className="text-sm text-amber-600 font-mono">
                {data.adventureProjects.length + data.hybridProjects.length} projects
              </span>
            </div>
            <p className="text-slate-600 mb-6">
              Beyond production systems, I maintain an active maker practice. These projects
              represent curiosity-driven exploration, hardware hacking, and experimental
              systems that push boundaries.
            </p>
            <div className="grid gap-4">
              {[...data.adventureProjects, ...data.hybridProjects]
                .slice(0, 6)
                .map((project) => (
                  <ProjectCard
                    key={project.project_dir}
                    project={project}
                    variant="adventure"
                  />
                ))}
            </div>
          </section>

          {/* Claude Contributions */}
          {data.claudeContributions.length > 0 && (
            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Claude as Co-Developer
              </h2>
              <p className="text-slate-600 mb-4">
                A distinctive pattern emerges: Claude is used as a collaborative
                development partner, not just a code completion tool.
              </p>
              <div className="grid gap-3">
                {data.claudeContributions.map((contrib) => (
                  <div
                    key={contrib.project}
                    className="flex items-start gap-3 p-3 rounded-lg bg-orange-50"
                  >
                    <span className="inline-block h-5 w-5 rounded bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-900">
                        {contrib.project}
                      </span>
                      <p className="text-sm text-slate-600">{contrib.contribution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TransUnion Connection */}
          {data.transunionRelevance.length > 0 && (
            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                TransUnion Experience (2014-2018)
              </h2>
              <p className="text-slate-600 mb-4">
                Projects demonstrating continued expertise in areas developed at TransUnion SRG:
              </p>
              <div className="flex flex-wrap gap-2">
                {data.transunionRelevance.slice(0, 8).map((item) => (
                  <span
                    key={item.project}
                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-full"
                  >
                    {item.project}: {item.relevance.slice(0, 2).join(", ")}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-slate-500">
          <p>
            This resume is generated automatically from project documentation using{" "}
            <code className="font-mono text-xs bg-slate-200 px-1 rounded">
              autoresume.py
            </code>
          </p>
          <p className="mt-2">
            <a
              href="https://github.com/tinymachines"
              className="text-teal-600 hover:text-teal-800"
            >
              github.com/tinymachines
            </a>
            {" • "}
            <span>Grand Rapids, MI</span>
          </p>
        </div>
      </footer>
    </main>
  );
}
