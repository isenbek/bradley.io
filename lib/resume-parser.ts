import resumeData from './resume-data.json';

export interface PersonalInfo {
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  location: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  achievements: string[];
}

export interface TechStack {
  languages: string[];
  tools: string[];
  projects: string[];
}

export interface Accomplishment {
  title: string;
  description: string;
}

export interface Strength {
  title: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  dateRange: string;
}

export interface Project {
  name: string;
  description: string;
  dateRange: string;
  location: string;
}

export interface Reference {
  name: string;
  contact: string;
}

export interface ResumeData {
  personal: PersonalInfo;
  summary: string;
  experience: Experience[];
  techStack: TechStack;
  keyAccomplishments: Accomplishment[];
  strengths: Strength[];
  education: Education[];
  projects: Project[];
  references: Reference[];
}

export class ResumeParser {
  private data: ResumeData;

  constructor() {
    this.data = resumeData as ResumeData;
  }

  getPersonalInfo(): PersonalInfo {
    return this.data.personal;
  }

  getSummary(): string {
    return this.data.summary;
  }

  getAllExperience(): Experience[] {
    return this.data.experience;
  }

  getRecentExperience(count: number = 3): Experience[] {
    return this.data.experience.slice(0, count);
  }

  getExperienceById(id: string): Experience | undefined {
    return this.data.experience.find(exp => exp.id === id);
  }

  getExperienceByCompany(company: string): Experience[] {
    return this.data.experience.filter(exp => 
      exp.company.toLowerCase().includes(company.toLowerCase())
    );
  }

  getTechStack(): TechStack {
    return this.data.techStack;
  }

  getLanguages(): string[] {
    return this.data.techStack.languages;
  }

  getTools(): string[] {
    return this.data.techStack.tools;
  }

  getTechProjects(): string[] {
    return this.data.techStack.projects;
  }

  getKeyAccomplishments(): Accomplishment[] {
    return this.data.keyAccomplishments;
  }

  getStrengths(): Strength[] {
    return this.data.strengths;
  }

  getEducation(): Education[] {
    return this.data.education;
  }

  getProjects(): Project[] {
    return this.data.projects;
  }

  getReferences(): Reference[] {
    return this.data.references;
  }

  // Utility methods for formatting and calculations
  getYearsOfExperience(): number {
    const earliestYear = Math.min(
      ...this.data.experience
        .map(exp => parseInt(exp.startDate))
        .filter(year => !isNaN(year))
    );
    const currentYear = new Date().getFullYear();
    return currentYear - earliestYear;
  }

  formatDateRange(startDate: string, endDate: string): string {
    if (endDate === 'Present') {
      return `${startDate} - Present`;
    }
    return `${startDate} - ${endDate}`;
  }

  getSkillCategories(): { [category: string]: string[] } {
    const { languages, tools, projects } = this.data.techStack;
    
    return {
      'Programming Languages': languages.filter(lang => 
        ['Python', 'C#', 'Javascript', 'Node JS', 'Java', 'PHP', 'HTML', 'Rust'].includes(lang)
      ),
      'Cloud & Infrastructure': languages.filter(lang => 
        ['AWS', 'Linux', 'Bash'].includes(lang)
      ).concat(tools.filter(tool => 
        ['Nginx', 'Certbot', 'OpenWRT'].includes(tool)
      )),
      'Data & Analytics': languages.filter(lang => 
        ['Snowflake', 'Athena'].includes(lang)
      ).concat(tools.filter(tool => 
        ['Postgres', 'MySQL', 'ElasticSearch', 'Redis', 'Apache SOLR', 'Hive', 'Hadoop', 'MongoDB'].includes(tool)
      )),
      'AI & Machine Learning': tools.filter(tool => 
        ['Huggingface', 'Google Colab', 'Generative AI', 'Streamlit', 'Weaviate'].includes(tool)
      ),
      'Development Tools': tools.filter(tool => 
        ['Git', 'FastAPI', 'Jupytr'].includes(tool)
      ),
      'IoT & Hardware': projects
    };
  }

  // Search functionality
  searchExperience(query: string): Experience[] {
    const lowerQuery = query.toLowerCase();
    return this.data.experience.filter(exp => 
      exp.title.toLowerCase().includes(lowerQuery) ||
      exp.company.toLowerCase().includes(lowerQuery) ||
      exp.description.toLowerCase().includes(lowerQuery) ||
      exp.achievements.some(achievement => 
        achievement.toLowerCase().includes(lowerQuery)
      )
    );
  }

  searchSkills(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const allSkills = [
      ...this.data.techStack.languages,
      ...this.data.techStack.tools,
      ...this.data.techStack.projects
    ];
    
    return allSkills.filter(skill => 
      skill.toLowerCase().includes(lowerQuery)
    );
  }

  // Export functionality
  exportToJSON(): string {
    return JSON.stringify(this.data, null, 2);
  }

  exportSummaryData() {
    return {
      name: this.data.personal.name,
      title: this.data.personal.title,
      location: this.data.personal.location,
      yearsOfExperience: this.getYearsOfExperience(),
      totalPositions: this.data.experience.length,
      skillCount: this.data.techStack.languages.length + this.data.techStack.tools.length,
      educationCount: this.data.education.length,
      projectCount: this.data.projects.length
    };
  }
}

// Create a singleton instance for easy access
export const resumeParser = new ResumeParser();

// Helper functions for common use cases
export const getResumeData = () => resumeParser;
export const getPersonalInfo = () => resumeParser.getPersonalInfo();
export const getSummary = () => resumeParser.getSummary();
export const getRecentExperience = (count?: number) => resumeParser.getRecentExperience(count);
export const getTechStack = () => resumeParser.getTechStack();
export const getSkillCategories = () => resumeParser.getSkillCategories();