import Link from "next/link"

export default function ServicesPage() {
  const services = [
    {
      title: "Distributed Systems Architecture",
      description: "Design and implementation of systems that process billions of records with high availability and fault tolerance.",
      skills: ["Distributed Databases", "Message Queues", "Load Balancing", "Fault Tolerance"],
      examples: ["Search infrastructure at TransUnion scale", "High-volume messaging platforms", "Multi-region data replication"],
    },
    {
      title: "Data Engineering",
      description: "Building pipelines that ingest, transform, and serve data at scale with real-time and batch processing.",
      skills: ["ETL Pipelines", "Data Warehousing", "Stream Processing", "Analytics"],
      examples: ["4.9B data point integration", "Snowflake data architectures", "Real-time reporting backends"],
    },
    {
      title: "API Design & Development",
      description: "RESTful and WebSocket APIs with comprehensive authentication, rate limiting, and monitoring.",
      skills: ["FastAPI", "REST", "WebSocket", "GraphQL"],
      examples: ["85-endpoint API orchestration", "Multi-carrier messaging integrations", "Real-time event streaming"],
    },
    {
      title: "Edge Computing & IoT",
      description: "Deploying AI and data processing on resource-constrained devices with custom protocols.",
      skills: ["Raspberry Pi", "Custom Protocols", "Mesh Networks", "Low-Power Systems"],
      examples: ["60-node Pi cluster", "Custom 802.11 protocols", "LoRa mesh deployments"],
    },
    {
      title: "AI/ML Integration",
      description: "Production-grade machine learning pipelines with real-time inference and model management.",
      skills: ["LLM Integration", "Model Deployment", "Vector Search", "ML Pipelines"],
      examples: ["Multi-provider AI orchestration", "Sub-100ms inference pipelines", "Self-improving systems"],
    },
  ]

  const engagementModels = [
    {
      type: "Project-Based",
      description: "Fixed scope with defined deliverables",
      range: "$25K - $100K",
      ideal: "Specific initiatives with clear requirements",
    },
    {
      type: "Hourly Consulting",
      description: "Flexible, as-needed expertise",
      range: "$150 - $275/hr",
      ideal: "Technical guidance and architecture review",
    },
    {
      type: "Retainer",
      description: "Dedicated monthly support",
      range: "$15K - $50K/mo",
      ideal: "Ongoing partnership and continuous improvement",
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Services
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            15+ years of experience architecting production systems at scale.
            From Fortune 500 data infrastructure to garage lab innovations—I bring
            the same rigor and creativity to every project.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Services */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-8">What I Do</h2>
          <div className="space-y-8">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-slate-600 mb-4">{service.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {service.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-xs font-mono bg-teal-50 text-teal-700 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-slate-500">
                  <span className="font-medium">Examples: </span>
                  {service.examples.join(" • ")}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engagement Models */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Engagement Models</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {engagementModels.map((model) => (
              <div
                key={model.type}
                className="p-5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <h3 className="font-semibold text-slate-900 mb-1">{model.type}</h3>
                <p className="text-sm text-slate-500 mb-3">{model.description}</p>
                <div className="text-lg font-mono font-bold text-teal-600 mb-2">
                  {model.range}
                </div>
                <p className="text-xs text-slate-500">{model.ideal}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">How I Work</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Discovery", desc: "Understand the problem deeply before proposing solutions" },
              { step: "2", title: "Design", desc: "Architecture that balances elegance with practicality" },
              { step: "3", title: "Build", desc: "Iterative development with continuous feedback" },
              { step: "4", title: "Deliver", desc: "Documentation, handoff, and knowledge transfer" },
            ].map((phase) => (
              <div key={phase.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mx-auto mb-3">
                  {phase.step}
                </div>
                <h3 className="font-medium text-slate-900 mb-1">{phase.title}</h3>
                <p className="text-sm text-slate-500">{phase.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Differentiators */}
        <section className="bg-slate-50 -mx-4 px-4 py-8 md:rounded-lg md:mx-0 md:px-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Why Work With Me</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-1 bg-teal-400 rounded-full flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Production Experience</h3>
                <p className="text-sm text-slate-600">
                  Built systems processing billions of records at TransUnion, not just prototypes.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 bg-amber-400 rounded-full flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Maker Mentality</h3>
                <p className="text-sm text-slate-600">
                  Creative problem-solving from building 60-node Pi clusters on salvaged hardware.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 bg-teal-400 rounded-full flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Full Stack</h3>
                <p className="text-sm text-slate-600">
                  From low-level protocols to cloud architecture to ML pipelines.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 bg-amber-400 rounded-full flex-shrink-0" />
              <div>
                <h3 className="font-medium text-slate-900">Security Cleared</h3>
                <p className="text-sm text-slate-600">
                  Led classified government projects requiring highest security standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-slate-200 pt-8 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Let's Talk</h2>
          <p className="text-slate-600 mb-6">
            Have a project in mind? Let's discuss how I can help.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:brad@isenbek.io"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Get in Touch
            </a>
            <Link
              href="/projects"
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:border-slate-400 transition-colors"
            >
              View Projects
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
