export interface AIPilotData {
  generated: string;
  pipelineVersion: string;
  license: LicenseData;
  typeRatings: TypeRating[];
  activityHeatmap: HeatmapDay[];
  hourlyDistribution: HourlyDistribution;
  instrumentRatings: Record<string, InstrumentRating>;
  competencyRadar: CompetencyAxis[];
  pilotingStyle: PilotingStyle;
  missionLog: Mission[];
  tokenEconomy: TokenEconomy;
  streaks: StreakData;
  skillsCloud: SkillTag[];
}

export interface LicenseData {
  number: string;
  class: "ATP" | "Commercial" | "Private" | "Student";
  issued: string;
  expires: string;
  totalSessions: number;
  totalMessages: number;
  totalCostUSD: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheTokens: number;
  modelCount: number;
  projectCount: number;
}

export interface TypeRating {
  modelId: string;
  displayName: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  costUSD: number;
  costShare: number;
  proficiency: "Expert" | "Proficient" | "Familiar" | "Exposure";
  contextWindow: number;
  maxOutputTokens: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
  sessions: number;
  toolCalls: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface HourlyDistribution {
  hours: HourBucket[];
  peakHour: number;
  peakCount: number;
}

export interface HourBucket {
  hour: number;
  label: string;
  count: number;
}

export interface InstrumentRating {
  score: number;
  hits: number;
  matchedKeywords: string[];
  keywordCoverage: number;
}

export interface CompetencyAxis {
  axis: string;
  score: number;
  detail: string;
}

export interface PilotingStyle {
  directive: number;
  collaborative: number;
  planFirst: number;
  iterate: number;
  label: string;
  description: string;
}

export interface Mission {
  name: string;
  sessions: number;
  messages: number;
  complexity: number;
  domain: string;
  technologies: string[];
  status: "active" | "recent" | "archived" | "unknown";
  firstActive: string;
  lastActive: string;
}

export interface TokenEconomy {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  totalCacheCreateTokens: number;
  totalCostUSD: number;
  cacheEfficiency: number;
  costPerSession: number;
  webSearches: number;
  dailyTokens: { date: string; tokens: number }[];
}

export interface StreakData {
  current: number;
  longest: number;
  peakDay: string;
  peakDayCount: number;
  peakWeek: string;
  peakWeekCount: number;
  totalActiveDays: number;
}

export interface SkillTag {
  name: string;
  count: number;
  category: string;
}
