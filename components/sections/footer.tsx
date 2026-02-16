import { Github, Mail, MapPin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          {/* Brand & Tagline */}
          <div className="md:flex-1">
            <h3 className="text-xl font-bold text-slate-900">Bradley S. Isenbek</h3>
            <p className="mt-2 text-slate-600">
              Software Architect • Systems Integrator • Maker
            </p>
          </div>

          {/* Contact Info - Stacked */}
          <div className="flex flex-col gap-3 text-sm">
            <a
              href="mailto:brad@isenbek.io"
              className="flex items-center gap-3 text-slate-600 hover:text-teal-600 transition-colors"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              brad@isenbek.io
            </a>
            <a
              href="https://github.com/tinymachines"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-slate-600 hover:text-teal-600 transition-colors"
            >
              <Github className="h-4 w-4 flex-shrink-0" />
              github.com/tinymachines
            </a>
            <span className="flex items-center gap-3 text-slate-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              Grand Rapids, MI
            </span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>&copy; {currentYear} Bradley S. Isenbek</p>
        </div>
      </div>
    </footer>
  )
}
