---
title: "Deere sandbox: the recipe and the ten-minute errand"
project: housecalls
status: OUR SIDE BUILT; blocked on the account errand (two human gates)
created: 2026-09-08
---

# Deere sandbox registration

Month-one step 1 from the container's docs/DEERE.md. The AI built and
tested everything on our side; two gates are yours by doctrine, Brad:
the email verification lands in your inbox, and the account requires
accepting a legal agreement, and the AI drafts but the human signs.

## What is already done (no action needed)

- **Callback endpoint live**: `bradley.io/api/housecalls/deere/callback`
  receives the OAuth redirect, shows the one-time code, stores nothing.
- **CLI helper tested** (6 selftests): `scripts/housecalls-deere.mjs`
  with `init / auth-url / exchange / refresh / orgs`. Credentials go to
  `data/housecalls/deere.json` (gitignored, mode 600), never the repo.
- **Endpoints and scopes confirmed** from the official dev docs:
  issuer `signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7`, sandbox
  API `sandboxapi.deere.com/platform`, tokens live 12 hours,
  `offline_access` grants refresh. We request the minimal read set:
  `org1` (view staff/partners), `ag1` (view fields), `eq1` (view
  equipment), `offline_access`.

## The license you will be accepting (read before clicking)

Creating a developer application requires accepting Deere's
**API Development License Agreement** (linked from the signup flow;
also at developer.deere.com/clickThroughAPIAgreement.html). The AI
read it 2026-09-08; the honest summary:

- Development-only license: **no monetization until a separate
  Production Agreement** is signed later (fine; sandbox is exactly
  what we want for month one).
- Keep the application ID/secret confidential; protect any customer
  data per the agreement; **security breaches must be reported to
  Deere within 24 hours**; Deere may audit.
- Deere can modify or suspend the APIs without notice, warranties are
  disclaimed, liability sits with us, Illinois law governs.
- Either side can terminate; on termination, destroy licensed
  materials within 10 days.

Nothing in it conflicts with our doctrine: sandbox work is unpaid
development, our stack stores grower data on the grower's device, and
the one account/five-orgs/150k-calls/6-months sandbox limits are far
above our month-one needs.

## The errand (about ten minutes)

1. **Create the John Deere account**:
   https://account.deere.com/actmgmt/onboarding/registration
   Enter your email, fetch the verification code from your inbox,
   finish the profile. Use a password of your choosing or ask the AI
   for one. During signup you will create an **Operations Center
   organization**; name it plainly (it is our test org).
2. **Sign in at https://developer.deere.com** with that account, go to
   **My Applications, then Create Application**, and accept the API
   Development License Agreement (summary above).
3. **Application form**, ready to paste:
   - Name: `Bradley.io` (Deere asks for the company/product legal
     name, no words describing function, nothing like "test").
   - Short description: `Exports your organization's fields,
     operations, and equipment records, with your consent, into a
     database you keep on your own device.`
   - Redirect URI: `https://bradley.io/api/housecalls/deere/callback`
   - Logo: skip (only required at production).
   - API access step: request **Fields** and **Equipment** (or use
     "Skip this step"; Organizations access comes automatically and
     access can be requested later from the Access tab).
4. **Copy the credentials**: My Applications, View Details, Security
   section: **Application Id** and **Secret**. Hand both to the AI in
   session (they go into the gitignored config, nowhere else).

## What happens the moment you hand over the credentials

```
node scripts/housecalls-deere.mjs init --id <applicationId> --secret <secret>
node scripts/housecalls-deere.mjs auth-url    # open it, sign in, allow
node scripts/housecalls-deere.mjs exchange --code <code from callback page>
node scripts/housecalls-deere.mjs orgs        # the proof: your org, via API
```

If `orgs` shows the org needs a connection, the tool prints the
connections.deere.com link to click once while signed in; that is the
grower-consent step working as designed, on ourselves first.

Then step 2 of month one: "export my farm" into the harness, and a
ledger entry with the receipt.

## Sandbox rules we operate under (from the official guide)

One test account in Operations Center; at most five connected
organizations; under 150,000 API calls a month; six months in sandbox
before requesting production or an extension
(JohnDeereIntegrations@JohnDeere.com). All far above month-one usage.
