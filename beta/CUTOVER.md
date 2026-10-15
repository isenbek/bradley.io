# Cutover: when beta.bradley.io becomes bradley.io

Nothing here changes until Bradley decides the beta replaces the main site. This is the list, so the cutover is a
checklist and not an archaeology (isenbek/bradley.io #11, 2026-10-14). Each line names the file and what flips.

## What flips

1. **Search engines.** `beta/index.html` carries `<meta name="robots" content="noindex, follow">`, and every page in
   `beta/src/app.config.ts` says `index: false`. Remove the meta, set `index: true` on the public pages (Home,
   Contact, and whatever is ported). `beta/public/robots.txt` is already open (`Allow: /`, `Disallow: /api/`); keep it.
2. **The site's own address.** `beta/src/app.config.ts` `site: "https://beta.bradley.io"` becomes
   `"https://bradley.io"`; it feeds canonical URLs, share links, the manifest and `/seo.json`.
3. **The `/api` proxy direction.** Today beta's nginx sends `/api/v1/` to the kit's shared account service (`:8120`) and the rest of
   `/api/` to the Next site (`:32221`) for `/api/now` and `/api/fleet-up`. After cutover the Next site keeps running
   on `:32221` for those handlers (or they are ported), and the bradley.io vhost gets the beta's `/api/v1/` and
   `/api/` blocks from `beta/deploy/beta.bradley.io.nginx`.
4. **`MAIN` in the scenes.** `beta/src/scenes/S1Door.tsx` and `S7to10.tsx` link to `https://bradley.io` for the
   instruments, `/bench`, `/work` and `/resume`. Once the beta is bradley.io those pages must be ported or moved
   (say to `old.bradley.io`), and `MAIN` points wherever they went.
5. **nginx server names.** `/etc/nginx/sites-enabled/beta.bradley.io.nginx` (template `beta/deploy/`) serves
   `beta.bradley.io` from `/var/www/beta.bradley.io`. At cutover the `bradley.io` and `www` server blocks point their
   `root` at the beta's web root (or the beta deploys to a new `/var/www/bradley.io`), with the certificate for
   bradley.io; `beta.bradley.io` 301s to `bradley.io`. The Next service keeps its port for the `/api` handlers above.
6. **The sign-in service.** Sign-in is the kit's shared account service (kit-accounts, accounts.tinymachines.ai,
   since 2026-10-14); passkeys are made for tinymachines.ai, so the beta's work on bradley.io unchanged. Add the
   origin to the beta's site: `python -m accounts site set beta --origin https://bradley.io --origin
   https://beta.bradley.io` (kit `docs/accounts.md`), so bradley.io's requests and passkey ceremonies are its.
7. **Frames that name the origin.** tinymachines.ai's `$tmapex_frame_ancestors` (tinymachines/public
   `deploy/tinymachines.ai.nginx`) lists both `https://bradley.io` and `https://beta.bradley.io`; drop the beta one
   once it only redirects.
8. **The main site's redirects.** `next.config.mjs` generates about 310 redirects for retired addresses; any that
   still matter move to the beta's nginx, or the old addresses 404.

## Checks after cutover

- `beta/scripts/check.sh` against `https://bradley.io` (`bun run scripts/check-site.ts https://bradley.io`).
- `scripts/check-die-runner-embed.sh https://bradley.io` passes.
- Google Search Console: the sitemap, and that the old addresses redirect rather than 404.
