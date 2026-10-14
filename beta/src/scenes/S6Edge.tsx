// Scene 6, the edge (issue #8): two exhibits side by side, stacked on phones, each a poster until pressed.
// Framing was checked on 14 Oct 2026: tinychase.com/lab/tf2 and /lab/astro send no X-Frame-Options and no
// frame-ancestors, so both frame from here with no server change. tinychase's cyclone transformer needs WebGPU; a
// browser without navigator.gpu gets the poster with a reason and a link out instead of a frame that cannot run.
import { useSyncExternalStore } from "react";
import { Cap, PosterFrame, Stack } from "../components/bits";

const hasGpu = () => typeof navigator !== "undefined" && "gpu" in navigator;
const useGpu = () => useSyncExternalStore(() => () => {}, hasGpu, () => true);

export function S6Edge() {
  const gpu = useGpu();
  return (
    <section className="bio-scene" id="edge" aria-labelledby="edge-h">
      <h2 id="edge-h">Models and pipelines that run where the data lives.</h2>
      <div className="bio-pair">
        <div>
          <h3>tinychase: a cyclone transformer on your GPU</h3>
          <PosterFrame src="https://tinychase.com/lab/tf2" title="tinychase: the cyclone transformer, running on this device's GPU" tag="tinychase"
            lead="555 KB, 23 WebGPU kernels, on your GPU."
            line="The data is read by byte range, with no query server between you and the files."
            button="Run it here" ratio="3 / 4"
            blocked={gpu ? null : { reason: "This needs a browser with WebGPU.", href: "https://tinychase.com/lab/tf2", link: "Open it on tinychase.com" }} />
          <Cap beginner={<>A hurricane model that runs on your own device, with nothing sent anywhere.</>}
               builder={<>555 KB with its 23 WebGPU kernels, runs on your GPU, data read by byte range with no query server.</>} />
        </div>
        <div>
          <h3>AstroStack: four frames, one sky</h3>
          <PosterFrame src="https://tinychase.com/lab/astro" title="AstroStack: phone frames of one sky, aligned and stacked in the browser" tag="AstroStack"
            lead="Phone frames of the same sky, aligned and summed."
            line="Night photographs of one patch of sky, stacked on your device. Nothing is uploaded."
            button="Open the stacker" ratio="3 / 4" />
          <Cap beginner={<>Night photos from a phone, combined into one cleaner picture, right in the browser.</>}
               builder={<>Phone frames of the same sky, aligned and summed in the browser: faint stars go from a signal to noise of 16.4 in the best single frame to 20.2 stacked. Rust/WASM and tinygrad.</>} />
        </div>
      </div>
      <Stack tags={["WebGPU", "Rust", "WASM", "tinygrad", "byte-range reads"]} />
    </section>
  );
}
