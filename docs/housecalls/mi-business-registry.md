---
title: "Michigan business registry: what it is and how the hunt uses it"
project: housecalls
status: reference (found 2026-09-07 on Brad's ask)
created: 2026-09-07
---

# The Michigan business registry

Brad asked for "the SOS business database for Michigan." Three findings,
one of them a correction worth keeping.

## Finding one: in Michigan it is not the SOS

Unusually, Michigan's Secretary of State does elections and vehicles;
business entities live under **LARA** (Department of Licensing and
Regulatory Affairs, Corporations, Securities & Commercial Licensing
Bureau). The old COFS system (2017) was retired; since **June 23, 2025**
the registry is the **MiBusiness Registry Portal**:

**https://mibusinessregistry.lara.state.mi.us/search/business**

(The old cofs.lara host now fails TLS entirely; update any bookmarks.)

## Finding two: the fleet's "sos" corpus is a different animal

cbintel carries an `sos` resource (1,958 documents, 8 states, ~925 for
Michigan), but it is Secretary-of-State ELECTIONS material: candidates,
filing deadlines, regulations, rules. Campaign Brain's home turf, not a
business-entity registry. Useful someday for the RFP lane's civic
calendar; not for looking up a manufacturer.

## Finding three: what the registry yields, and why the hunt cares

A free entity lookup returns what no scraper database can be trusted for,
straight from the state record:

- exact legal entity name and ID, formation date, status
- **the resident agent's NAME and registered office address**
- annual-report filings, which list **officers and directors**
- assumed names (DBAs), mergers, dissolutions

For the hunt this is the missing G3 tool: JR Automation, Behler-Young,
and Feyen Zylstra all sit one named contact away from qualified, and the
registry names real officers with real addresses, as public record filed
by the companies themselves. It also verifies legal names before a letter
goes out (Roskam Baking Company vs Roskam Foods, for example).

## The access stance, per doctrine

The portal sits behind a Cloudflare Turnstile human check, and the answer
to a bot wall is the same as to any other no: we do not go around it.
**Lookups are a human-in-a-browser errand**, two minutes each, and the
five-prospect list below fits in one coffee. For legitimate volume some
day, LARA sells bulk data extracts through its official program; that is
the door, not scraping.

## The errand list (Brad, one coffee)

Search each, note resident agent + any officers from the latest annual
report, into the prospect row:

1. JR Automation Technologies LLC (need: a named engineering/IT contact path)
2. Behler-Young Company (verify the two-CEO roster oddity)
3. Feyen Zylstra LLC (named officer to pair with the modernization form)
4. Metal Flow Corporation (verify legal name before the letter)
5. Roskam Baking Company / Roskam Foods (which entity is current)
