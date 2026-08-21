---
title: MyFinalWishes — Codebase Inventory
summary: Lines of code, modules and structure of SecretNemo/myfw as of 21 August 2026
version: Rev 1
updated: 2026-08-21
---

# MyFinalWishes — Codebase Inventory

**`SecretNemo/myfw`** · `mywishes.com` / `myfinalwishes.co`
Measured on branch `main` at commit `64e9121`, **21 August 2026**.

---

## The headline number

# ~83,200 lines of code

**~80,000** if you count only the application and its tests, excluding shell
scripts and tooling.

Documentation is a further **15,930 lines** across 56 files, quoted separately
below rather than folded into the code figure.

---

## By language

| Language | Lines | Files |
|---|---:|---:|
| **TypeScript + TSX** — the application | **78,152** | 336 |
| SQL — database migrations | 2,100 | 62 |
| Shell — build and operations scripts | 1,770 | 22 |
| CSS | 691 | 3 |
| Python — documentation tooling only | 444 | 3 |
| **Total** | **~83,200** | **426** |

**What is deliberately excluded:** `node_modules`, `.git`, build output,
minified files and `package-lock.json`. Also excluded is roughly **175,000
lines of JSON**, which is almost entirely lockfiles and generated data rather
than authored work — counting it would inflate the total roughly three-fold
and would not be an honest number.

---

## By area

| Area | Lines | Files | What it is |
|---|---:|---:|---|
| `src/lib` | **48,145** | 211 | Business logic — 38 domain modules |
| `src/routes` | **15,214** | 48 | Pages and server endpoints |
| `support/` | 5,592 | — | Operational tooling |
| `src/components` | 4,520 | 26 | Shared UI |
| `drizzle/` | 2,100 | 62 | Database migrations |
| `e2e/` | 1,787 | 18 | End-to-end tests |
| `scripts/` | 1,156 | 22 | Build and deploy |

Roughly **three quarters of the application is business logic**, not interface.
That ratio is worth noting: this is a data-and-rules system with a web front
end, not a website with some logic attached.

---

## The 38 modules

`src/lib`, largest first.

| Module | Lines | | Module | Lines |
|---|---:|---|---|---:|
| `auth` | 6,821 | | `email` | 971 |
| `professionals` | 4,594 | | `items` | 951 |
| `db` | 3,864 | | `profile` | 934 |
| `documents` | 2,670 | | `dashboard` | 831 |
| `trusted` | 2,527 | | `photos` | 793 |
| `admin` | 2,469 | | `intake` | 773 |
| `account` | 2,212 | | `events` | 747 |
| `assets` | 1,718 | | `domain` | 723 |
| `beneficiaries` | 1,585 | | `media` | 712 |
| `contacts` | 1,548 | | `trash` | 691 |
| `recordings` | 1,460 | | `sp` | 671 |
| `crypto` | 1,157 | | `search` | 667 |
| | | | `geo` | 651 |

Remaining modules, each under 550 lines: `storage`, `traffic`, `sharing`,
`final-wishes`, `dormancy`, `access`, `shared`, `seo`, `notifications`,
`legal`, `geocode`, `http`, `upload`, `settings`.

### What the size distribution says

**`auth` at 6,821 lines is the largest single module**, which is what you would
expect and want in a product whose whole promise is controlling who can see
someone's most private information after they die. Sessions, magic links,
two-factor, login attempts and trusted-contact access all live here.

**`professionals` at 4,594 lines** is the second largest — the funeral
director, attorney and advisor side of the product, effectively a second
application sharing the same data.

**`crypto` at 1,157 lines** is small but load-bearing: it is what makes the
stored data unreadable without the right key.

---

## Database

| | |
|---|---|
| Tables | **42** |
| Schema modules | 26 |
| Migrations applied | 62 |
| Engine | SQLite via **Drizzle ORM** |

Schema areas: identity and sessions, two-factor, magic links, login attempts,
profile, assets, items, categories, documents, recordings, beneficiaries,
relationships, contacts, trusted contacts, final wishes, professionals,
inquiries, listing views, notifications, global share, geo blocks, access log,
admin audit, deleted accounts, app settings.

---

## Testing

| | |
|---|---:|
| Unit test files | **69** |
| End-to-end specs | **18** |
| Total test files | **87** |

87 test files against 426 source files — roughly **one test file for every five
source files**.

---

## Stack

| | |
|---|---|
| Language | TypeScript 6 |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Database | Drizzle ORM 0.45 (SQLite) |
| Validation | Zod 4 |
| Routing | File-based, 48 route modules |
| Server functions | 24 modules |
| React components | 73 |

A current stack throughout — React 19 and Tailwind 4 are both the latest
majors. Nothing here is carrying legacy weight.

---

## Development history

| | |
|---|---|
| Commits | **357** |
| First commit | 28 July 2026 |
| Latest commit | **21 August 2026** |
| Elapsed | **~3.5 weeks** |
| Authors | 1 (plus automated dependency updates) |

**Churn across the life of the repository:**

```
added    85,324 lines
removed   5,232 lines
net      80,092 lines
```

The low removal figure is worth reading carefully: **94% of everything written
is still in the codebase.** That is unusually little rework, and it indicates
the structure was settled before the volume was written rather than being
discovered during it.

---

## Summary for quoting

> **MyFinalWishes is approximately 83,000 lines of code** across 426 source
> files — 78,000 of it TypeScript — organised into **38 business modules**,
> backed by a **42-table database**, and covered by **87 test files**.
>
> It was built in **under four weeks**, and 94% of everything written remains
> in place.

---

*Figures measured directly from the repository, not estimated. Anyone wanting
to reproduce them can do so from `main` at commit `64e9121`.*
