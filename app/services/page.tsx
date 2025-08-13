import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Cpu, 
  Database, 
  Brain, 
  Factory, 
  Activity,
  ShoppingCart,
  ArrowRight,
  CheckCircle2
} from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      id: "edge-computing",
      title: "Edge Computing Solutions",
      description: "Real-time data processing at the source with IoT integration",
      icon: Cpu,
      features: [
        "IoT device integration (Raspberry Pi, Arduino)",
        "Edge AI model deployment",
        "Real-time stream processing",
        "Hybrid cloud architectures",
        "Industrial IoT solutions",
      ],
      industries: ["Manufacturing", "Healthcare", "Retail"],
      pricing: "$175-275/hour",
      color: "text-primary",
    },
    {
      id: "data-architecture",
      title: "Enterprise Data Architecture",
      description: "Scalable data platforms and pipeline engineering",
      icon: Database,
      features: [
        "Data lake and warehouse design",
        "ETL/ELT pipeline development",
        "Real-time analytics platforms",
        "Data governance frameworks",
        "Multi-cloud data strategies",
      ],
      industries: ["Finance", "Healthcare", "Retail"],
      pricing: "$150-225/hour",
      color: "text-secondary",
    },
    {
      id: "ai-ml",
      title: "AI/ML Implementation",
      description: "Predictive analytics and intelligent automation",
      icon: Brain,
      features: [
        "Predictive maintenance models",
        "Computer vision solutions",
        "Natural language processing",
        "Recommendation engines",
        "MLOps and model deployment",
      ],
      industries: ["Manufacturing", "E-commerce", "Healthcare"],
      pricing: "$200-275/hour",
      color: "text-accent",
    },
  ]

  const industryFocus = [
    {
      name: "Manufacturing",
      icon: Factory,
      stats: "35% downtime reduction",
      solutions: ["Predictive maintenance", "Quality control AI", "Supply chain optimization"],
    },
    {
      name: "Healthcare",
      icon: Activity,
      stats: "HIPAA compliant",
      solutions: ["Patient data integration", "Medical imaging AI", "Real-time monitoring"],
    },
    {
      name: "Retail",
      icon: ShoppingCart,
      stats: "28% revenue increase",
      solutions: ["Inventory optimization", "Customer analytics", "Demand forecasting"],
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl font-bold mb-6">
            AI & Data Engineering Services
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Transform your enterprise with cutting-edge data solutions that deliver 
            measurable ROI. From edge computing to AI implementation, we provide 
            end-to-end data engineering expertise.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Badge variant="outline" className="px-4 py-2">
              Grand Rapids, Michigan
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              $150-275/hour
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              Fortune 500 Experience
            </Badge>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Core Services</h2>
          <div className="grid lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.id} className="relative overflow-hidden">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 ${service.color}`}>
                    <service.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Key Features:</h4>
                    <ul className="space-y-1">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Industries:</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.industries.map((industry) => (
                        <Badge key={industry} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Starting at:</span>
                      <span className="font-bold text-primary">{service.pricing}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Expertise */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Industry Expertise</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {industryFocus.map((industry) => (
              <Card key={industry.name}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <industry.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{industry.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {industry.stats}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {industry.solutions.map((solution) => (
                      <li key={solution} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm">{solution}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Engagement Models</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project-Based</CardTitle>
                <CardDescription>Fixed scope, defined timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">$25K-100K</p>
                  <p className="text-sm text-muted-foreground">
                    Ideal for specific initiatives with clear deliverables
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hourly Consulting</CardTitle>
                <CardDescription>Flexible, as-needed expertise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">$150-275/hr</p>
                  <p className="text-sm text-muted-foreground">
                    Perfect for ongoing advisory and technical guidance
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retainer</CardTitle>
                <CardDescription>Dedicated monthly support</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">$15K-50K/mo</p>
                  <p className="text-sm text-muted-foreground">
                    Best for continuous improvement and strategic partnership
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Let's discuss your data challenges and explore how we can drive 
              transformation through intelligent edge computing and AI solutions.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">Schedule Free Consultation</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/case-studies">View Success Stories</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}