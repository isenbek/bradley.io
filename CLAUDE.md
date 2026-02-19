# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bradley.io — personal/consultancy site for AI Data Engineering, edge computing, and IoT integration. Consolidated from `new-bradley-io` into this single repo.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router, Turbopack
- **Styling**: Tailwind CSS 4 with `@theme` directive and CSS custom properties
- **Language**: TypeScript (strict)
- **Animations**: Framer Motion, custom ambient canvas (floating leaves, text shimmer)
- **Data Viz**: D3.js, Recharts
- **MDX**: `@next/mdx` for rich content pages
- **Wargames**: Socket.io server with Ollama-powered WOPR AI

### Theme System
Three themes via `data-theme` attribute and `--brand-*` CSS custom properties:
- **Deep Sea** (default): `--brand-primary: #00F5FF`
- **Analog-Future**: `--brand-primary: #FF6B35`
- **Horizon** (light): `--brand-primary: #2563EB`

Tailwind maps `--brand-*` vars to `sf-*` utility classes (e.g., `text-sf-orange`, `bg-sf-dark`).

### Project Structure
```
bradley-io/
├── app/                    # Next.js App Router pages
│   ├── about/              # About page
│   ├── ai-pilot/           # AI Pilot License dashboard
│   ├── api/socket/         # Socket.io route for wargames
│   ├── lab/                # Lab experiments
│   ├── mcp/                # MCP Catalog page
│   ├── projects/           # Projects listing + [slug]
│   ├── services/           # Consulting services page
│   ├── style-guide/        # Design system reference
│   ├── terminal/           # Interactive CLI portfolio
│   ├── wargames/           # WOPR Wargames client
│   └── wargames-test/      # Wargames test page
├── components/
│   ├── ai-pilot/           # AI Pilot dashboard components
│   ├── ambient/            # Ambient animations (shimmer, leaves)
│   ├── home/               # Homepage components
│   ├── layout/             # Navigation, RootLayoutWrapper, VersionFooter
│   ├── mdx/                # MDX rendering components
│   └── ui/                 # Shared UI primitives
├── lib/                    # Utilities, data helpers
├── scripts/                # Build info generation
├── public/                 # Static assets
├── wargames-server.js      # Standalone Socket.io + Ollama server
├── ecosystem.config.js     # PM2 config (wargames only)
├── bradley-io.service      # systemd unit (Next.js production)
└── deploy.sh               # Full deploy script
```

## Development Commands

```bash
npm install            # Install dependencies
npm run dev            # Start Next.js + wargames server (concurrently)
npm run dev:next       # Next.js dev only (port 32221)
npm run dev:wargames   # Wargames server only
npm run build          # Production build
npm run lint           # ESLint
```

## Deployment

**Anti-Cloud. Host Local, Think Global.**

```bash
./deploy.sh            # Full deploy: commit, bump, push, build, systemd restart, health check
```

- **Next.js**: systemd service `bradley-io` on port 32221
- **Wargames**: PM2 process `bradley-io-wargames`
- **Nginx**: Both `bradley.io` and `new.bradley.io` proxy to 127.0.0.1:32221

## Key Conventions

1. Use `sf-*` Tailwind classes for themed colors (never hardcode hex in components)
2. Use `--brand-*` CSS vars for inline styles that must be theme-aware
3. Use `container-page` class for consistent page width
4. All pages get Navigation + VersionFooter via RootLayoutWrapper
5. Ambient animations (leaves, shimmer) render via AmbientLayer in the layout
6. Font families: `font-display` (Outfit) and `font-mono` (JetBrains Mono)

## Contact & Resources

- **GitHub**: https://github.com/tinymachines
- **Repo**: https://github.com/isenbek/bradley.io
