// The zoom level (isenbek/bradley.io issue #10): how far each scene unfolds, for three readers on one page. Beginner
// (a business owner with a problem: plain words, one number a scene, exhibits as stills with a Play button) and
// Builder (a technical buyer or hiring manager: the stack tags, live exhibits, parts named, links to repos). Advanced
// comes later. Kept like the theme: per device, under the app's storage prefix, default Beginner, and written onto
// <html data-zoom> so CSS can key on it as well as components.
import { useSyncExternalStore } from "react";
import { key } from "@tinymachines/kit/app";

export type Zoom = "beginner" | "builder";
export const ZOOMS: { id: Zoom; label: string; hint: string }[] = [
  { id: "beginner", label: "Beginner", hint: "plain words, one number a scene" },
  { id: "builder", label: "Builder", hint: "the stack, the parts, the repos" },
];

const KEY = () => key("zoom");
const subs = new Set<() => void>();
let state: Zoom | null = null;

function read(): Zoom {
  if (state) return state;
  let v: string | null = null;
  try { v = localStorage.getItem(KEY()); } catch { /* no storage: the default */ }
  state = v === "builder" ? "builder" : "beginner";
  document.documentElement.dataset.zoom = state;
  return state;
}

export function setZoom(z: Zoom) {
  state = z;
  try { localStorage.setItem(KEY(), z); } catch { /* kept for this visit only */ }
  document.documentElement.dataset.zoom = z;
  subs.forEach((f) => f());
}

export function useZoom(): Zoom {
  return useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, read, () => "beginner");
}

/** The caption in force: `{ beginner, builder }`, either of which may be a node. */
export function useCaption<T>(c: { beginner: T; builder: T }): T {
  return c[useZoom()];
}
