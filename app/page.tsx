import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Transform Your Data Strategy with{" "}
            <span className="text-primary">Edge Computing</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Combining Fortune 500 data architecture expertise with cutting-edge IoT integration 
            to deliver real-time insights where and when your business needs them most.
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

      {/* Services Preview */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Specialized AI & Data Engineering Services
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Edge Computing Solutions</CardTitle>
                <CardDescription>
                  Real-time processing at the source with IoT integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Raspberry Pi</Badge>
                  <Badge variant="secondary">Arduino</Badge>
                  <Badge variant="secondary">Industrial IoT</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise Data Architecture</CardTitle>
                <CardDescription>
                  Scalable data pipelines and analytics platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Data Lakes</Badge>
                  <Badge variant="secondary">ETL Pipelines</Badge>
                  <Badge variant="secondary">Real-time Analytics</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI/ML Implementation</CardTitle>
                <CardDescription>
                  Predictive analytics and intelligent automation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Predictive Maintenance</Badge>
                  <Badge variant="secondary">Computer Vision</Badge>
                  <Badge variant="secondary">NLP</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Market Focus */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">
            Serving <span className="text-primary">Grand Rapids</span> & West Michigan
          </h2>
          <p className="text-lg text-muted-foreground mb-12">
            Specialized expertise for healthcare, manufacturing, and retail enterprises 
            seeking digital transformation through intelligent data solutions.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-2xl font-bold text-accent mb-2">$150-275/hour</h3>
              <p className="text-muted-foreground">Premium AI & edge computing rates</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-accent mb-2">35% Reduction</h3>
              <p className="text-muted-foreground">Average manufacturing downtime decrease</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-accent mb-2">$2.4M</h3>
              <p className="text-muted-foreground">Annual savings from predictive maintenance</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
