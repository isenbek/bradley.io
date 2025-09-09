'use client';

import { useTheme } from '@/components/ui/theme-provider';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { themes } from '@/lib/theme-config';

export default function ThemeDemoPage() {
  const { currentTheme, themeConfig } = useTheme();

  return (
    <div className="theme-container">
      <div className="theme-section">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="theme-heading text-4xl font-bold">Theme Demo</h1>
            <p className="theme-text-muted text-lg">
              Test different styling themes inspired by the standalone HTML design
            </p>
            <div className="flex justify-center">
              <ThemeSelector />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="theme-card p-6 space-y-4">
              <h2 className="theme-heading text-xl font-semibold">Philosophy</h2>
              <div className="p-4 border-l-4 border-secondary bg-muted/20 italic">
                <span className="font-semibold not-italic" style={{ color: 'var(--primary)' }}>
                  AI where it makes sense.
                </span>{' '}
                While others chase buzzwords, I build practical solutions—from massive Snowflake 
                datasets to tiny edge devices making real-time inferences on constrained hardware.
              </div>
            </div>

            <div className="theme-card p-6 space-y-4">
              <h2 className="theme-heading text-xl font-semibold">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {['Rust', 'Apache Kafka', 'PostgreSQL', 'Docker', 'gRPC', 'WebAssembly'].map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 text-sm border rounded"
                    style={{
                      backgroundColor: 'var(--muted)',
                      color: 'var(--muted-foreground)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="theme-card p-6 space-y-4">
              <h2 className="theme-heading text-xl font-semibold">Buttons</h2>
              <div className="space-y-3">
                <button className="theme-button-primary w-full">
                  Primary Action
                </button>
                <button className="theme-button-secondary w-full">
                  Secondary Action
                </button>
              </div>
            </div>

            <div className="theme-card p-6 space-y-4">
              <h2 className="theme-heading text-xl font-semibold">Metrics</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                    0.3ms
                  </div>
                  <div className="theme-text-muted text-xs uppercase tracking-wide">
                    Avg Latency
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
                    1M+
                  </div>
                  <div className="theme-text-muted text-xs uppercase tracking-wide">
                    Events/sec
                  </div>
                </div>
              </div>
            </div>

            <div className="theme-card p-6 space-y-4">
              <h2 className="theme-heading text-xl font-semibold">Code Block</h2>
              <div
                className="p-4 rounded font-mono text-sm overflow-x-auto"
                style={{
                  backgroundColor: 'var(--muted)',
                  color: 'var(--foreground)',
                  borderColor: 'var(--border)',
                  border: '1px solid',
                }}
              >
                <div style={{ color: 'var(--primary)' }}>cargo install dataflow-cli</div>
                <div className="mt-2">
                  <div>dataflow init my-project</div>
                  <div>cd my-project</div>
                  <div>dataflow dev --port 3000</div>
                </div>
              </div>
            </div>

            <div className="theme-card p-6 space-y-4">
              <h2 className="theme-heading text-xl font-semibold">Features</h2>
              <div className="space-y-2">
                {[
                  'Large-scale data engineering with Snowflake',
                  'Edge computing & resource-constrained inference',
                  'Real-time data ingestion & processing',
                  'Local AI deployment & optimization',
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span style={{ color: 'var(--secondary)' }}>→</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="theme-heading text-2xl font-bold text-center">Current Theme Details</h2>
            <div className="theme-card p-6">
              <h3 className="theme-heading text-lg font-semibold mb-4">
                {themeConfig.name}
              </h3>
              <p className="theme-text-muted mb-4">{themeConfig.description}</p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Typography</h4>
                  <div className="space-y-1 text-sm theme-text-muted">
                    <div>Font Family: {themeConfig.typography.fontFamily}</div>
                    <div>Font Size: {themeConfig.typography.fontSize}</div>
                    <div>Line Height: {themeConfig.typography.lineHeight}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Layout</h4>
                  <div className="space-y-1 text-sm theme-text-muted">
                    <div>Container: {themeConfig.spacing.container}</div>
                    <div>Section Spacing: {themeConfig.spacing.section}</div>
                    <div>Border Radius: {themeConfig.effects.borderRadius}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium mb-2">Color Palette</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(themeConfig.colors).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: color, borderColor: 'var(--border)' }}
                      ></div>
                      <span className="text-xs theme-text-muted capitalize">
                        {name.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}