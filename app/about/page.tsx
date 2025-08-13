import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, TrendingUp, Users, Zap } from "lucide-react"

export default function AboutPage() {
  const skills = {
    "Programming": ["Python", "TypeScript", "SQL", "Scala", "R"],
    "Cloud & Infrastructure": ["AWS", "Azure", "GCP", "Docker", "Kubernetes"],
    "Data Engineering": ["Apache Spark", "Airflow", "Kafka", "Databricks", "Snowflake"],
    "AI/ML": ["TensorFlow", "PyTorch", "Scikit-learn", "MLflow", "Hugging Face"],
    "Edge Computing": ["Raspberry Pi", "Arduino", "MQTT", "Edge AI", "IoT Protocols"],
    "Visualization": ["D3.js", "Tableau", "Power BI", "Grafana", "Plotly"],
  }

  const experience = [
    {
      role: "Senior Data Architect",
      company: "TransUnion SRG",
      period: "2018-2023",
      highlights: [
        "Designed commission calculation systems processing $2B+ annually",
        "Built real-time data pipelines handling 10M+ daily transactions",
        "Reduced processing time by 78% through architecture optimization",
        "Led team of 8 engineers in microservices migration",
      ],
    },
    {
      role: "Data Engineering Consultant",
      company: "NYC Headhunter Firm",
      period: "2016-2018",
      highlights: [
        "Automated candidate matching algorithms improving placement rates by 45%",
        "Developed predictive models for talent retention analytics",
        "Created executive dashboards tracking key recruitment metrics",
        "Integrated multiple ATS systems into unified data warehouse",
      ],
    },
  ]

  const certifications = [
    "AWS Certified Solutions Architect",
    "Azure Data Engineer Associate",
    "Google Cloud Professional Data Engineer",
    "Databricks Certified Associate Developer",
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">
            Bridging Enterprise Architecture with Edge Innovation
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            With over a decade of experience transforming data strategies for Fortune 500 
            companies, I specialize in the convergence of enterprise data architecture, 
            AI/ML implementation, and hands-on edge computing solutions.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Badge variant="outline" className="px-4 py-2 text-base">
              <TrendingUp className="h-4 w-4 mr-2" />
              10+ Years Experience
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-base">
              <Users className="h-4 w-4 mr-2" />
              50+ Enterprise Projects
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-base">
              <Zap className="h-4 w-4 mr-2" />
              Edge Computing Expert
            </Badge>
          </div>
        </div>
      </section>

      {/* Professional Journey */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Professional Journey</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {experience.map((exp) => (
              <Card key={exp.company}>
                <CardHeader>
                  <CardTitle className="text-xl">{exp.role}</CardTitle>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{exp.company}</span>
                    <span>{exp.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Expertise */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Technical Expertise</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(skills).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Unique Value Proposition */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Work With Me</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Enterprise Experience</h3>
              <p className="text-sm text-muted-foreground">
                Proven track record with Fortune 500 companies, handling billion-dollar 
                data systems and mission-critical infrastructure.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Edge Computing Pioneer</h3>
              <p className="text-sm text-muted-foreground">
                Unique expertise bridging enterprise architecture with hands-on IoT 
                and edge device integration for real-time processing.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Business-First Approach</h3>
              <p className="text-sm text-muted-foreground">
                Focus on measurable ROI, with average client savings of $2.4M annually 
                through optimized data strategies and predictive analytics.
              </p>
            </div>
          </div>

          {/* Certifications */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>Professional Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {certifications.map((cert) => (
                  <div key={cert} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm">{cert}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Transform Your Data Strategy?
            </h3>
            <p className="text-muted-foreground mb-6">
              Let's discuss how edge computing and AI can drive your business forward.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Schedule Consultation</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/case-studies">View Case Studies</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}