---
title: "Language scrub: the house voice for bradley.io"
status: rules approved by Brad 2026-10-22 (the resume summary, v1.0.470, is the reference)
---

# Language scrub

Brad, 2026-10-22: some of the site's language is too inside-baseball, some sentences run on, and long pages need a
"Read more". The resume summary rewrite (v1.0.470) is the approved sample. These rules come from it.

## The rules

1. **One idea a sentence.** If a sentence has two "and"s holding up separate claims, split it.
2. **No semicolon chains.** A semicolon joining two short clauses is allowed once in a while. Three or more items
   separated by semicolons become a list, or separate sentences.
3. **Lists for parallel things.** Four projects, four services, four steps: a list, each item led by its name in
   bold, then a colon, then a plain sentence.
4. **Plain words over internal names.** Say what a thing does before (or instead of) what it is called inside the
   house. "Gives AI agents a memory", not "a journaled state kernel". "The SysForge platform", not "the SysForge
   fabric". A name a reader would have to look up gets a few words of what it is, or goes.
5. **Numbers stay.** Counts, dates and measurements are the site's evidence. Keep them, in plain sentences.
6. **The reader is a hiring manager or a client first.** Builders get the detail one click deeper (a "Read more", a
   field note, the repo), not in the first paragraph.
7. **Still the site's rules:** no em dashes, no salary, no names of people on /walk-ins, and the resume's naming
   rules in lib/resume.ts (Campaign Brain named, its services not; Nominate.AI never on resume surfaces).

## Read more

A page or section with a lot of text shows its opening and folds the rest under "Read more". The folded text is
still in the HTML (a `<details>` element or the same pattern), so search engines, tinypeek and the site search read
all of it, and it prints. One component, used the same way everywhere.

## Order of the passes

The pages a hiring manager reads first: home, /about, /resume, /work, /services. Then /projects and the papers, then
the instruments. One deploy per batch.
