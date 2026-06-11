import Link from "next/link"
import { Bot, Flame, GitBranch, MessageSquare } from "lucide-react"
import { timeAgo } from "@/lib/time-ago"
import type { ActivityItem } from "@/lib/site-data"
import { V3_CATEGORY } from "@/app/projects/_categories"
import type { CategoryId } from "@/lib/project-categories"

function iconFor(type: string) {
  switch (type) {
    case "claude-code":
      return <Bot size={15} strokeWidth={2.25} />
    case "claude-web":
      return <MessageSquare size={15} strokeWidth={2.25} />
    case "github":
      return <GitBranch size={15} strokeWidth={2.25} />
    case "milestone":
      return <Flame size={15} strokeWidth={2.25} />
    default:
      return <Bot size={15} strokeWidth={2.25} />
  }
}

function iconModFor(type: string): string {
  switch (type) {
    case "claude-web":
      return "v3-activity__icon--web"
    case "github":
      return "v3-activity__icon--gh"
    default:
      return ""
  }
}

export function ActivityFeedList({
  feed,
  limit = 15,
}: {
  feed: ActivityItem[]
  limit?: number
}) {
  const visible = feed.slice(0, limit)
  if (visible.length === 0) {
    return <div className="v3-empty">No recent activity yet.</div>
  }

  return (
    <div className="v3-activity">
      {visible.map((item, i) => {
        const cat = item.category
          ? V3_CATEGORY[item.category as CategoryId]
          : null
        const inner = (
          <div className="v3-activity__item">
            <div className={`v3-activity__icon ${iconModFor(item.type)}`.trim()}>
              {iconFor(item.type)}
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 2,
                }}
              >
                <span className="v3-activity__title">{item.title}</span>
                {cat ? (
                  <span
                    style={{
                      fontFamily: "var(--font-v3-mono), monospace",
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
                      color: cat.color,
                    }}
                  >
                    {cat.label}
                  </span>
                ) : null}
                <span
                  className="v3-activity__date"
                  style={{ marginLeft: "auto", marginTop: 0 }}
                >
                  {timeAgo(item.date)}
                </span>
              </div>
              {item.description ? (
                <div className="v3-activity__desc">{item.description}</div>
              ) : null}
            </div>
          </div>
        )

        return item.projectSlug ? (
          <Link
            key={`${item.type}-${i}`}
            href={`/projects/${item.projectSlug}`}
            // 15 feed items × default-prefetch would burn bandwidth.
            prefetch={false}
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            {inner}
          </Link>
        ) : (
          <div key={`${item.type}-${i}`}>{inner}</div>
        )
      })}
    </div>
  )
}
