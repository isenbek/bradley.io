"use client"

import Image from "next/image"
import { AnimatedSection } from "@/components/ui/AnimatedSection"

interface HeroImageProps {
  src?: string
  alt: string
  placeholder?: string
}

export function HeroImage({ src, alt, placeholder }: HeroImageProps) {
  const hasImage = src && !src.startsWith("placeholder:")

  return (
    <AnimatedSection className="w-full py-8">
      <div className="container-page">
        <div className="relative w-full aspect-[16/9] md:aspect-[2/1] rounded-2xl overflow-hidden shadow-xl border border-sf-steel/15">
          {hasImage ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-sf-orange/10 to-sf-cyan/10 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-sf-steel/20 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-sf-steel/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sf-steel font-medium">
                  {placeholder || alt}
                </p>
                <p className="text-sm text-sf-muted mt-1">
                  Screenshot placeholder
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  )
}
