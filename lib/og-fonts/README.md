# Share-card fonts

TTF copies of three of the kit's woff2 faces (`app/beta/kit/fonts/`), for
`lib/og-card-kit.tsx`. next/og (satori) reads TTF, OTF and WOFF, not woff2.
Converted with fontTools (`TTFont(woff2).flavor = None`). Archivo is a
variable font, which satori cannot read, so it is also pinned to wght 800
(`uvx --from fonttools fonttools varLib.instancer <var.ttf> wght=800`; the
system fontTools 4.29 fails on this font).
Licences: OFL-Archivo.txt, OFL-IBMPlex.txt. Regenerate them if the kit's
fonts are resynced.
