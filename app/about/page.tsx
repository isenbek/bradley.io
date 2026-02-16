import Link from "next/link"

export default function AboutPage() {
  const skills = {
    "Languages": ["Python", "TypeScript", "C/C++", "Bash", "Go", "Rust"],
    "Data": ["Snowflake", "PostgreSQL", "DynamoDB", "Redis", "SQLite", "Elasticsearch"],
    "AI/ML": ["Ollama", "Claude", "PyTorch", "Hugging Face", "LangChain", "Vector DBs"],
    "Infrastructure": ["AWS", "Docker", "Kubernetes", "FastAPI", "Nginx", "Linux"],
    "Hardware": ["Raspberry Pi", "Arduino", "LoRa", "Edge TPU", "Custom Protocols"],
    "Tools": ["Git", "Vim", "Playwright", "Jupyter", "Prometheus", "Grafana"],
  }

  const timeline = [
    {
      period: "2022 - Present",
      role: "Architect & Developer",
      company: "VictoryText, LLC",
      description: "High-volume messaging platform with FastAPI, DynamoDB, and multi-carrier integration.",
    },
    {
      period: "2020 - 2022",
      role: "Architect & Developer",
      company: "ConservativeConnector",
      description: "Data systems processing 100M+ contacts and 4.9B data points with Snowflake.",
    },
    {
      period: "2014 - 2018",
      role: "Senior Architect",
      company: "TransUnion SRG",
      description: "Search infrastructure for Whitepages.com, classified government projects, ML modeling.",
    },
    {
      period: "2012 - 2014",
      role: "Senior Architect",
      company: "NextSource / PeopleTicker",
      description: "Global real-time labor-rate calculator with Java, Weka, and Apache Solr.",
    },
    {
      period: "1997 - 2002",
      role: "Co-Founder & CTO",
      company: "PipeLive, LLC",
      description: "Real-time collaboration software. 12 industry awards including PC Magazine Winner's Circle.",
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            About
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            I'm your typical non-typical developer. While I've spent 15+ years architecting
            production systems that process billions of data points, what really drives me
            is the work I do in my garage lab—where I turn constraints into innovation
            and curiosity into working systems.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* Philosophy */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Philosophy</h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed mb-4">
              Case in point: I recently scored 60 Raspberry Pis from a failed business.
              Most people would resell them. I built a distributed investigation tool with
              40 Pi4 workers running a VPN cluster with Tor DNS lookup and headless browser
              automation. It's messy, it's scrappy, and it works.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              I'm an integrator at heart. I dumpster dive for gear because working within
              constraints forces creative solutions. I run my own DNS server on a Frankenstein
              Linux box I built from salvaged parts. I host everything locally because I want
              to understand how it all fits together.
            </p>
            <p className="text-slate-600 leading-relaxed">
              I bring this same mindset to production work: find elegant solutions, question
              assumptions, build tools that last. Whether it's processing 4.9 billion data points,
              architecting high-availability messaging platforms, or leading classified government
              projects, I approach every problem as an opportunity to build something that actually works.
            </p>
          </div>
        </section>

        {/* Skills */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Technical Skills</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(skills).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 text-sm bg-slate-100 text-slate-700 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Experience</h2>
          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <div
                key={idx}
                className="relative pl-6 border-l-2 border-slate-200 hover:border-teal-400 transition-colors"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-slate-300 rounded-full" />
                <div className="text-sm text-teal-600 font-mono mb-1">{item.period}</div>
                <div className="font-semibold text-slate-900">{item.role}</div>
                <div className="text-sm text-slate-500 mb-2">{item.company}</div>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Full experience history available on the{" "}
            <Link href="/resume" className="text-teal-600 hover:text-teal-800">
              resume page
            </Link>
            .
          </p>
        </section>

        {/* Current Projects */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Current Focus</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
              <h3 className="font-medium text-slate-900 mb-1">60-Node Pi Cluster</h3>
              <p className="text-sm text-slate-600">
                Distributed investigation tool with VPN/Tor architecture and headless automation.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors">
              <h3 className="font-medium text-slate-900 mb-1">Thorium TRNG</h3>
              <p className="text-sm text-slate-600">
                True random number generator passing NIST/Diehard tests from radioactive decay.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 hover:border-teal-300 transition-colors">
              <h3 className="font-medium text-slate-900 mb-1">Custom 802.11 Protocol</h3>
              <p className="text-sm text-slate-600">
                Decentralized mesh networking for routing around traditional infrastructure.
              </p>
            </div>
            <div className="p-4 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors">
              <h3 className="font-medium text-slate-900 mb-1">Claude Integration</h3>
              <p className="text-sm text-slate-600">
                Using AI as a collaborative development partner, not just code completion.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="border-t border-slate-200 pt-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Get in Touch</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href="mailto:brad@isenbek.io"
              className="text-teal-600 hover:text-teal-800"
            >
              brad@isenbek.io
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://github.com/tinymachines"
              className="text-teal-600 hover:text-teal-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/tinymachines
            </a>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Grand Rapids, MI</span>
          </div>
        </section>
      </div>
    </main>
  )
}
