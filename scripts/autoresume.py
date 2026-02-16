#!/usr/bin/env python3
"""
autoresume.py - Automated project documentation to resume pipeline

Scans ~/projects for documentation, uses AI to summarize each project,
and generates themed resume content for professional and adventure contexts.

Usage:
    python autoresume.py                    # Full scan and generate
    python autoresume.py --dry-run          # Preview without API calls
    python autoresume.py --project plumbr   # Single project
    python autoresume.py --categorize       # Just categorization from existing summaries
    python autoresume.py --generate         # Generate markdown from existing summaries
"""

import os
import sys
import json
import time
import argparse
import subprocess
import requests
from pathlib import Path
from datetime import datetime
from typing import Optional

# Configuration
AI_API_BASE = "https://ai.nominate.ai"
PROJECTS_DIR = Path.home() / "projects"

# GitHub owners to include (lowercase for comparison)
ALLOWED_OWNERS = ["isenbek", "nominate-ai", "tinymachines"]
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR.parent / "docs" / "autoresume"
RESUME_DATA_PATH = SCRIPT_DIR.parent / "lib" / "resume-data.json"

# Rate limiting
API_DELAY_SECONDS = 1.5

# Priority files for documentation (earliest/most informative first)
PRIORITY_FILES = [
    "README.md",
    "readme.md",
    "OVERVIEW.md",
    "overview.md",
    "PHASE-I.md",
    "phase-1.md",
    "kickoff.md",
    "KICKOFF.md",
    "project.md",
    "PROJECT.md",
    "index.md",
    "00-",  # Numbered files
    "01-",
]

# Project categorization hints
PROFESSIONAL_KEYWORDS = [
    "production", "enterprise", "api", "fastapi", "database", "aws", "cloud",
    "backend", "frontend", "deployment", "ci/cd", "testing", "scale",
    "architecture", "infrastructure", "security", "compliance"
]

ADVENTURE_KEYWORDS = [
    "raspberry", "pi", "arduino", "iot", "sensor", "hardware", "mesh",
    "radio", "wireless", "experimental", "prototype", "maker", "diy",
    "tor", "vpn", "cluster", "homebrew", "garage", "trng", "random"
]


class AutoResume:
    """Automated project-to-resume pipeline."""

    def __init__(self, dry_run: bool = False, verbose: bool = True):
        self.dry_run = dry_run
        self.verbose = verbose
        self.api_key = os.environ.get("CLAUDE_API_KEY")
        self.summaries: list[dict] = []
        self.resume_data: dict = {}

        # Ensure output directory exists
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        # Load existing resume data
        if RESUME_DATA_PATH.exists():
            with open(RESUME_DATA_PATH) as f:
                self.resume_data = json.load(f)

    def log(self, message: str):
        """Print message if verbose mode enabled."""
        if self.verbose:
            print(message)

    def get_git_remote_owner(self, project_path: Path) -> Optional[str]:
        """Extract the owner from git remote origin URL."""
        try:
            result = subprocess.run(
                ["git", "-C", str(project_path), "remote", "get-url", "origin"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                return None

            url = result.stdout.strip()
            # Parse owner from various URL formats:
            # https://github.com/owner/repo.git
            # git@github.com:owner/repo.git
            if "github.com" in url:
                if url.startswith("git@"):
                    # git@github.com:owner/repo.git
                    parts = url.split(":")[-1].split("/")
                elif "github.com/" in url:
                    # https://github.com/owner/repo.git
                    parts = url.split("github.com/")[-1].split("/")
                else:
                    return None

                if parts:
                    return parts[0].lower()
            return None
        except Exception:
            return None

    def scan_projects(self) -> list[Path]:
        """Find all projects with docs/ directories from allowed GitHub owners."""
        projects = []
        skipped = []
        for item in sorted(PROJECTS_DIR.iterdir()):
            if item.is_dir() and (item / "docs").is_dir():
                owner = self.get_git_remote_owner(item)
                if owner and owner in ALLOWED_OWNERS:
                    projects.append(item)
                else:
                    skipped.append((item.name, owner or "no remote"))

        if skipped and self.verbose:
            self.log(f"\nSkipped {len(skipped)} repos (not from {', '.join(ALLOWED_OWNERS)}):")
            for name, owner in skipped[:10]:
                self.log(f"  - {name} ({owner})")
            if len(skipped) > 10:
                self.log(f"  ... and {len(skipped) - 10} more")

        return projects

    def get_priority_docs(self, docs_dir: Path, max_bytes: int = 10000) -> str:
        """Get content from priority documentation files."""
        content_parts = []
        total_bytes = 0

        # Get all markdown files
        md_files = list(docs_dir.glob("**/*.md"))

        # Sort by priority
        def priority_key(path: Path) -> tuple:
            name = path.name.lower()
            for i, pattern in enumerate(PRIORITY_FILES):
                if pattern.lower() in name:
                    return (i, name)
            return (100, name)

        md_files.sort(key=priority_key)

        # Read files up to max_bytes
        for md_file in md_files:
            if total_bytes >= max_bytes:
                break
            try:
                with open(md_file, encoding="utf-8", errors="ignore") as f:
                    file_content = f.read()
                    remaining = max_bytes - total_bytes
                    if len(file_content) > remaining:
                        file_content = file_content[:remaining]
                    content_parts.append(f"=== {md_file.name} ===\n{file_content}")
                    total_bytes += len(file_content)
            except Exception as e:
                self.log(f"  Warning: Could not read {md_file}: {e}")

        return "\n\n".join(content_parts)

    def call_ai_api(self, content: str, system_prompt: str) -> Optional[str]:
        """Call the AI API for analysis."""
        if self.dry_run:
            return "[DRY RUN - API call skipped]"

        try:
            # ai.nominate.ai doesn't require auth - it's a local service
            headers = {"Content-Type": "application/json"}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            response = requests.post(
                f"{AI_API_BASE}/api/v1/chat",
                params={"provider": "claude"},
                headers=headers,
                json={
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": content}
                    ],
                    "max_tokens": 1000,
                    "temperature": 0
                },
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            return data.get("content", "")
        except requests.exceptions.RequestException as e:
            self.log(f"  API error: {e}")
            return None

    def summarize_project(self, project_path: Path) -> Optional[dict]:
        """Generate AI summary for a project."""
        docs_dir = project_path / "docs"
        project_name = project_path.name

        self.log(f"\nProcessing: {project_name}")

        # Get documentation content
        doc_content = self.get_priority_docs(docs_dir)
        if not doc_content.strip():
            self.log(f"  No readable documentation found")
            return None

        self.log(f"  Found {len(doc_content)} bytes of documentation")

        # AI summarization prompt - structured to prevent the model from "helping" with the project
        system_prompt = """You are a resume data extraction service. You ONLY output JSON.
You analyze project documentation and extract metadata for resume generation.
You NEVER write code, explanations, or help with the project itself.
Your response must be a single JSON object with no other text."""

        user_prompt = f"""TASK: Extract resume metadata from this project documentation.

OUTPUT FORMAT (respond with ONLY this JSON, no other text):
{{"name":"project name","tagline":"one sentence","purpose":"2-3 sentences","technologies":["tech1","tech2"],"role":"developer|architect|inventor|lead","innovations":["innovation1"],"enterprise_relevance":"relevance or null","maker_relevance":"relevance or null","category":"professional|adventure|hybrid","claude_involvement":"how AI was used or null","complexity_score":5,"resume_highlight":"key achievement"}}

DOCUMENTATION TO ANALYZE:
---
{doc_content[:8000]}
---

Respond with ONLY the JSON object. No markdown. No explanation. No code."""

        # Call AI with very low temperature
        ai_response = self.call_ai_api(user_prompt, system_prompt)
        if not ai_response:
            return None

        # Parse JSON response
        try:
            # Try to extract JSON from response
            json_start = ai_response.find("{")
            json_end = ai_response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                summary = json.loads(ai_response[json_start:json_end])
                summary["project_dir"] = project_name
                summary["scanned_at"] = datetime.now().isoformat()
                self.log(f"  Category: {summary.get('category', 'unknown')}")
                return summary
        except json.JSONDecodeError as e:
            self.log(f"  JSON parse error: {e}")
            self.log(f"  Raw response: {ai_response[:500]}...")

        return None

    def categorize_by_keywords(self, summary: dict) -> str:
        """Fallback categorization using keywords."""
        text = json.dumps(summary).lower()
        prof_score = sum(1 for kw in PROFESSIONAL_KEYWORDS if kw in text)
        adv_score = sum(1 for kw in ADVENTURE_KEYWORDS if kw in text)

        if prof_score > adv_score * 1.5:
            return "professional"
        elif adv_score > prof_score * 1.5:
            return "adventure"
        return "hybrid"

    def cross_reference_resume(self) -> dict:
        """Find connections between projects and resume experience."""
        connections = {
            "transunion": [],
            "victorytext": [],
            "common_threads": [],
        }

        transunion_keywords = ["search", "distributed", "scale", "ml", "data", "whitepages"]
        victorytext_keywords = ["api", "messaging", "fastapi", "sms", "communication"]

        for summary in self.summaries:
            text = json.dumps(summary).lower()

            # TransUnion relevance
            tu_matches = [kw for kw in transunion_keywords if kw in text]
            if tu_matches:
                connections["transunion"].append({
                    "project": summary.get("project_dir"),
                    "relevance": tu_matches,
                    "highlight": summary.get("resume_highlight")
                })

            # VictoryText relevance
            vt_matches = [kw for kw in victorytext_keywords if kw in text]
            if vt_matches:
                connections["victorytext"].append({
                    "project": summary.get("project_dir"),
                    "relevance": vt_matches,
                    "highlight": summary.get("resume_highlight")
                })

        return connections

    def generate_professional_md(self) -> str:
        """Generate professional/corporate resume content."""
        prof_projects = [s for s in self.summaries
                        if s.get("category") in ("professional", "hybrid")]

        # Sort by complexity score
        prof_projects.sort(key=lambda x: x.get("complexity_score", 0), reverse=True)

        lines = [
            "# Professional Experience - Project Portfolio",
            "",
            f"*Generated: {datetime.now().strftime('%Y-%m-%d')}*",
            "",
            "## Overview",
            "",
            "This portfolio demonstrates enterprise-grade software development across ",
            "distributed systems, data engineering, API design, and cloud infrastructure.",
            "",
            "---",
            "",
        ]

        # Group by theme
        themes = {
            "Data Engineering & Analytics": [],
            "API & Backend Systems": [],
            "Distributed Systems": [],
            "Enterprise Applications": [],
        }

        for proj in prof_projects:
            techs = proj.get("technologies", [])
            tech_str = ", ".join(techs[:5]) if techs else "Various"

            if any(t in tech_str.lower() for t in ["data", "sql", "snowflake", "analytics"]):
                themes["Data Engineering & Analytics"].append(proj)
            elif any(t in tech_str.lower() for t in ["api", "fastapi", "rest", "backend"]):
                themes["API & Backend Systems"].append(proj)
            elif any(t in tech_str.lower() for t in ["distributed", "cluster", "mesh"]):
                themes["Distributed Systems"].append(proj)
            else:
                themes["Enterprise Applications"].append(proj)

        for theme, projects in themes.items():
            if not projects:
                continue
            lines.append(f"## {theme}")
            lines.append("")

            for proj in projects[:5]:  # Top 5 per category
                lines.append(f"### {proj.get('name', proj.get('project_dir'))}")
                lines.append("")
                lines.append(f"*{proj.get('tagline', 'No description')}*")
                lines.append("")
                if proj.get("purpose"):
                    lines.append(f"**Purpose:** {proj['purpose']}")
                    lines.append("")
                if proj.get("technologies"):
                    lines.append(f"**Stack:** {', '.join(proj['technologies'][:8])}")
                    lines.append("")
                if proj.get("resume_highlight"):
                    lines.append(f"**Key Achievement:** {proj['resume_highlight']}")
                    lines.append("")
                if proj.get("enterprise_relevance"):
                    lines.append(f"**Enterprise Value:** {proj['enterprise_relevance']}")
                    lines.append("")
                lines.append("---")
                lines.append("")

        # TransUnion connections
        connections = self.cross_reference_resume()
        if connections["transunion"]:
            lines.append("## Relevance to TransUnion Experience (2014-2018)")
            lines.append("")
            lines.append("These projects demonstrate continued expertise in areas developed at TransUnion SRG:")
            lines.append("")
            for conn in connections["transunion"][:5]:
                lines.append(f"- **{conn['project']}**: {', '.join(conn['relevance'])}")
            lines.append("")

        return "\n".join(lines)

    def generate_adventures_md(self) -> str:
        """Generate maker/adventure resume content."""
        adv_projects = [s for s in self.summaries
                       if s.get("category") in ("adventure", "hybrid")]

        adv_projects.sort(key=lambda x: x.get("complexity_score", 0), reverse=True)

        lines = [
            "# Adventures in Computing",
            "",
            f"*Generated: {datetime.now().strftime('%Y-%m-%d')}*",
            "",
            "## The Garage Lab Philosophy",
            "",
            "Beyond production systems, I maintain an active maker practice. These projects",
            "represent curiosity-driven exploration, hardware hacking, and experimental",
            "systems that push boundaries. Working within constraints forces creative solutions.",
            "",
            "---",
            "",
        ]

        # Group by adventure type
        categories = {
            "Edge Computing & IoT": [],
            "Mesh Networks & Communications": [],
            "Aviation & Real-time Systems": [],
            "AI & Language Models": [],
            "Experimental Hardware": [],
        }

        for proj in adv_projects:
            text = json.dumps(proj).lower()

            if any(kw in text for kw in ["raspberry", "pi", "iot", "sensor", "edge"]):
                categories["Edge Computing & IoT"].append(proj)
            elif any(kw in text for kw in ["mesh", "network", "wireless", "802.11"]):
                categories["Mesh Networks & Communications"].append(proj)
            elif any(kw in text for kw in ["aviation", "flight", "adsb", "aircraft"]):
                categories["Aviation & Real-time Systems"].append(proj)
            elif any(kw in text for kw in ["llm", "ai", "language model", "claude"]):
                categories["AI & Language Models"].append(proj)
            else:
                categories["Experimental Hardware"].append(proj)

        for category, projects in categories.items():
            if not projects:
                continue
            lines.append(f"## {category}")
            lines.append("")

            for proj in projects:
                lines.append(f"### {proj.get('name', proj.get('project_dir'))}")
                lines.append("")
                lines.append(f"*{proj.get('tagline', 'No description')}*")
                lines.append("")
                if proj.get("purpose"):
                    lines.append(f"{proj['purpose']}")
                    lines.append("")
                if proj.get("technologies"):
                    lines.append(f"**Built with:** {', '.join(proj['technologies'][:8])}")
                    lines.append("")
                if proj.get("innovations"):
                    lines.append("**Innovations:**")
                    for innov in proj["innovations"][:3]:
                        lines.append(f"- {innov}")
                    lines.append("")
                if proj.get("claude_involvement"):
                    lines.append(f"**Claude Collaboration:** {proj['claude_involvement']}")
                    lines.append("")
                if proj.get("maker_relevance"):
                    lines.append(f"**Maker Spirit:** {proj['maker_relevance']}")
                    lines.append("")
                lines.append("---")
                lines.append("")

        return "\n".join(lines)

    def generate_integration_json(self) -> dict:
        """Generate structured data for MDX website."""
        connections = self.cross_reference_resume()

        # Extract all technologies
        all_techs = []
        for s in self.summaries:
            all_techs.extend(s.get("technologies", []))
        tech_counts = {}
        for t in all_techs:
            tech_counts[t] = tech_counts.get(t, 0) + 1

        # Top technologies
        top_techs = sorted(tech_counts.items(), key=lambda x: x[1], reverse=True)[:20]

        # Claude contributions
        claude_projects = [
            {"project": s["project_dir"], "contribution": s["claude_involvement"]}
            for s in self.summaries
            if s.get("claude_involvement")
        ]

        return {
            "generated": datetime.now().isoformat(),
            "projectCount": len(self.summaries),
            "projects": self.summaries,
            "professionalProjects": [
                s for s in self.summaries if s.get("category") == "professional"
            ],
            "adventureProjects": [
                s for s in self.summaries if s.get("category") == "adventure"
            ],
            "hybridProjects": [
                s for s in self.summaries if s.get("category") == "hybrid"
            ],
            "topTechnologies": [{"name": t, "count": c} for t, c in top_techs],
            "claudeContributions": claude_projects,
            "transunionRelevance": connections["transunion"],
            "victorytextRelevance": connections["victorytext"],
            "themes": {
                "distributedSystems": len([s for s in self.summaries
                    if "distributed" in json.dumps(s).lower()]),
                "dataEngineering": len([s for s in self.summaries
                    if "data" in json.dumps(s).lower()]),
                "edgeComputing": len([s for s in self.summaries
                    if any(kw in json.dumps(s).lower() for kw in ["edge", "iot", "raspberry"])]),
                "aiMl": len([s for s in self.summaries
                    if any(kw in json.dumps(s).lower() for kw in ["ai", "ml", "llm", "model"])]),
            }
        }

    def save_outputs(self):
        """Save all generated outputs."""
        # Save project summaries
        summaries_path = OUTPUT_DIR / "project-summaries.json"
        with open(summaries_path, "w") as f:
            json.dump(self.summaries, f, indent=2)
        self.log(f"\nSaved: {summaries_path}")

        # Save professional markdown
        prof_path = OUTPUT_DIR / "professional-experience.md"
        with open(prof_path, "w") as f:
            f.write(self.generate_professional_md())
        self.log(f"Saved: {prof_path}")

        # Save adventures markdown
        adv_path = OUTPUT_DIR / "adventures.md"
        with open(adv_path, "w") as f:
            f.write(self.generate_adventures_md())
        self.log(f"Saved: {adv_path}")

        # Save integration JSON
        integration_path = OUTPUT_DIR / "resume-integration.json"
        with open(integration_path, "w") as f:
            json.dump(self.generate_integration_json(), f, indent=2)
        self.log(f"Saved: {integration_path}")

    def load_existing_summaries(self) -> bool:
        """Load existing summaries if available."""
        summaries_path = OUTPUT_DIR / "project-summaries.json"
        if summaries_path.exists():
            with open(summaries_path) as f:
                self.summaries = json.load(f)
            return True
        return False

    def run(self, single_project: Optional[str] = None):
        """Run the full autoresume pipeline."""
        self.log("=" * 60)
        self.log("AUTORESUME - Project Documentation to Resume Pipeline")
        self.log("=" * 60)

        if self.dry_run:
            self.log("\n[DRY RUN MODE - No API calls will be made]\n")

        # Scan for projects
        projects = self.scan_projects()
        self.log(f"\nFound {len(projects)} projects with documentation")

        # Filter to single project if specified
        if single_project:
            projects = [p for p in projects if p.name == single_project]
            if not projects:
                self.log(f"Project '{single_project}' not found or has no docs/")
                return

        # Process each project
        for i, project in enumerate(projects, 1):
            self.log(f"\n[{i}/{len(projects)}]")
            summary = self.summarize_project(project)
            if summary:
                self.summaries.append(summary)

            # Rate limiting
            if not self.dry_run and i < len(projects):
                time.sleep(API_DELAY_SECONDS)

        # Generate outputs
        if self.summaries:
            self.save_outputs()
            self.log(f"\n{'=' * 60}")
            self.log(f"Complete! Processed {len(self.summaries)} projects")
            self.log(f"Output directory: {OUTPUT_DIR}")
        else:
            self.log("\nNo summaries generated.")


def main():
    parser = argparse.ArgumentParser(
        description="Automated project documentation to resume pipeline"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Preview without making API calls"
    )
    parser.add_argument(
        "--project", type=str,
        help="Process single project by name"
    )
    parser.add_argument(
        "--categorize", action="store_true",
        help="Just recategorize from existing summaries"
    )
    parser.add_argument(
        "--generate", action="store_true",
        help="Generate markdown from existing summaries"
    )
    parser.add_argument(
        "--quiet", action="store_true",
        help="Suppress progress output"
    )

    args = parser.parse_args()

    autoresume = AutoResume(
        dry_run=args.dry_run,
        verbose=not args.quiet
    )

    if args.categorize or args.generate:
        # Load existing summaries
        if autoresume.load_existing_summaries():
            autoresume.log(f"Loaded {len(autoresume.summaries)} existing summaries")
            autoresume.save_outputs()
        else:
            autoresume.log("No existing summaries found. Run full scan first.")
    else:
        # Full run
        autoresume.run(single_project=args.project)


if __name__ == "__main__":
    main()
