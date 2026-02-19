"use client";

import { useState, useEffect } from "react";
import {
  LicenseCard,
  StreakBanner,
  ActivityHeatmap,
  HourlyDistribution,
  CompetencyRadar,
  InstrumentRatings,
  MissionLog,
  TypeRatings,
  TokenEconomy,
  PilotingStyle,
  SkillsCloud,
} from "@/components/ai-pilot";
import type { AIPilotData } from "@/components/ai-pilot/types";

const TABS = [
  { id: "activity", label: "Activity" },
  { id: "competency", label: "Competency" },
  { id: "missions", label: "Missions" },
  { id: "models", label: "Models" },
  { id: "style", label: "Style" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AIPilotPage() {
  const [data, setData] = useState<AIPilotData | null>(null);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("activity");

  useEffect(() => {
    fetch("/data/ai-pilot-data.json")
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--brand-error)" }}>
            Flight Data Unavailable
          </h1>
          <p className="mb-4" style={{ color: "var(--brand-muted)" }}>
            Run the pipeline to generate flight data:
          </p>
          <code
            className="block rounded-md px-4 py-2 font-mono text-sm"
            style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
          >
            python scripts/ai-pilot-pipeline.py
          </code>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
        <div className="container-page">
          <div className="space-y-4 sm:space-y-6">
            <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--brand-bg-alt)" }} />
            <div className="h-12 rounded-lg animate-pulse max-w-md" style={{ background: "var(--brand-bg-alt)" }} />
            <div className="h-10 rounded-md animate-pulse max-w-lg" style={{ background: "var(--brand-bg-alt)" }} />
            <div className="h-96 rounded-lg animate-pulse" style={{ background: "var(--brand-bg-alt)" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-24 pb-10 sm:pb-16">
      <div className="container-page space-y-4 sm:space-y-6">
        {/* Data freshness */}
        {data.generated && (
          <div className="text-right">
            <span className="text-xs font-mono" style={{ color: "var(--brand-muted)" }}>
              Last updated: {new Date(data.generated).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
          </div>
        )}

        {/* Hero: License Card */}
        <LicenseCard license={data.license} />

        {/* Streak Banner */}
        <StreakBanner streaks={data.streaks} />

        {/* Tab Navigation */}
        <div
          className="flex gap-1 p-1 rounded-lg overflow-x-auto scrollbar-none"
          style={{ background: "var(--brand-bg-alt)", border: "1px solid var(--brand-border)" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-[64px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id
                  ? "color-mix(in srgb, var(--brand-primary) 15%, transparent)"
                  : "transparent",
                color: activeTab === tab.id ? "var(--brand-primary)" : "var(--brand-muted)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === "activity" && (
            <div className="space-y-5 sm:space-y-8">
              <ActivityHeatmap data={data.activityHeatmap} />
              <HourlyDistribution data={data.hourlyDistribution} />
            </div>
          )}

          {activeTab === "competency" && (
            <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
              <CompetencyRadar data={data.competencyRadar} />
              <InstrumentRatings ratings={data.instrumentRatings} />
            </div>
          )}

          {activeTab === "missions" && (
            <MissionLog missions={data.missionLog} />
          )}

          {activeTab === "models" && (
            <div className="space-y-5 sm:space-y-8">
              <TypeRatings ratings={data.typeRatings} />
              <TokenEconomy economy={data.tokenEconomy} />
            </div>
          )}

          {activeTab === "style" && (
            <div className="grid gap-5 sm:gap-8 lg:grid-cols-2">
              <PilotingStyle style={data.pilotingStyle} />
              <SkillsCloud skills={data.skillsCloud} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
