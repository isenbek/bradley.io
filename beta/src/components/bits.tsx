// The small parts every scene uses: a provenance chip, a caption that follows the zoom, a Builder-only block, and the
// click-to-load frame. (The polling JSON reader is lib/json.ts.)
import { useState, type ReactNode } from "react";
import { ago } from "@tinymachines/kit/lib/ago";
import { useZoom } from "../lib/zoom";

/** Where a number was read from, and when. Every number on the page carries one. */
export function Chip({ from, at, href }: { from: string; at?: string | null; href?: string }) {
  const when = at ? (at.length > 10 ? `${ago(at)}` : `on ${new Date(at + "T12:00:00Z").toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`) : null;
  const body = <><span aria-hidden="true">▤</span> {from}{when ? <small> · read {when}</small> : null}</>;
  return href ? <a className="bio-chip" href={href}>{body}</a> : <span className="bio-chip">{body}</span>;
}

/** The caption for the reader's zoom level. */
export function Cap({ beginner, builder, as = "p", className = "bio-cap" }: { beginner: ReactNode; builder: ReactNode; as?: "p" | "span"; className?: string }) {
  const z = useZoom();
  const T = as;
  return <T className={className}>{z === "builder" ? builder : beginner}</T>;
}

/** Shown at Builder and above only. */
export function Builder({ children }: { children: ReactNode }) {
  return useZoom() === "builder" ? <>{children}</> : null;
}

/** Stack tags, shown at Builder only. */
export function Stack({ tags }: { tags: string[] }) {
  return <Builder><p className="bio-tags">{tags.map((t) => <span key={t} className="bio-tag">{t}</span>)}</p></Builder>;
}

/**
 * A frame that is a poster until the reader presses, then the page, then the poster again on "Turn off". Nothing in
 * it makes a request before the press. The poster holds the frame's final shape so nothing below moves. `blocked`
 * replaces the button with a reason and a link out (a browser without WebGPU, say).
 */
export function PosterFrame({ src, title, tag, lead, line, button, off = "Turn off", blocked, ratio = "4 / 3", note }: {
  src: string; title: string; tag: string; lead: string; line: string; button: string; off?: string;
  blocked?: { reason: string; href: string; link: string } | null; ratio?: string; note?: ReactNode;
}) {
  const [on, setOn] = useState(false);
  return (
    <figure className="bio-frame">
      <div className="bio-frame__box" style={{ aspectRatio: ratio }} data-on={on ? "" : undefined}>
        {on ? (
          <iframe src={src} title={title} loading="eager" allow="fullscreen" />
        ) : (
          <div className="bio-frame__poster">
            <span className="bio-frame__tag">{tag}</span>
            <div className="bio-frame__words"><b>{lead}</b><span>{line}</span></div>
            {blocked
              ? <p className="bio-frame__blocked">{blocked.reason} <a href={blocked.href}>{blocked.link}</a></p>
              : <button type="button" className="btn" onClick={() => setOn(true)}><span aria-hidden="true">▶</span> {button}</button>}
          </div>
        )}
      </div>
      <figcaption className="bio-frame__cap">
        <span>{note}</span>
        {on ? <button type="button" className="btn quiet" onClick={() => setOn(false)}><span aria-hidden="true">■</span> {off}</button> : null}
      </figcaption>
    </figure>
  );
}
