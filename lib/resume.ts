/**
 * The resume, as data.
 *
 * Restored 2026-10-02. The site had a /resume page until the February 2026
 * rewrite removed it (commit ea75ab9); the data lived in lib/resume-data.json
 * and is recoverable from git history at 65eedb5.
 *
 * Two sources, and which one wins:
 *
 *   1. docs/bsi-resume-20260223.pdf: the operator's own most recent resume.
 *      It is the authority for the headline, the summary, the expertise
 *      lists, and the four roles from 2014 onward.
 *   2. lib/resume-data.json at 65eedb5: the only source for the nine roles
 *      before 2014, which the PDF leaves out for length.
 *
 * Where they disagree the PDF wins, being newer and signed off by the person
 * it describes. One such case: ConservativeConnector starts in 2018 here (the
 * PDF) and not 2020 (the old data file).
 *
 * Nothing on this page is generated or inferred. Every line traces to one of
 * those two documents, edited only for voice (third person, no "I") and for
 * the site's punctuation rules. Do not add a claim here that is not in a
 * document the operator wrote or approved.
 */

export interface ResumeRole {
  years: string
  title: string
  company: string
  location?: string
  /** One line on what the company or product was. */
  context?: string
  bullets: string[]
  tech?: string[]
}

export const RESUME_UPDATED = "2026-02-23"

export const RESUME_PDF = "/resume.pdf"

export const HEADLINE = "AI systems architect, machine learning engineer, frontier technologist."

export const SUMMARY: string[] = [
  "AI-focused software architect with more than fifteen years designing secure, large-scale data systems for government and enterprise clients. Extensive hands-on experience with frontier AI models, agentic programming frameworks, and AI-augmented development workflows.",
  "Proven track record leading technical teams on classified projects and building high-availability infrastructure processing billions of records. Expert in AI and ML pipelines, distributed systems, cloud infrastructure, and secure data management. Daily co-development with Claude and other frontier models across architecture, code generation, data analysis, and investigative tooling. Active builder of open-source AI tools and agentic systems.",
]

/** 2014 to the present: the roles the current PDF carries, in its words. */
export const ROLES: ResumeRole[] = [
  {
    years: "2024 to present",
    title: "Founder and AI Systems Architect",
    company: "SysForge.ai",
    context: "AI consulting and development firm delivering frontier AI solutions for enterprise clients.",
    bullets: [
      "Architecting AI-powered systems that integrate frontier language models into enterprise workflows for automation, analysis, and decision support.",
      "Developing custom agentic AI pipelines using Claude, GPT-4, and open-source models for client-specific investigative and operational use cases.",
      "Building AI-augmented development toolchains and internal platforms that accelerate secure software delivery.",
      "Consulting on responsible AI deployment, prompt engineering strategy, and AI governance for regulated industries.",
    ],
    tech: ["Python", "Claude API", "FastAPI", "AWS", "Docker", "Pinecone", "RAG", "Agentic frameworks"],
  },
  {
    years: "2022 to present",
    title: "Architect and Developer",
    company: "VictoryText, LLC",
    location: "Grand Rapids, MI",
    context: "Enterprise-grade, high-volume messaging platform with strict uptime and compliance requirements.",
    bullets: [
      "Architected a high-availability messaging platform handling millions of messages at 99.9% uptime, using AI for anomaly detection and delivery optimization.",
      "Developed the RESTful API layer in FastAPI, integrating multiple carriers (Twilio, Bandwidth, Kaleyra, Telnyx) with automated failover.",
      "Engineered DynamoDB operations for atomic queue management, ensuring message delivery guarantees.",
      "Built a real-time analytics backend with AI-driven pattern recognition, aggregating carrier statistics through AWS QuickSight.",
    ],
    tech: ["Python", "FastAPI", "DynamoDB", "Lambda", "CloudWatch", "QuickSight"],
  },
  {
    years: "2018 to 2022",
    title: "Architect and Developer",
    company: "ConservativeConnector, LLC",
    location: "Grand Rapids, MI",
    context: "Large-scale email data management systems processing billions of messages and more than 100 million contact records.",
    bullets: [
      "Designed high-volume data infrastructure on AWS, with ML-driven data quality scoring and deduplication.",
      "Integrated and normalized 4.9 billion data points for ML model training, relationship discovery, and predictive analytics.",
      "Built multi-channel ingestion pipelines with ETL processes shipping to Snowflake, incorporating automated anomaly detection.",
      "Ensured GDPR and CAN-SPAM compliance across all data processing through automated policy enforcement.",
    ],
    tech: ["Python", "AWS", "Snowflake", "PostgreSQL", "ML pipelines", "ETL"],
  },
  {
    years: "2014 to 2018",
    title: "Senior Architect",
    company: "TransUnion, TruLookup Division",
    location: "Boca Raton, FL",
    context:
      "Investigative intelligence platform providing insight on people, assets, and relationships from more than 10,000 data sources. Served law enforcement, government agencies, and legal clients.",
    bullets: [
      "Lead developer on a classified project with the United States Government, covering secure system architecture and federal compliance.",
      "Architected distributed infrastructure processing billions of records and millions of queries a day at better than 99.9% uptime.",
      "Built machine learning models for entity resolution, relationship mapping, and data segmentation with the data science team.",
      "Implemented ML-driven search algorithms connecting disparate data sources to reveal hidden relationships between individuals, businesses, assets, and locations.",
      "Led a team of five developers in search algorithm optimization, performance tuning, and ML model integration.",
    ],
    tech: ["C#", ".NET", "Apache Solr", "Elasticsearch", "SQL Server", "Distributed caching"],
  },
]

/** 1997 to 2014: from the earlier resume data, which the current PDF omits. */
export const EARLIER_ROLES: ResumeRole[] = [
  {
    years: "2012 to 2014",
    title: "Senior Architect",
    company: "nextSource / PeopleTicker",
    location: "Manhattan, NY",
    context: "Talent acquisition automation. PeopleTicker was a start-up spun out of nextSource.",
    bullets: [
      "Senior data engineer on a global, real-time labor-rate calculator: designed the data structures and systems for search-engine data acquisition, processing, and retrieval.",
      "Designed and developed the rate search engine and its algorithms, implemented in Java with Weka and other statistical packages.",
    ],
    tech: ["Java", "Weka", "Apache Solr", "AWS EC2", "RDS"],
  },
  {
    years: "2011 to 2012",
    title: "Application Developer",
    company: "nextSource",
    location: "Manhattan, NY",
    bullets: [
      "Developer on a talent acquisition management system for a provider of temporary labor to large corporations, including Capital One, Caterpillar, and BASF. Human resources teams used it to track sourcing, hiring, and invoicing.",
    ],
    tech: ["PHP", "Oracle", "JavaScript"],
  },
  {
    years: "2009 to 2011",
    title: "Senior Developer",
    company: "Linx Communications, Inc.",
    location: "Hauppauge, NY",
    context: "Digital marketing.",
    bullets: [
      "Designed and coded e-commerce sites, including a packing algorithm that fits any number of packages into boxes of several sizes.",
      "Integrated Magento with an ERP system through a custom bridge to the Magento API, and maintained all code and production servers.",
    ],
    tech: ["Magento", "Twitter API", "Google Analytics"],
  },
  {
    years: "2008",
    title: "Software Development and System Design",
    company: "J. Lack Consulting",
    location: "East Hampton, NY",
    bullets: [
      "Maintained production e-commerce servers, ran daily mail campaigns, and analyzed response. Managed an e-commerce integration project for a wine retailer end to end.",
      "Designed a secure network for a 120-bed healthcare facility, built to meet HIPAA requirements and protect patient data.",
    ],
  },
  {
    years: "2008",
    title: "Senior Developer",
    company: "EnablePay, Inc.",
    location: "Mineola, NY",
    context: "Credit card processing start-up.",
    bullets: [
      "Created a merchant transaction management system, supervising junior developers and ensuring daily card transactions cleared the banking system.",
      "Developed a web-based merchant application in PHP, integrated with SugarCRM over SOAP.",
    ],
  },
  {
    years: "2007 to 2008",
    title: "Senior Developer",
    company: "AmeriCorp, Inc.",
    location: "Syosset, NY",
    context: "Debt consolidation.",
    bullets: [
      "Developed the financial backend of an enterprise compensation management system: it receives and disburses client funds to escrow accounts and generates outbound messages from account status.",
      "Planned a 500-seat call center installation on Microsoft CRM and designed an automated EFT scheduling system for daily ACH processing.",
      "Designed and implemented a SOAP API for business partners to reach the back-end processing system.",
    ],
  },
  {
    years: "2005 to 2007",
    title: "Senior Developer",
    company: "Evo Merchant Services, Inc.",
    location: "Melville, NY",
    context: "Credit card processor.",
    bullets: [
      "Developed a multi-user credit card risk management system used by employees and external partners, which reduced company losses by detecting fraudulent card activity.",
      "Created file processors to load card transaction data from Visa, MasterCard, American Express, and Discover.",
      "Developed an in-house system for managing more than 100,000 merchants, from sales through onboarding.",
    ],
  },
  {
    years: "2004 to 2005",
    title: "Senior Developer",
    company: "Direct Insite, Inc.",
    location: "Hauppauge, NY",
    context: "Invoicing services for IBM.",
    bullets: [
      "Designed a management console for a just-in-time processing system that rendered XML datasets with XSLT.",
      "Developed a C# framework giving programmers a common interface for dynamic data processing modules, and an application processing real-time financial feeds from IBM Japan.",
    ],
    tech: ["C#", ".NET", "SQL Server"],
  },
  {
    years: "2002 to 2004",
    title: "Senior Developer",
    company: "CCSI",
    location: "Hauppauge, NY",
    context: "Technology contractor.",
    bullets: [
      "Developed a case management system for the Suffolk County District Attorney, ingesting more than 100,000 court indictments and dispositions.",
      "Built a HIPAA-compliant medical permissions program for Nassau University Medical Center, converting existing data into a browser-based application.",
      "Designed modules for a browser-based knowledge system for school districts.",
    ],
    tech: ["C#", ".NET", "Oracle"],
  },
  {
    years: "1997 to 2002",
    title: "Chief Technology Officer and co-founder",
    company: "PipeLive, LLC",
    location: "Melville, NY",
    context: "Real-time chat and collaboration software, sold as a service.",
    bullets: [
      "Co-founded the company and designed and developed a modular suite of real-time collaboration software.",
      "Received 12 industry awards, including PC Magazine's Winner's Circle and the TMC Labs Innovation Award.",
      "Negotiated a four-year, $2M reseller agreement with Siemens AG distributing Web Interaction Center worldwide, and managed integration with Siemens Switzerland's call center product line.",
      "Worked on an early AI-based chat system with Banter, Inc. for LaSalle Bank.",
    ],
  },
]

export const GOVERNMENT: string[] = [
  "Lead developer on a classified project with the United States Government (TransUnion TruLookup, 2014 to 2018).",
  "Extensive experience in secure environments handling sensitive investigative and personal data for law enforcement and federal agencies.",
  "Working knowledge of data protection protocols, federal compliance frameworks, FISMA, and security practice.",
]

export const EXPERTISE: { area: string; items: string[] }[] = [
  {
    area: "AI and machine learning",
    items: [
      "Claude and the Anthropic API",
      "OpenAI API",
      "Agentic frameworks",
      "Prompt engineering",
      "RAG pipelines",
      "Vector databases",
      "Hugging Face",
      "Entity resolution",
      "Relationship mapping",
      "Recommendation engines",
      "Statistical modeling",
      "scikit-learn",
      "Weka",
    ],
  },
  {
    area: "Languages",
    items: ["Python", "Bash", "SQL", "C# and .NET", "Rust", "C and C++", "Java", "JavaScript and TypeScript"],
  },
  {
    area: "Cloud and infrastructure",
    items: [
      "AWS",
      "Linux administration",
      "Docker",
      "Distributed systems",
      "High-availability design",
      "Load balancing",
    ],
  },
  {
    area: "Data and search",
    items: [
      "Snowflake",
      "PostgreSQL",
      "MySQL",
      "SQL Server",
      "DynamoDB",
      "Redis",
      "Elasticsearch",
      "Apache Solr",
      "ETL pipelines",
      "Hadoop and Hive",
      "Vector embeddings",
    ],
  },
  {
    area: "Development",
    items: ["FastAPI", "REST APIs", "Microservices", "Git", "CI/CD", "Message queues", "Real-time processing"],
  },
]

export const EDUCATION: { what: string; where: string }[] = [
  { what: "Advanced Object-Oriented Programming", where: "Columbia University" },
  { what: "Computer Science coursework", where: "Plymouth State College" },
  { what: "Physics Engineering", where: "University of Buffalo" },
]

/** Open-source work the PDF names, with a link where one exists. */
export const PROJECTS: { name: string; what: string; href?: string; internal?: boolean }[] = [
  {
    name: "bradley.io AI pilot",
    what: "A public record of AI-augmented development: every working session, the models used, and what it cost.",
    href: "/ai-pilot",
    internal: true,
  },
  {
    name: "Sovereign",
    what: "An assembly-like agentic programming language designed for self-improving AI systems.",
    href: "https://github.com/tinymachines/sovereign",
  },
  {
    name: "Gene Pool",
    what: "A curated archive and analysis of AI coding agent system prompts across frontier models.",
  },
  { name: "ARI", what: "An AWS resource inventory tool." },
  { name: "ESP32 AI Edge", what: "Edge computing and embedded inference on ESP32 mesh networks." },
  { name: "Rust for Haters", what: "Systems programming deep-dives." },
]
