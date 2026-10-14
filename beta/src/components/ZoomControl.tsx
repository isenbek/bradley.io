// The zoom control, top right of the header beside the Menu (issue #10). The kit's header has no slot for it, so it
// is portalled into the header's bar, just before the Menu button, once the header is on the page.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { setZoom, useZoom, ZOOMS } from "../lib/zoom";

export function ZoomControl() {
  const zoom = useZoom();
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".tc-head .tc-bar");
    const menu = bar?.querySelector(".menu-btn");
    if (!bar || !menu) return;
    const el = document.createElement("span");
    el.className = "bio-zoom-host";
    bar.insertBefore(el, menu);
    setHost(el);
    return () => { el.remove(); };
  }, []);
  if (!host) return null;
  return createPortal(
    <span className="bio-zoom seg" role="group" aria-label="How much detail">
      {ZOOMS.map((z) => (
        <button key={z.id} type="button" aria-pressed={zoom === z.id} title={z.hint} onClick={() => setZoom(z.id)}>{z.label}</button>
      ))}
    </span>,
    host,
  );
}
