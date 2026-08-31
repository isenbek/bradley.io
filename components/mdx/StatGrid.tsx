import * as LucideIcons from "lucide-react"

type IconName = keyof typeof LucideIcons

interface Stat {
  value: string
  label: string
  icon?: IconName
}

interface StatGridProps {
  stats: Stat[]
}

/**
 * A row of stat tiles for MDX content.
 *
 * This used to stagger the tiles in with framer-motion on scroll. The animation
 * was the component's only reason to be a client component and framer-motion's
 * only importer that the build could reach, so it went with the dependency: a
 * scroll-triggered fade is not worth a runtime animation library, and the tiles
 * read the same on arrival either way. Now a plain server component.
 */
export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="container-page py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
            ? (LucideIcons[stat.icon] as React.ComponentType<{ className?: string }>)
            : null

          return (
            <div
              key={index}
              className="bg-sf-dark-alt rounded-xl p-6 shadow-sm border border-sf-steel/15 text-center"
            >
              {IconComponent && (
                <IconComponent className="w-6 h-6 text-sf-orange mx-auto mb-2" />
              )}
              <div className="text-stat text-sf-orange">{stat.value}</div>
              <div className="text-sm font-medium text-sf-muted mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
