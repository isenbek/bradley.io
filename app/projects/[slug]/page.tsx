import type { Metadata } from "next"
import { readFileSync } from "fs"
import { join } from "path"
import { ProjectDetail } from "@/components/projects/ProjectDetail"

interface ProjectMeta {
  slug: string
  name: string
  tagline: string
  description: string
  category: string
}

function loadProjects(): ProjectMeta[] {
  try {
    const data = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/site-data.json"), "utf-8")
    )
    return data.projects || []
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const projects = loadProjects()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return {
      title: "Project Not Found",
      robots: { index: false, follow: false },
    }
  }

  const description = project.tagline || project.description?.slice(0, 160) || ""

  return {
    title: project.name,
    description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: `${project.name} | bradley.io`,
      description,
      url: `https://bradley.io/projects/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} | bradley.io`,
      description,
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const projects = loadProjects()
  const project = projects.find((p) => p.slug === slug)

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: "https://bradley.io/projects",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project?.name ?? slug,
        item: `https://bradley.io/projects/${slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <ProjectDetail />
    </>
  )
}
