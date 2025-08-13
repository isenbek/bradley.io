"use client"

import { GitHubRepos } from "@/components/sections/github-repos"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Terminal, Github, Briefcase, TrendingUp } from "lucide-react"

export default function ProjectsPage() {
  const featuredProjects = [
    {
      title: "Commission Calculation Engine",
      company: "TransUnion SRG",
      description: "Built real-time data pipeline processing $2B+ in annual transactions with 78% performance improvement",
      impact: "$2.4M annual savings",
      tech: ["Python", "Apache Spark", "AWS", "Kafka"],
      metrics: {
        transactions: "10M+ daily",
        performance: "78% faster",
        uptime: "99.99%",
      },
    },
    {
      title: "Predictive Maintenance Platform",
      company: "Manufacturing Client",
      description: "IoT edge computing solution reducing equipment downtime through ML-powered failure prediction",
      impact: "35% downtime reduction",
      tech: ["Raspberry Pi", "TensorFlow Lite", "MQTT", "Python"],
      metrics: {
        sensors: "500+ devices",
        latency: "<200ms",
        accuracy: "94%",
      },
    },
    {
      title: "Patient Monitoring System",
      company: "Healthcare Provider",
      description: "HIPAA-compliant real-time monitoring with edge AI for critical patient alerts",
      impact: "40% faster response",
      tech: ["Arduino", "Edge AI", "Azure IoT", "React"],
      metrics: {
        patients: "1,000+ monitored",
        alerts: "Sub-second",
        compliance: "HIPAA certified",
      },
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-6">
            Projects & Open Source
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            From billion-dollar enterprise systems to cutting-edge IoT solutions, 
            explore the projects that demonstrate real-world impact.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild>
              <Link href="/terminal">
                <Terminal className="mr-2 h-4 w-4" />
                Interactive Terminal
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="https://github.com/tinymachines" target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                GitHub Organization
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Featured Enterprise Projects</h2>
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {featuredProjects.map((project, idx) => (
              <Card key={idx} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline">
                      <Briefcase className="mr-1 h-3 w-3" />
                      {project.company}
                    </Badge>
                    <Badge variant="default">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      {project.impact}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{project.title}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {Object.entries(project.metrics).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <p className="text-sm font-bold text-primary">{value}</p>
                        <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Repositories */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Open Source Contributions</h2>
          
          <Tabs defaultValue="org" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="org">TinyMachines Org</TabsTrigger>
              <TabsTrigger value="personal">Personal Repos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="org" className="mt-8">
              <div className="mb-6 text-center">
                <p className="text-muted-foreground">
                  Open source projects and tools from the TinyMachines organization
                </p>
              </div>
              <GitHubRepos source="org" limit={6} showStats={true} />
            </TabsContent>
            
            <TabsContent value="personal" className="mt-8">
              <div className="mb-6 text-center">
                <p className="text-muted-foreground">
                  Personal repositories and experiments
                </p>
              </div>
              <GitHubRepos source="user" username="isenbek" limit={6} showStats={true} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl text-center">
          <h3 className="text-2xl font-bold mb-4">
            Let's Build Something Amazing Together
          </h3>
          <p className="text-muted-foreground mb-8">
            Whether it's edge computing, data engineering, or AI implementation, 
            I'm ready to tackle your most challenging projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact">Start a Project</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/services">View Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}