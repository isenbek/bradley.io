"use client"

import { useState } from "react"
import { Play, Square } from "lucide-react"

/**
 * DieRunner: the console on the front page, booted by the reader.
 *
 * games.tinymachines.ai is a console on the transistor-level 6502: the game
 * is a 339-byte ROM, the screen is a page of the chip's memory, and every
 * frame is one round trip to 6502.tinymachines.ai/api, where 3,510 switches
 * settle for real. There is no emulator in the frame.
 *
 * It boots on a press, never on scroll. Three reasons, all measured upstream:
 * a frame is an HTTP request, so an idle console on a home page is a request
 * every 200 ms to the engine for nobody; the home page carries an LCP budget
 * (tests/perf-budget.spec.ts) and a third-party frame on the critical path
 * would spend it; and a game that starts while you are reading its caption is
 * a game arguing with you, the same rule the die plates follow.
 *
 * Until it is booted the frame is a poster drawn in the kit's own tokens: the
 * console's tag, the one fact that matters, and the button. The poster holds
 * the frame's final shape, so pressing it changes what is inside and not where
 * anything below it sits. "Power off" puts the poster back and drops the
 * iframe, which ends the request loop at once.
 *
 * The console page is a static document that reads its own path:
 * /b/<builder>/<slug> is the console with that cartridge already loaded.
 */

const CART = "https://games.tinymachines.ai/b/tinymachines/die-runner"

export function DieRunner() {
  const [on, setOn] = useState(false)

  return (
    <figure className="beta-runner">
      <div className="beta-runner__frame" data-on={on ? "" : undefined}>
        {on ? (
          <iframe
            src={CART}
            title="Die Runner, a game running on the switch-level MOS 6502"
            loading="eager"
            allow="fullscreen"
          />
        ) : (
          <div className="beta-runner__poster">
            <span className="beta-die__tag">Die Runner</span>
            <div className="beta-runner__poster-words">
              <b>A 339-byte ROM on 3,510 switches.</b>
              <span>
                The screen is a page of the chip&apos;s memory. Every frame settles the real die
                over HTTP, so the frame rate is the round trip, and the page says so.
              </span>
            </div>
            <button type="button" className="btn" onClick={() => setOn(true)}>
              <Play size={14} strokeWidth={2.4} aria-hidden="true" /> Boot the console
            </button>
          </div>
        )}
      </div>

      <figcaption className="beta-runner__caption">
        <span>
          Arrow keys steer. The gates you thread are pass transistors on the die, and which channel
          conducts is read off the chip running the game, one frame behind.
        </span>
        {on ? (
          <button type="button" className="btn btn-ghost" onClick={() => setOn(false)}>
            <Square size={12} strokeWidth={2.4} aria-hidden="true" /> Power off
          </button>
        ) : null}
      </figcaption>
    </figure>
  )
}
