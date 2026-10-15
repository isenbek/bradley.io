---
title: "Integration examples: the outside platforms SysForge connects to"
status: draft, for an "Integrations performed" section on sysforge.ai. Inferred from config key names, 2026-10-15
---

# Integration examples

What the platform plugs into, worked out from the names of the settings its services read. These are names only,
never values: a key called `SQUARE_PROD_TOKEN` says a service talks to Square in production, and nothing more. So
every line here is an inference, with a confidence attached, and the wording for the public site says "connected
to", never "partnered with".

## The house (Brad, 2026-10-15)

- **SysForge** is the platform as a whole. TinyKit, the app kit every tinymachines app is built on, lives under it.
- **Meatball** is the creative side of the house.
- **TinyMachines** is the hardware.
- **Bradley** is Brad and Claude, who build it.

So the integrations below are SysForge's story to tell. The network gear at the end belongs to TinyMachines.

## The count

- **180 projects** in the key list (97 services, 83 deploy hooks), **313 distinct key names** after removing
  duplicates (558 rows before).
- **169 keys point at something outside the platform:** 131 with the platform in the name (high confidence), 30
  worked out from naming (medium), 8 guesses (low).
- **36 platforms** (33 named here, 3 political ones described generically), plus four partner or vendor services
  with logins of their own.
- The rest: 100 keys for the platform's own services talking to each other, 27 for network and office devices, 12
  for tools that run on our own machines (object storage, backups, local AI models, web push), and 5 generic mail
  server settings.

## Integrations performed

Grouped the way a reader would look for them. A number after a platform is how many separate accounts or locations
the platform is wired to, where the keys show it.

### Payments and commerce

- **Stripe**, **Square** (production and sandbox), **Clover** (6 merchant accounts), **Shopify**.
- **QuickBooks Online** (Intuit), for the books.
- A **commercial bank's API** (test and production logins).

### Hospitality operations

- **WebRezPro** and **Cloudbeds** (hotel property management).
- **Homebase** (staff scheduling and time clocks, 7 locations).
- **OpenTable** (reservation reports) and **Cojilio** (bookings feed).

### Marketing, email and social

- **Iterable** (email marketing: 8 separate newsletter and campaign tokens, plus signed webhooks coming back).
- **BriteVerify** (checks an address is real before mail goes to it).
- **Vista Social** and **Meta / Facebook** (social).
- **Front** (shared team inbox, more than one workspace).
- **Gmail** (sending and reading mail as a service).

### Political data, ads and fundraising

- A **voter data platform**, an **ad spending tracker** and an **online fundraising platform** (named generically
  on purpose, Brad 2026-10-15).

### Data and cloud

- **Snowflake** (data warehouse), **AWS** (storage, across 6 separate accounts), **Azure SQL**.
- **Airtable** and **Google Sheets** (where people keep the data by hand).
- **Apache Druid** (an analytics database, likely a partner's; medium confidence).

### Documents, forms and sign-off

- **BoldSign** (e-signature, with signed webhooks into three services).
- **Typeform** and a survey platform whose question ids follow Qualtrics' naming (medium).

### AI

- **Anthropic** (Claude) and **Mistral AI**, alongside models run on our own machines.

### Code, maps and media

- **GitHub** (every service deploys from a signed GitHub webhook: 86 of them).
- **YouTube Live** (streaming from a device we provision).
- **Mapillary** (street-level imagery) and **OpenStreetMap** (sign-in; medium).
- **WordPress** (publishing to a client's site).
- **Proton VPN**.

### The hardware side (TinyMachines)

Not outside platforms, but real integrations all the same: **Ubiquiti UniFi** controllers (read and read-write
keys, guest Wi-Fi vouchers), a **TP-Link Omada** router, **OpenWrt** routers and mesh at a remote site, a **Ricoh**
scanner that drops scans over FTP, a **Wi-Fi provisioned streaming device**, and an **SMS gateway** device.

## What the keys say about how it is built

These are the parts worth telling, because they are what makes an integration hold up rather than just connect:

- **One integration, many accounts.** The point-of-sale link runs 6 merchants, scheduling runs 7 locations, email
  marketing runs 8 campaign streams, storage spans 6 cloud accounts. Each is one piece of code with a credential per
  tenant, not a copy per customer.
- **Both directions.** Webhooks come back in, each checked against its own secret: e-signature, email marketing,
  forms, and every deploy.
- **Sandbox before production.** Payments and banking carry a test login next to the live one.
- **Shared services underneath.** One file service is used by 26 other services; one sign-in service by 14. An
  integration is written once and reached by everything that needs it.

## Draft copy for sysforge.ai

> **Integrations performed.** SysForge connects the tools a business already runs on, in both directions: payments
> (Stripe, Square, Clover, Shopify), books (QuickBooks), hotel and restaurant operations (WebRezPro, Cloudbeds,
> Homebase, OpenTable), marketing (Iterable, Meta, Vista Social), data (Snowflake, AWS, Azure, Airtable, Google
> Sheets), documents (BoldSign, Typeform) and AI (Anthropic, Mistral). 36 platforms so far. One integration serves
> many accounts: six merchants on one point-of-sale link, seven locations on one scheduling link.

Before it goes live, Brad's calls (the first is made):

1. **Political platforms: decided (Brad, 2026-10-15), generic names.** "A voter data platform, an ad spending
   tracker and an online fundraising platform", never the product names: naming them points at the political work.
2. **The bank.** The keys name it. The draft says "a commercial bank's API".
3. **Partner services** (four, named in `keys-platforms.tsv`): left out of the public copy; they
   are other companies' systems, not platforms.
4. **Numbers.** Counted from the key list on 2026-10-15. If the site quotes them, recount from the source before
   each change, as the site's other numbers are.

## Uncertain, and not counted

- **Guesses:** a data vendor's login, a prospecting login, a donations key, a "VT" messaging transport, and `JEV_API`. Any could
  be an outside vendor; the names do not settle it.
- **`SMTP_*` and `IMAP_*`:** a mail server, host not named.
- **`OPIF_INGEST_HMAC_SECRET`:** likely the FCC's public files of political ad buys coming in, but the secret
  guards our own ingest, not a login to the FCC.

## TinyKit, under SysForge

To think through next, not decided:

- TinyKit is the app kit (`@tinymachines/kit`): the look, the frame, install and offline, sharing, one account for
  every app (accounts.tinymachines.ai), Your files, sensors and widgets. Its demo is tinykit.tinymachines.ai.
- If SysForge is the platform as a whole, TinyKit is its front end: the part a person holds. The integrations above
  are the back of the house; TinyKit is how their results reach a phone.
- Open questions: does TinyKit get a section or page on sysforge.ai, does its name stay under tinymachines (the
  hardware) or move under SysForge, and which apps on it are shown.

## Source and method

- `docs/keys.tsv` (project, key name; 558 rows; no values) and `docs/keys-platforms.tsv` (each distinct key with
  its guessed platform, kind, confidence and projects). **Both stay out of git:** this repo is public, and they
  name clients, merchants and accounts. This file names none of them.
- Rules for the guesses: a platform named in the key is high; one worked out from a neighbour key or from naming
  habits is medium; a vendor name with nothing else to go on is low. Devices, our own services and self-hosted tools
  are listed apart and not counted as outside platforms.
