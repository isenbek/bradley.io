export interface ProjectSummary {
  name: string;
  tagline: string;
  purpose: string;
  technologies: string[];
  role: "developer" | "architect" | "inventor" | "lead" | "designer";
  innovations: string[];
  enterprise_relevance: string | null;
  maker_relevance: string | null;
  category: "professional" | "adventure" | "hybrid";
  claude_involvement: string | null;
  complexity_score: number;
  resume_highlight: string;
  project_dir: string;
  scanned_at: string;
}

export interface TechnologyCount {
  name: string;
  count: number;
}

export interface ResumeData {
  generated: string;
  projectCount: number;
  projects: ProjectSummary[];
  professionalProjects: ProjectSummary[];
  adventureProjects: ProjectSummary[];
  hybridProjects: ProjectSummary[];
  topTechnologies: TechnologyCount[];
  claudeContributions: Array<{
    project: string;
    contribution: string;
  }>;
  transunionRelevance: Array<{
    project: string;
    relevance: string[];
    highlight: string;
  }>;
  victorytextRelevance: Array<{
    project: string;
    relevance: string[];
    highlight: string;
  }>;
  themes: {
    distributedSystems: number;
    dataEngineering: number;
    edgeComputing: number;
    aiMl: number;
  };
}
