import Link from "next/link"
import { Github, Linkedin, Mail, MapPin, Phone } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    services: [
      { href: "/services/edge-computing", label: "Edge Computing" },
      { href: "/services/data-architecture", label: "Data Architecture" },
      { href: "/services/ai-ml", label: "AI/ML Implementation" },
      { href: "/services/consulting", label: "Strategic Consulting" },
    ],
    industries: [
      { href: "/industries/healthcare", label: "Healthcare" },
      { href: "/industries/manufacturing", label: "Manufacturing" },
      { href: "/industries/retail", label: "Retail" },
      { href: "/industries/fintech", label: "Fintech" },
    ],
    resources: [
      { href: "/blog", label: "Blog" },
      { href: "/case-studies", label: "Case Studies" },
      { href: "/terminal", label: "Terminal Portfolio" },
      { href: "/contact", label: "Contact" },
    ],
  }

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">Bradley.io</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                AI Data Engineering & Edge Computing Solutions for Enterprise
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Grand Rapids, Michigan
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                Available for Consultation
              </div>
            </div>
            <div className="flex space-x-4">
              <a
                href="https://github.com/tinymachines"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@bradley.io"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h4 className="font-semibold mb-3">Industries</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.industries.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Bradley.io. All rights reserved.</p>
          <p className="mt-2">
            Transforming data into decisions through intelligent edge computing.
          </p>
        </div>
      </div>
    </footer>
  )
}