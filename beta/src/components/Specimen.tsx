// One specimen in the widget zoo (/zoo) or its widget bench (/zoo/widgets); from tinychase src/components/Specimen.tsx, 2026-10-14: the thing, live, on the
// page ground, its status, a note, and the markup that produced it. The markup is read back from the
// rendered DOM, so the code shown cannot drift from what is on screen. `html` renders a plain HTML
// string instead of React children: the skunkworks' web components are written that way.
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type Status = "shipped" | "draft" | "idea";

/** Tags on one line each, indented by depth: enough to read, never reformatting text. */
function pretty(html: string): string {
  let depth = 0;
  return html.replace(/></g, ">\n<").split("\n").map((line) => {
    if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
    const out = "  ".repeat(depth) + line;
    if (/^<[a-z][^>]*[^/]>$/i.test(line) && !/^<(img|input|br|hr|meta|link)\b/i.test(line) && !/<\/[a-z]+>$/i.test(line)) depth++;
    return out;
  }).join("\n");
}

export function Specimen({ id, title, status, note, used, children, markupOf, html }: {
  id: string; title: string; status: Status; note: string; used?: string; children?: React.ReactNode; markupOf?: string; html?: string;
}) {
  const demo = useRef<HTMLDivElement>(null);
  const [markup, setMarkup] = useState("");
  // Set once per string, never on re-render: React's dangerouslySetInnerHTML was found re-writing it
  // (2026-09-26), which swaps a live widget for a fresh copy. A layout effect, so the page's own
  // effects find the elements in place.
  useLayoutEffect(() => { if (html != null && demo.current) demo.current.innerHTML = html; }, [html]);
  // Read the markup back from the DOM, and again whenever it changes (live data arriving).
  useEffect(() => {
    const el = markupOf ? document.querySelector(markupOf) : demo.current;
    if (!el) return;
    const read = () => setMarkup(pretty(markupOf ? el.outerHTML : el.innerHTML));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { subtree: true, childList: true, attributes: true, characterData: true });
    return () => mo.disconnect();
  }, [markupOf]);
  return (
    <article className="zoo-spec" id={id}>
      <header>
        <h3>{title}</h3>
        <span className={`zoo-status ${status}`}>{status}</span>
      </header>
      <p className="zoo-note">{note}{used && <> <b>Used on:</b> {used}.</>}</p>
      {html != null ? <div className="zoo-demo" ref={demo} />
        : children && <div className="zoo-demo" ref={demo}>{children}</div>}
      <details className="zoo-code"><summary>Markup</summary><pre><code>{markup || "…"}</code></pre></details>
    </article>
  );
}

