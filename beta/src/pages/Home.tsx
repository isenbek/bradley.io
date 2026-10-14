// The front door, for now: what this is and where the pieces are. The content arrives through GitHub issues on
// isenbek/bradley.io; until then the page says so plainly rather than inventing any.
import { onLink } from "@tinymachines/kit/lib/router";
import { ShareButton } from "@tinymachines/kit/components/ShareButton";
import { current, isDark, useTheme } from "@tinymachines/kit/lib/theme";
import { app } from "@tinymachines/kit/app";
import { useActivity } from "../activity";

export default function Home() {
  useTheme();
  const mark = isDark(current()) && app().logoDark ? app().logoDark : app().logo;
  const act = useActivity();
  const total = act ? act.days.reduce((a, d) => a + d.v, 0) : null;
  return (
    <article className="bio-home">
      <p className="kicker">bradley.io · <b>beta</b></p>
      <div className="bio-hero">
        <img src={mark} alt="" width={120} height={120} className="bio-mark" />
        <div>
          <h1>bradley.io</h1>
          <p className="lede">The simplified bradley.io, rebuilt as an app on the tinymachines kit: installable, offline, large type, high contrast, and every number read from somewhere real. This is the shell. The content arrives page by page, and the full site stays at <a href="https://bradley.io">bradley.io</a> until it does.</p>
        </div>
      </div>
      <p className="controls">
        <a className="btn" href="https://bradley.io">The full site</a>
        <a className="btn quiet" href="/zoo" onClick={onLink}>The widget zoo</a>
        <a className="btn quiet" href="/theme" onClick={onLink}>Themes</a>
        <ShareButton label="Share" />
      </p>

      <section className="panel bio-sec">
        <h2>What is here so far</h2>
        <dl className="bio-kv">
          <dt>The frame</dt><dd>The kit's header and Menu, the footer with the build, install and offline, sharing with a QR code.</dd>
          <dt>Two themes</dt><dd>Datasheet (warm paper and ink, the site's own) and Instrument (the panel). Both from bradley.io's colours, both checked for contrast. <a href="/theme" onClick={onLink}>Pick one.</a></dd>
          <dt>The kit, working</dt><dd><a href="/zoo" onClick={onLink}>Every component</a>, <a href="/zoo/widgets" onClick={onLink}>the widget bench</a>, <a href="/sensors" onClick={onLink}>sensors</a> and <a href="/account" onClick={onLink}>passkey sign-in</a>, as on tinykit.tinymachines.ai.</dd>
          <dt>Next</dt><dd>The pages themselves, one GitHub issue at a time.</dd>
        </dl>
      </section>

      <p className="src">Built from the bradley.io repository (<code>beta/</code>) on <code>@tinymachines/kit</code>{act?.repos.kit?.tag ? ` ${act.repos.kit.tag}` : ""}.{total !== null ? ` ${total.toLocaleString("en-US")} commits in the last 60 days across bradley.io and the kit, read from their git logs at build time.` : ""}</p>
    </article>
  );
}
