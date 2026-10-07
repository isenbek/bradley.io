/**
 * The Meatball Labs family strip, for the footer.
 *
 * Meatball Labs is the parent of a small family of sites. Each carries this
 * same row of nine dots, its own marked, so the sites read as related without
 * sharing a logo (the rule is the family's style guide,
 * meatball.ai/styleguide.html). The look is the kit's `.family` component and
 * the colours are its `--color-family-*` tokens; this file only says which
 * dots are sites, where they live, and which one is this site.
 *
 * The list of sites is not written here. It comes from the family registry
 * (meatball-labs/family/family.json), copied in as ./family-data.ts by
 * scripts/sync-family.sh, so this footer, meatball.ai's and sysforge.ai's
 * cannot disagree about who is in the family.
 *
 * After the nine muted dots come the five of the electric set (brand library,
 * 2026-10-07): sites that live on a dark screen hold no muted hue, and their
 * dot is their hue's core tone. The kit has no token for those, so the colour
 * comes from the registry as data, the same hex meatball.ai's family.css uses.
 */

import { ELECTRIC, FAMILY, FAMILY_LABEL, type FamilyHue } from "./family-data"

export function Family({ me }: { me: FamilyHue }) {
  return (
    <nav className="family" aria-label={FAMILY_LABEL}>
      {FAMILY.map((f) => {
        if (f.hue === me) {
          return (
            <span
              key={f.hue}
              className="family-dot is-me"
              data-hue={f.hue}
              aria-current="page"
              title={`${f.name} (you are here)`}
            />
          );
        }
        if (f.href && f.name) {
          return (
            <a
              key={f.hue}
              className="family-dot"
              data-hue={f.hue}
              href={f.href}
              aria-label={f.name}
              title={f.name}
            />
          );
        }
        // A reserved hue: a site that is not answering yet. Named, not linked,
        // the same as the static sites draw it (meatball-labs/family/build.py).
        if (f.reserved && f.name) {
          return (
            <span
              key={f.hue}
              className="family-dot"
              data-hue={f.hue}
              role="img"
              aria-label={`${f.name}, coming`}
              title={`${f.name} (coming)`}
            />
          );
        }
        return <span key={f.hue} className="family-dot" data-hue={f.hue} aria-hidden="true" />;
      })}
      {ELECTRIC.map((e) => {
        const style = { background: e.tones.core }
        if (e.href && e.who) {
          return (
            <a key={e.id} className="family-dot" data-electric={e.id} style={style} href={e.href} aria-label={e.who} title={e.who} />
          );
        }
        if (e.reserved && e.who) {
          return (
            <span key={e.id} className="family-dot" data-electric={e.id} style={style} role="img" aria-label={`${e.who}, coming`} title={`${e.who} (coming)`} />
          );
        }
        return <span key={e.id} className="family-dot" data-electric={e.id} style={style} aria-hidden="true" />;
      })}
    </nav>
  );
}
