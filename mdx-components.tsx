import type { MDXComponents } from "mdx/types"
import { PageHeader } from "@/components/mdx/PageHeader"
import { StatGrid } from "@/components/mdx/StatGrid"
import { FeatureCard, FeatureGrid } from "@/components/mdx/FeatureCard"
import { CalloutBox } from "@/components/mdx/CalloutBox"
import { PageNav } from "@/components/mdx/PageNav"
import { IntegrationBadges } from "@/components/mdx/IntegrationBadges"
import { HeroImage } from "@/components/mdx/HeroImage"

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    PageHeader,
    StatGrid,
    FeatureCard,
    FeatureGrid,
    CalloutBox,
    PageNav,
    IntegrationBadges,
    HeroImage,
    h1: ({ children }) => (
      <h1 className="container-page font-display text-4xl md:text-5xl font-bold text-sf-white mb-6">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="container-page font-display text-2xl md:text-3xl font-bold text-sf-white mt-12 mb-4">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="container-page font-display text-xl md:text-2xl font-bold text-sf-white mt-8 mb-3">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="container-page text-sf-steel leading-relaxed mb-4">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="container-page list-disc list-inside mb-4 space-y-2 text-sf-steel">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="container-page list-decimal list-inside mb-4 space-y-2 text-sf-steel">
        {children}
      </ol>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-sf-orange hover:text-sf-orange-light underline underline-offset-2"
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="container-page border-l-4 border-sf-orange pl-4 italic text-sf-muted my-4">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-sf-dark-alt px-1.5 py-0.5 rounded text-sm font-mono text-sf-cyan">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="container-page bg-sf-blue text-sf-white p-4 rounded-lg overflow-x-auto my-4">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="container-page my-6 overflow-x-auto">
        <table className="w-full border-collapse bg-sf-dark-alt rounded-lg overflow-hidden">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-sf-blue text-sf-white">
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-sf-steel/15">
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-sf-white/5 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-sf-steel border-b border-sf-steel/15">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="container-page my-8 border-sf-steel/15" />
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-sf-white">
        {children}
      </strong>
    ),
    ...components,
  }
}
