import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <span className="font-mono text-sm text-primary font-bold tracking-wider">
              AI + DATA ENGINEERING + EDGE COMPUTING
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Build <span className="text-primary">Intelligent Systems</span> That
            <br />
            Process <span className="text-secondary">Billions of Rows</span>
            <br />
            at the <span className="text-accent">Speed of Thought</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Senior architect with 10+ years transforming enterprise data into competitive advantage.
            From real-time ML pipelines to edge AI deployment, I turn complex data challenges 
            into scalable, production-ready solutions.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">
              Schedule Consultation
            </Button>
            <Button variant="outline" size="lg">
              View Case Studies
            </Button>
          </div>
        </div>
      </section>

      {/* Tech Stack Showcase */}
      <section className="py-12 px-4 border-y">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <span className="font-mono text-sm">Python</span>
            <span className="font-mono text-sm">TensorFlow</span>
            <span className="font-mono text-sm">Apache Spark</span>
            <span className="font-mono text-sm">Kubernetes</span>
            <span className="font-mono text-sm">AWS/Azure/GCP</span>
            <span className="font-mono text-sm">Kafka</span>
            <span className="font-mono text-sm">Airflow</span>
            <span className="font-mono text-sm">Docker</span>
            <span className="font-mono text-sm">PostgreSQL</span>
            <span className="font-mono text-sm">Snowflake</span>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Engineering Solutions for Modern Data Challenges
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            From petabyte-scale architectures to real-time ML systems, 
            I deliver production-ready solutions that scale.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="font-mono text-xs text-primary mb-2">01.</div>
                <CardTitle>AI/ML Systems</CardTitle>
                <CardDescription>
                  Production ML pipelines processing millions of predictions daily
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">TensorFlow</Badge>
                  <Badge variant="secondary">MLflow</Badge>
                  <Badge variant="secondary">Feature Stores</Badge>
                  <Badge variant="secondary">A/B Testing</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="font-mono text-xs text-primary mb-2">02.</div>
                <CardTitle>Data Platforms</CardTitle>
                <CardDescription>
                  Petabyte-scale architectures with sub-second query performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Spark</Badge>
                  <Badge variant="secondary">Databricks</Badge>
                  <Badge variant="secondary">Snowflake</Badge>
                  <Badge variant="secondary">dbt</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="font-mono text-xs text-primary mb-2">03.</div>
                <CardTitle>Real-time Processing</CardTitle>
                <CardDescription>
                  Stream processing systems handling 100K+ events per second
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Kafka</Badge>
                  <Badge variant="secondary">Flink</Badge>
                  <Badge variant="secondary">Redis</Badge>
                  <Badge variant="secondary">WebSockets</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Engineering Impact at Scale
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Real results from real projects. Every metric represents production systems 
            delivering business value today.
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <h3 className="text-4xl font-bold text-primary font-mono mb-2">2B+</h3>
              <p className="text-sm text-muted-foreground">Rows Processed Daily</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <h3 className="text-4xl font-bold text-secondary font-mono mb-2">78%</h3>
              <p className="text-sm text-muted-foreground">Faster Processing</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <h3 className="text-4xl font-bold text-accent font-mono mb-2">$2.4M</h3>
              <p className="text-sm text-muted-foreground">Annual Savings</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-muted/50">
              <h3 className="text-4xl font-bold text-primary font-mono mb-2">99.99%</h3>
              <p className="text-sm text-muted-foreground">System Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Data Infrastructure?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Let's discuss how AI and modern data engineering can drive your business forward.
            <br />
            <span className="font-mono text-lg">Grand Rapids, Michigan | $150-275/hour</span>
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Schedule Consultation
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
              View Terminal Portfolio
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
