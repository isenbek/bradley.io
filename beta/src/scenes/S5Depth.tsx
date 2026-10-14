// Scene 5, the depth (issue #7): Die Runner, ported from the main site's components/home/DieRunner.tsx (v1.0.453),
// same copy and the same two states. The console lives at tinymachines.ai/6502/games (games.tinymachines.ai/b/...
// 301s there); its CSP names https://bradley.io and https://beta.bradley.io in frame-ancestors for that path only
// (tinymachines/public deploy/tinymachines.ai.nginx, $tmapex_frame_ancestors).
import { Cap, PosterFrame, Stack } from "../components/bits";

// The console's own address, not games.tinymachines.ai/b/tinymachines/die-runner: that one 301s here without its query
// string, which would drop power=1. power=1 (tinymachines/6502 0d1002e) boots the cartridge as soon as it loads, so
// Boot is one press (live since 6502 v0.367, boarded on tinymachines.ai 1.0.270).
const CART = "https://tinymachines.ai/6502/games?cart=" + encodeURIComponent("https://tinymachines.ai/6502/api/v1/registry/b/tinymachines/roms/die-runner/cart") + "&power=1";

export function S5Depth() {
  return (
    <section className="bio-scene" id="depth" aria-labelledby="depth-h">
      <h2 id="depth-h">I understand the machine from the transistor up.</h2>
      <Cap beginner={<>A 1975 chip, rebuilt from a photograph, running a game in your browser.</>}
           builder={<>3,510 switches solved per half-cycle, matched to 3,000 recorded half-cycles.</>} />
      <PosterFrame src={CART} title="Die Runner, a game running on the switch-level MOS 6502" tag="Die Runner"
        lead="A 339-byte ROM on 3,510 switches." ratio="4 / 5"
        line="The screen is a page of the chip's memory. Every frame settles the real die over HTTP, so the frame rate is the round trip, and the page says so."
        button="Boot the console" off="Power off"
        note={<>Arrow keys steer. The gates you thread are pass transistors on the die, and which channel conducts is read off the chip running the game, one frame behind.</>} />
      <p className="bio-cap">No modelled CPU. Wires and switches, traced from a photograph of the die, and the behaviour falls out of them. The game is a 339-byte ROM, the screen is a page of the chip&rsquo;s memory, and every frame settles 3,510 switches for real.</p>
      <Stack tags={["Rust", "WASM", "switch-level simulation", "tinymachines.ai/6502"]} />
      <p className="bio-credit">Die photograph: <a href="http://www.visual6502.org/">visual6502.org</a>, CC BY-NC-SA 3.0. The game and the engine: tinymachines/6502.</p>
    </section>
  );
}
