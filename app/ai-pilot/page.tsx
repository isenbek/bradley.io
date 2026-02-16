"use client";

import useSWR from "swr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataRefreshIndicator } from "@/components/resume";
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AIPilotPage() {
  const { data, error, isLoading, mutate } = useSWR<AIPilotData>(
    "/api/ai-pilot",
    fetcher,
    {
      refreshInterval: 300000, // 5-minute refresh
      revalidateOnFocus: true,
    }
  );

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-destructive mb-2">
            Flight Data Unavailable
          </h1>
          <p className="text-muted-foreground mb-4">
            Run the pipeline to generate flight data:
          </p>
          <code className="block bg-muted rounded-md px-4 py-2 font-mono text-sm">
            python scripts/ai-pilot-pipeline.py
          </code>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Loading skeleton */}
          <div className="space-y-6">
            <div className="h-64 rounded-2xl bg-muted animate-pulse" />
            <div className="h-12 rounded-lg bg-muted animate-pulse max-w-md" />
            <div className="h-10 rounded-md bg-muted animate-pulse max-w-lg" />
            <div className="h-96 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Data refresh indicator */}
        <div className="flex items-center justify-between">
          <h1 className="sr-only">AI Pilot License</h1>
          {data.generated && (
            <DataRefreshIndicator
              lastUpdated={data.generated}
              isLoading={isLoading}
              onRefresh={() => mutate()}
            />
          )}
        </div>

        {/* Hero: License Card */}
        <LicenseCard license={data.license} />

        {/* Streak Banner */}
        <StreakBanner streaks={data.streaks} />

        {/* Tabbed Content */}
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="activity" className="flex-1 min-w-[80px]">
              Activity
            </TabsTrigger>
            <TabsTrigger value="competency" className="flex-1 min-w-[80px]">
              Competency
            </TabsTrigger>
            <TabsTrigger value="missions" className="flex-1 min-w-[80px]">
              Missions
            </TabsTrigger>
            <TabsTrigger value="models" className="flex-1 min-w-[80px]">
              Models
            </TabsTrigger>
            <TabsTrigger value="style" className="flex-1 min-w-[80px]">
              Style
            </TabsTrigger>
          </TabsList>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8 pt-4">
            <ActivityHeatmap data={data.activityHeatmap} />
            <HourlyDistribution data={data.hourlyDistribution} />
          </TabsContent>

          {/* Competency Tab */}
          <TabsContent value="competency" className="space-y-8 pt-4">
            <div className="grid gap-8 lg:grid-cols-2">
              <CompetencyRadar data={data.competencyRadar} />
              <InstrumentRatings ratings={data.instrumentRatings} />
            </div>
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="pt-4">
            <MissionLog missions={data.missionLog} />
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-8 pt-4">
            <TypeRatings ratings={data.typeRatings} />
            <TokenEconomy economy={data.tokenEconomy} />
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-8 pt-4">
            <div className="grid gap-8 lg:grid-cols-2">
              <PilotingStyle style={data.pilotingStyle} />
              <SkillsCloud skills={data.skillsCloud} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
