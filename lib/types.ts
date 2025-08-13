export interface CaseStudy {
  id: string
  title: string
  slug: string
  client: string
  industry: "manufacturing" | "healthcare" | "retail" | "fintech"
  challenge: string
  solution: string
  technologies: string[]
  metrics: {
    label: string
    value: string
    improvement?: string
  }[]
  timeline: string
  roi?: number
  featured?: boolean
  image?: string
}

export interface Service {
  id: string
  title: string
  slug: string
  description: string
  features: string[]
  industries: string[]
  technologies: string[]
  pricing?: {
    type: "hourly" | "project" | "retainer"
    range: string
  }
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  publishedAt: string
  readTime: number
  tags: string[]
  featured?: boolean
  image?: string
}

export interface ContactForm {
  name: string
  email: string
  company: string
  projectType: "data-architecture" | "ai-ml" | "edge-computing" | "consulting"
  budget: "under-25k" | "25k-100k" | "100k-500k" | "500k-plus"
  message: string
  timeline: "immediate" | "1-3-months" | "3-6-months" | "6-plus-months"
}

export interface TechStack {
  category: string
  technologies: {
    name: string
    proficiency: number
    icon?: string
  }[]
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  image?: string
}