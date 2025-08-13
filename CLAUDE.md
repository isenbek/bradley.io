# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bradley.io is a professional website for an AI Data Engineering consultancy specializing in edge computing, enterprise data architecture, and IoT integration. The consultancy targets the Grand Rapids, Michigan market with focus on healthcare, manufacturing, and retail sectors.

## Key Business Context

### Value Proposition
"We transform enterprise data strategies through intelligent edge computing, combining Fortune 500 data architecture expertise with cutting-edge IoT device integration to deliver real-time insights where and when your business needs them most."

### Target Market
- **Primary**: Grand Rapids enterprises (Steelcase, Wolverine Worldwide, Meijer, Corewell Health)
- **Consulting Rates**: $150-275/hour for specialized AI and edge computing work
- **Differentiators**: Unique combination of enterprise data architecture with hands-on Raspberry Pi/Arduino integration

## Development Commands

### Project Setup
```bash
# Initialize Next.js project with TypeScript
npx create-next-app@latest bradley-io --typescript --tailwind --app

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Deployment
```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Architecture & Technical Decisions

### Technology Stack
- **Framework**: Next.js 14+ with App Router for optimal performance and SEO
- **Styling**: Tailwind CSS for utility-first responsive design
- **Language**: TypeScript for type safety and better developer experience
- **Animations**: Framer Motion for professional interactions
- **Data Viz**: D3.js for complex visualizations, Recharts for simpler charts
- **Deployment**: Vercel for automatic deployments and edge functions

### Design System
- **Colors**: Deep teal (#0F4C75), mint green (#7ACFD6), coral accent (#E0474C)
- **Typography**: Inter for body text, Fira Code for technical/code content
- **Dark Mode**: System preference detection with manual toggle
- **Accessibility**: WCAG 2.1 AA compliance required

### Project Structure
```
bradley-io/
├── app/                    # Next.js app directory
│   ├── (marketing)/       # Marketing pages layout
│   ├── blog/              # Blog posts and articles
│   ├── case-studies/      # Detailed case studies
│   ├── services/          # Service offering pages
│   └── terminal/          # Interactive terminal portfolio
├── components/            # Reusable React components
│   ├── ui/               # Basic UI components
│   ├── sections/         # Page sections
│   └── visualizations/  # D3.js and data viz components
├── lib/                   # Utility functions and helpers
├── public/               # Static assets
└── docs/                 # Documentation and planning
```

## Key Implementation Priorities

### SEO & Performance
- Target 95+ Lighthouse scores
- Implement local SEO for Grand Rapids market
- Use Next.js Image component for optimization
- Configure proper meta tags and Open Graph data
- Generate dynamic sitemap.xml

### Lead Generation
- Calendly integration for consultation scheduling
- Multi-step contact forms with project type selection
- Newsletter signup with email automation
- Downloadable resources for lead capture

### Content Strategy
- Focus on edge computing and IoT expertise
- Case studies with quantified business impact
- Technical blog posts demonstrating thought leadership
- Progressive disclosure for dual audience (technical + executive)

## Testing Strategy

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run accessibility audit
npm run test:a11y
```

## Important Business Rules

1. **Dual Audience**: Every page must appeal to both technical evaluators and business executives
2. **Quantified Impact**: All case studies and achievements must include specific metrics and ROI
3. **Local Focus**: Include Grand Rapids-specific content and keywords for local SEO
4. **Terminal Feature**: Maintain interactive CLI interface for technical credibility
5. **Mobile First**: All designs must be fully responsive and performant on mobile devices

## External Integrations

- **Analytics**: Google Analytics 4 + Microsoft Clarity
- **Scheduling**: Calendly API
- **Email**: SendGrid or Resend for transactional emails
- **Chat**: Intercom for live chat support
- **Monitoring**: Sentry for error tracking

## Development Workflow

1. Always check existing components before creating new ones
2. Follow the established color palette and typography system
3. Ensure all new pages include proper SEO metadata
4. Test on mobile devices before considering feature complete
5. Maintain WCAG 2.1 AA accessibility standards
6. Use TypeScript strictly - no `any` types without justification

## Performance Budget

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
- Total bundle size: < 200KB (gzipped)

## Contact & Resources

- **GitHub Portfolio**: https://github.com/tinymachines
- **Target Events**: Tech Week Grand Rapids (Sept 15-20, 2025)
- **Key Networks**: Technology Council of West Michigan, Start Garden