"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from "react"
import {
  About,
  Bench,
  Cmd,
  COMMAND_WORDS,
  Contact,
  Education,
  Experience,
  FILES,
  Help,
  History,
  Ls,
  NotFound,
  Now,
  PHOSPHORS,
  Ping,
  PingUsage,
  pingTarget,
  Projects,
  resolveCommand,
  Resume,
  RunContext,
  SelfTest,
  Skills,
  Stats,
  Uptime,
  utcStamp,
  Whoami,
  Work,
  type Phosphor,
} from "./commands"
import { MatrixRain, matrixStill } from "./Matrix"
import { RUN_EVENT } from "./RunWord"
import type { TermData } from "./types"
import {
  dial,
  isCanned,
  isScripted,
  MAX_LINE,
  REPLY_TIMEOUT_MS,
  teletype,
  WOPR_MODEL,
  woprEndpoint,
  type WoprDown,
  type WoprLink,
  type WoprMessage,
} from "./wopr"

/**
 * The terminal: a prompt, a transcript, and three modes.
 *
 *   shell     commands from ./commands.tsx, printed from data the server
 *             assembled (./load.ts) or asked of /api/now when typed
 *   dialling  `wopr` was typed and the socket has not answered yet
 *   wopr      every line goes to wargames-server.js until the line drops
 *
 * KEYBOARD. There is one real <input>, laid invisibly over the prompt line so
 * a tap or a click on the line focuses it the way any text field is focused
 * (which is what brings up a phone keyboard), and its text is at 16px so iOS
 * does not zoom the page to it. What you see is a mirror of that input with a
 * block cursor drawn at the real caret position, so the left and right arrows,
 * Home, End, paste and a phone's cursor handle all behave. Enter is a form
 * submit, not a keydown, because a phone keyboard's Go key is only reliably
 * the former.
 *
 *   Up, Down     history, with the line you were typing kept as the last entry
 *   Tab          complete a command or its argument; lists the candidates when
 *                there are several. On an empty line, or one with nothing to
 *                complete, Tab is left alone, so the keyboard can still leave
 *                the terminal.
 *   Ctrl+L       clear        Ctrl+U  erase the line
 *   Ctrl+C, Esc  drop the WOPR line, stop the rain, or abandon the line
 *
 * FOCUS. On a machine with a mouse the prompt takes focus on load (without
 * scrolling the page to it). On a touch device it does not, because that
 * would open the keyboard over a page nobody has read yet. Clicking anywhere
 * on the glass focuses the prompt unless the click was on a link or a
 * command, or finished a text selection.
 *
 * NOTHING IS FAKED. A command that needs the network says "asking", then
 * prints the answer or says there was none. WOPR either connects or is
 * reported as down. See ./wopr.ts for the two rules that mode follows.
 */

type Mode = "shell" | "dialling" | "wopr"

interface Entry {
  id: number
  /** The prompt the line was typed at. Null for output nobody typed for. */
  prompt: string | null
  input: string
  output: ReactNode
}

const SHELL_PROMPT = "bradley@io:~$"
const WOPR_PROMPT = ">"
const MAX_ENTRIES = 300
const PHOSPHOR_KEY = "term-phosphor"
/** Air kept between the monitor and the page's fixed chrome, in px. */
const REVEAL_GAP = 8

const SHELL_KEYS = ["help", "about", "now", "projects", "work", "stats", "wopr"]
const WOPR_KEYS = ["help", "status", "run simulation", "joshua", "logout"]

/* The original terminal's banner (git show 63d43d0:app/terminal/page.tsx). */
const BANNER = `██████╗ ██████╗  █████╗ ██████╗ ██╗     ███████╗██╗   ██╗   ██╗ ██████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║     ██╔════╝╚██╗ ██╔╝   ██║██╔═══██╗
██████╔╝██████╔╝███████║██║  ██║██║     █████╗   ╚████╔╝    ██║██║   ██║
██╔══██╗██╔══██╗██╔══██║██║  ██║██║     ██╔══╝    ╚██╔╝     ██║██║   ██║
██████╔╝██║  ██║██║  ██║██████╔╝███████╗███████╗   ██║   ██╗██║╚██████╔╝
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝ ╚═════╝`

/* The original WOPR page's (git show 63d43d0:app/wargames/page.tsx). */
const WOPR_BANNER = `██╗    ██╗ ██████╗ ██████╗ ██████╗
██║    ██║██╔═══██╗██╔══██╗██╔══██╗
██║ █╗ ██║██║   ██║██████╔╝██████╔╝
██║███╗██║██║   ██║██╔═══╝ ██╔══██╗
╚███╔███╔╝╚██████╔╝██║     ██║  ██║
 ╚══╝╚══╝  ╚═════╝ ╚═╝     ╚═╝  ╚═╝`

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function finePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

/** The longest prefix every candidate shares. */
function commonPrefix(words: string[]): string {
  if (words.length === 0) return ""
  let p = words[0]
  for (const w of words) {
    while (!w.startsWith(p)) p = p.slice(0, -1)
  }
  return p
}

/**
 * A reply, typed out. The original WOPR page typed at 30 ms a character; this
 * keeps that pace for a short line and speeds up so that no reply takes more
 * than about five seconds. With reduced motion the text is simply there.
 * A screen reader gets the whole line once, not a character at a time.
 */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(() => (reducedMotion() ? text.length : 0))

  useEffect(() => {
    if (reducedMotion()) return
    const step = Math.max(1, Math.ceil(text.length / 170))
    const timer = setInterval(() => {
      setN((v) => {
        if (v + step >= text.length) clearInterval(timer)
        return Math.min(text.length, v + step)
      })
    }, 30)
    return () => clearInterval(timer)
  }, [text])

  return (
    <>
      <span aria-hidden="true">
        {text.slice(0, n)}
        {n < text.length ? <span className="term__cursor term__cursor--typing"> </span> : null}
      </span>
      <span className="term__sr">{text}</span>
    </>
  )
}

function Welcome({ data }: { data: TermData }) {
  return (
    <div className="term__entry">
      <pre className="term__banner" aria-hidden="true">
        {BANNER}
      </pre>
      <div className="term__accent">Welcome to the bradley.io interactive terminal.</div>
      <div className="term__mute">
        build {data.build.version} · {data.build.commit} · {utcStamp(data.build.built)}
      </div>
      <div className="term__mute">
        Type <Cmd c="help" /> to see available commands, or tap one under the screen.
      </div>
      <SelfTest />
    </div>
  )
}

export function V3Terminal({ data }: { data: TermData }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [welcome, setWelcome] = useState(true)
  const [input, setInput] = useState("")
  const [caret, setCaret] = useState(0)
  const [focused, setFocused] = useState(false)
  const [mode, setMode] = useState<Mode>("shell")
  const [waitingSince, setWaitingSince] = useState<number | null>(null)
  const [waited, setWaited] = useState(0)
  const [rain, setRain] = useState(false)
  const [phosphor, setPhosphor] = useState<Phosphor>("blue")
  /** True while there is output under the bottom edge of the glass. */
  const [below, setBelow] = useState(false)
  /**
   * False until the first command. The glass starts as tall as its boot text,
   * so the soft keys are in sight on a laptop, and goes to its full height the
   * first time somebody runs anything, so later answers do not move the page.
   */
  const [opened, setOpened] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const termRef = useRef<HTMLDivElement>(null)
  const tubeRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const nextId = useRef(0)
  const history = useRef<string[]>([])
  const hIdx = useRef(-1)
  const draft = useRef("")
  const lastTab = useRef("")

  const link = useRef<WoprLink | null>(null)
  const modeRef = useRef<Mode>("shell")
  const waiting = useRef(false)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Scripted "wopr" lines still on their way, which must not end a wait for the model. */
  const scriptedDue = useRef(0)
  const saidLogout = useRef(false)

  // ---- The transcript -------------------------------------------------------

  const append = useCallback((prompt: string | null, typed: string, output: ReactNode) => {
    setEntries((e) => {
      const next = [...e, { id: ++nextId.current, prompt, input: typed, output }]
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next
    })
  }, [])

  const setLine = useCallback((value: string) => {
    setInput(value)
    setCaret(value.length)
    requestAnimationFrame(() => {
      const el = inputRef.current
      // Only if the line is still the one that was set. Somebody who types
      // straight after Enter has already moved on, and putting the caret back
      // would shuffle their letters.
      if (el && document.activeElement === el && el.value === value) {
        el.setSelectionRange(value.length, value.length)
      }
    })
  }, [])

  const switchMode = useCallback((m: Mode) => {
    modeRef.current = m
    setMode(m)
  }, [])

  /** Whether there is output under the bottom edge, for the "more below" key. */
  const measure = useCallback(() => {
    const s = screenRef.current
    if (!s) return
    setBelow(s.scrollHeight - s.scrollTop - s.clientHeight > 4)
  }, [])

  /**
   * Keep the newest output in view. An answer shorter than the glass sits at
   * the bottom, like any terminal. One taller than the glass is scrolled so
   * its own command line is at the top, because the start of a long answer is
   * where reading begins and a terminal that jumps to the end hides it.
   *
   * The prompt is then somewhere under that answer. If the bottom edge of the
   * glass would cut the prompt line in half, the glass stops just above it
   * instead, so the prompt is either whole or not shown, and the "more below"
   * key says there is more.
   */
  const pin = useCallback(() => {
    const s = screenRef.current
    if (!s) return
    const last = s.querySelector<HTMLElement>('[data-last="true"]')
    if (!last) {
      // Nothing typed yet: the boot text reads from the top. On a short
      // screen the prompt is under it, and "more below" says so.
      s.scrollTop = 0
    } else if (last.offsetHeight > s.clientHeight - 56) {
      let top = last.offsetTop - 8
      const form = formRef.current
      if (form) {
        const edge = top + s.clientHeight
        if (edge > form.offsetTop && edge < form.offsetTop + form.offsetHeight + 2) {
          // Clear of the cursor's glow as well as the line itself.
          top = form.offsetTop - s.clientHeight - 10
        }
      }
      s.scrollTop = top
    } else {
      s.scrollTop = s.scrollHeight
    }
    measure()
  }, [measure])

  const toBottom = useCallback(() => {
    const s = screenRef.current
    if (!s) return
    s.scrollTop = s.scrollHeight
    measure()
    inputRef.current?.focus({ preventScroll: true })
  }, [measure])

  useLayoutEffect(() => {
    pin()
  }, [entries, mode, waitingSince, pin])

  useEffect(() => {
    const body = bodyRef.current
    if (!body || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => pin())
    ro.observe(body)
    return () => ro.disconnect()
  }, [pin])

  /**
   * Bring the monitor into the window when somebody runs a command. The page
   * has a footer fixed to the bottom of the window, and the prompt is the last
   * line of the glass: on a laptop it would otherwise sit behind the footer
   * and the answer would be typed blind. The glass is sized in terminal.css to
   * fit above the footer, so this is one jump, the first time, and nothing
   * after. It is never called for output that arrives on its own (a reply, an
   * answer from /api/now), so it cannot pull the page out from under somebody
   * reading further down.
   *
   * The page's chrome is measured, not assumed: the footer counts only while
   * it is fixed, and the masthead only if it is still covering the monitor
   * once the page has moved.
   */
  const reveal = useCallback(() => {
    const term = termRef.current
    const tube = tubeRef.current
    if (!term || !tube) return
    const foot = document.querySelector<HTMLElement>(".app-foot")
    const footFixed = foot ? getComputedStyle(foot).position === "fixed" : false
    // With a phone keyboard up, the bottom of what can be seen is the top of
    // the keyboard, and the footer is underneath it.
    const vv = window.visualViewport
    const keyboard = vv ? window.innerHeight - vv.height > 120 : false
    const floor =
      keyboard && vv
        ? vv.offsetTop + vv.height
        : footFixed && foot
          ? foot.getBoundingClientRect().top
          : window.innerHeight
    const bottom = floor - REVEAL_GAP
    const room = bottom - REVEAL_GAP
    // The whole monitor if it fits; otherwise the glass, and its last line first.
    const fits = term.getBoundingClientRect().height <= room
    const target = fits ? term : tube
    const box = target.getBoundingClientRect()
    let dy = 0
    if (box.height > room || box.bottom > bottom) dy = box.bottom - bottom
    else if (box.top < REVEAL_GAP) dy = box.top - REVEAL_GAP
    if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: "instant" })

    // A masthead that stays docked would now be lying over the top of the
    // monitor. Give it its height back if there is room below to do so.
    const head = document.querySelector<HTMLElement>(".app-head")
    if (!head) return
    const cover = head.getBoundingClientRect().bottom + REVEAL_GAP - target.getBoundingClientRect().top
    const slack = bottom - target.getBoundingClientRect().bottom
    if (cover > 1 && slack >= cover) window.scrollBy({ top: -cover, behavior: "instant" })
  }, [])

  // ---- Mount ----------------------------------------------------------------

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PHOSPHOR_KEY)
      if (saved && (PHOSPHORS as readonly string[]).includes(saved)) setPhosphor(saved as Phosphor)
    } catch {
      /* Private window or blocked storage: the default phosphor is fine. */
    }
    if (finePointer()) inputRef.current?.focus({ preventScroll: true })
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current)
      link.current?.hangup()
    }
  }, [])

  useEffect(() => {
    if (waitingSince === null) return
    const timer = setInterval(() => setWaited(Math.floor((Date.now() - waitingSince) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [waitingSince])

  // ---- WOPR -----------------------------------------------------------------

  const stopWaiting = useCallback(() => {
    waiting.current = false
    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = null
    setWaitingSince(null)
    setWaited(0)
  }, [])

  const onWoprMessage = useCallback(
    (m: WoprMessage) => {
      if (m.type === "system") {
        // The console around the machine (LOGON, the games list, the status
        // report). Not attention: nothing has gone wrong.
        append(null, "", <div className="term__out term__mute term__pre">{m.text}</div>)
        return
      }
      if (isCanned(m.text)) {
        stopWaiting()
        append(
          null,
          "",
          <div className="term__out term__warn">
            [MODEL OFFLINE] The server could not reach its local model and sent a stock line in its
            place. That is not a reply, so it is not printed. The scripted commands still work:{" "}
            <Cmd c="help" />.
          </div>,
        )
        return
      }
      if (scriptedDue.current > 0) scriptedDue.current -= 1
      else stopWaiting()
      const said = teletype(m.text)
      if (!said) {
        append(
          null,
          "",
          <div className="term__out term__warn">
            [EMPTY REPLY] The model answered, and there was nothing in it to print.
          </div>,
        )
        return
      }
      append(
        null,
        "",
        <div className="term__out term__wopr term__pre">
          <Typed text={said} />
        </div>,
      )
    },
    [append, stopWaiting],
  )

  const onWoprDown = useCallback(
    (why: WoprDown, host: string) => {
      const wasUp = modeRef.current === "wopr"
      link.current = null
      stopWaiting()
      switchMode("shell")
      if (why === "no-answer" || why === "no-client") {
        append(
          null,
          "",
          <div className="term__out">
            <div className="term__warn">
              [OFFLINE] NO CARRIER.{" "}
              {why === "no-client"
                ? "The socket client did not load, so the call was never placed."
                : `WOPR did not answer at ${host}.`}
            </div>
            <div className="term__mute">
              It is a real server on this box, and when it is down there is no one to play. Nothing
              here is simulated.
            </div>
            <div className="term__mute">
              &ldquo;A strange game. The only winning move is not to play.&rdquo; (WarGames, 1983)
            </div>
          </div>,
        )
        return
      }
      if (why === "hangup" && !wasUp) {
        append(null, "", <div className="term__out term__mute">Hung up before WOPR answered.</div>)
        return
      }
      const unasked = why === "dropped" && !saidLogout.current
      append(
        null,
        "",
        <div className={`term__out ${unasked ? "term__warn" : "term__mute"}`}>
          CONNECTION TERMINATED
          {unasked ? ". The far end closed the line." : null}
        </div>,
      )
    },
    [append, stopWaiting, switchMode],
  )

  const startWopr = useCallback(
    (raw: string, backdoor: boolean) => {
      const { host } = woprEndpoint()
      append(SHELL_PROMPT, raw, <div className="term__out term__mute">DIALLING {host} ...</div>)
      switchMode("dialling")
      saidLogout.current = false
      // The server greets with two typed lines; neither is the model.
      scriptedDue.current = 2
      const l: WoprLink = dial({
        onUp: () => {
          switchMode("wopr")
          append(
            null,
            "",
            <div className="term__out">
              <pre className="term__banner term__banner--wopr" aria-hidden="true">
                {WOPR_BANNER}
              </pre>
              <div className="term__accent">WAR OPERATION PLAN RESPONSE · link up to {host}</div>
              <div className="term__mute">
                A homage to WarGames (1983), and a real server on this box. Its set pieces are
                scripted. Anything else you type is answered by a local model ({WOPR_MODEL} on
                Ollama); nothing goes to a cloud.
              </div>
              <div className="term__mute">
                <Cmd c="help" /> lists the games. <Cmd c="logout" /> hangs up.
              </div>
            </div>,
          )
          if (backdoor) {
            // `joshua` at the shell is the film's back door: dial, let the
            // greeting finish, then say the password.
            setTimeout(() => {
              if (link.current !== l) return
              scriptedDue.current += 1
              append(WOPR_PROMPT, "joshua", null)
              l.send("joshua")
            }, 3600)
          }
        },
        onMessage: onWoprMessage,
        onDown: (why) => {
          if (link.current === l) onWoprDown(why, host)
        },
      })
      link.current = l
    },
    [append, onWoprDown, onWoprMessage, switchMode],
  )

  const sayToWopr = useCallback(
    (raw: string) => {
      const text = raw.trim()
      const l = link.current
      if (!text || !l) {
        append(WOPR_PROMPT, "", null)
        return
      }
      history.current.push(text)
      if (text.toLowerCase() === "clear") {
        setEntries([])
        setWelcome(false)
        return
      }
      const scripted = isScripted(text)
      if (!scripted && waiting.current) {
        append(
          WOPR_PROMPT,
          text,
          <div className="term__out term__mute">
            One question at a time. Still waiting on the model for the last one.
          </div>,
        )
        return
      }
      append(WOPR_PROMPT, text, null)
      l.send(text)

      const lower = text.toLowerCase()
      if (!scripted) {
        waiting.current = true
        setWaited(0)
        setWaitingSince(Date.now())
        replyTimer.current = setTimeout(() => {
          if (!waiting.current) return
          stopWaiting()
          append(
            null,
            "",
            <div className="term__out term__warn">
              [NO REPLY] {REPLY_TIMEOUT_MS / 1000} s and nothing from the model. The line is up; the
              model behind it ({WOPR_MODEL}) is not answering, or is still loading. If it answers
              late, the reply will appear here. The scripted commands work without it:{" "}
              <Cmd c="status" />, <Cmd c="run simulation" />.
            </div>,
          )
        }, REPLY_TIMEOUT_MS)
        return
      }
      if (lower === "joshua" || lower === "run simulation" || lower.includes("global thermonuclear war")) {
        scriptedDue.current += 1
      }
      if (lower === "logout" || lower === "exit") {
        saidLogout.current = true
        // The server says goodbye and closes the line a second later. If it
        // does not, this end does.
        setTimeout(() => {
          if (link.current === l) l.hangup()
        }, 4000)
      }
    },
    [append, stopWaiting],
  )

  // ---- The shell ------------------------------------------------------------

  const runShell = useCallback(
    (raw: string) => {
      const text = raw.trim()
      if (!text) {
        append(SHELL_PROMPT, "", null)
        return
      }
      if (history.current[history.current.length - 1] !== text) history.current.push(text)

      const parts = text.split(/\s+/)
      const word = parts[0].toLowerCase()
      const arg = (parts[1] ?? "").toLowerCase()
      const name = resolveCommand(word)?.name ?? word
      const out = (node: ReactNode) => append(SHELL_PROMPT, text, node)

      switch (name) {
        case "help":
          return out(<Help />)
        case "about":
          return out(<About data={data} />)
        case "skills":
          return out(<Skills data={data} />)
        case "experience":
          return out(<Experience data={data} all={arg === "all" || arg === "--all" || arg === "-a"} />)
        case "education":
          return out(<Education data={data} />)
        case "contact":
          return out(<Contact />)
        case "projects":
          return out(<Projects />)
        case "work":
          return out(<Work data={data} />)
        case "stats":
          return out(<Stats data={data} />)
        case "now":
          return out(<Now />)
        case "bench":
          return out(<Bench data={data} />)
        case "uptime":
          return out(<Uptime data={data} at={Date.now()} />)
        case "ping": {
          if (!arg) return out(<PingUsage />)
          const id = pingTarget(arg)
          return out(id ? <Ping id={id} typed={arg} /> : <PingUsage unknown={arg} />)
        }
        case "resume": {
          const pdf = arg === "pdf" || arg === "--pdf"
          window.open(pdf ? data.resume.pdf : "/resume", "_blank", "noopener")
          return out(<Resume data={data} pdf={pdf} />)
        }
        case "github":
          window.open("https://github.com/isenbek", "_blank", "noopener")
          return out(
            <div className="term__out term__mute">
              Opening{" "}
              <a className="term__a" href="https://github.com/isenbek" target="_blank" rel="noopener noreferrer">
                github.com/isenbek
              </a>{" "}
              in a new tab.
            </div>,
          )
        case "ls":
          return out(<Ls />)
        case "whoami":
          return out(<Whoami />)
        case "history":
          return out(<History lines={[...history.current]} />)
        case "cat": {
          const file = FILES.find((f) => f.toLowerCase() === arg)
          if (file === "about.txt") return out(<About data={data} />)
          if (file === "contact.txt") return out(<Contact />)
          if (file === "README.md") return out(<Help />)
          if (file === "resume.pdf") {
            return out(
              <div className="term__out term__mute">
                Binary file. <Cmd c="resume" /> opens the page, <Cmd c="resume pdf" /> the PDF.
              </div>,
            )
          }
          return out(
            <div className="term__out term__mute">
              cat: {parts[1] || "missing file name"}: no such file. <Cmd c="ls" /> shows what is here.
            </div>,
          )
        }
        case "clear":
          setEntries([])
          setWelcome(false)
          return
        case "date":
          return out(<div className="term__out term__bright">{utcStamp(new Date().toISOString())}</div>)
        case "theme": {
          if (!(PHOSPHORS as readonly string[]).includes(arg)) {
            return out(
              <div className="term__out term__mute">
                {arg ? `theme: ${arg}: no such phosphor. ` : `The phosphor is ${phosphor}. `}Choose:{" "}
                <span className="term__inline term__inline--tight">
                  {PHOSPHORS.map((p) => (
                    <Cmd key={p} c={`theme ${p}`}>
                      {p}
                    </Cmd>
                  ))}
                </span>
              </div>,
            )
          }
          setPhosphor(arg as Phosphor)
          try {
            window.localStorage.setItem(PHOSPHOR_KEY, arg)
          } catch {
            /* Storage unavailable: the colour still changes for this visit. */
          }
          return out(<div className="term__out term__mute">Phosphor: {arg}.</div>)
        }
        case "matrix": {
          if (reducedMotion()) {
            return out(
              <div className="term__out">
                <div className="term__mute">
                  Entering the matrix... Your device asks for reduced motion, so the rain stands
                  still:
                </div>
                <div className="term__accent term__pre term__still" aria-hidden="true">
                  {matrixStill()}
                </div>
              </div>,
            )
          }
          setRain(true)
          return out(<div className="term__out term__mute">Entering the matrix...</div>)
        }
        case "wopr":
          return startWopr(text, word === "joshua")
        case "sudo":
          return out(
            <div className="term__out term__mute">
              bradley is not in the sudoers file. This incident will be reported.
            </div>,
          )
        case "exit":
        case "logout":
        case "quit":
          return out(
            <div className="term__out term__mute">
              There is nothing to log out of: this is a web page. The menu is at the top.
            </div>,
          )
        default:
          return out(<NotFound word={parts[0]} />)
      }
    },
    [append, data, phosphor, startWopr],
  )

  /** Run a line in whatever mode the terminal is in. */
  const submit = useCallback(
    (raw: string) => {
      hIdx.current = -1
      draft.current = ""
      lastTab.current = ""
      if (modeRef.current === "dialling") {
        append(
          null,
          "",
          <div className="term__out term__mute">
            Still dialling, so that line went nowhere. <kbd className="term__kbd">Esc</kbd> cancels the call.
          </div>,
        )
        return
      }
      if (modeRef.current === "wopr") sayToWopr(raw)
      else runShell(raw)
    },
    [append, runShell, sayToWopr],
  )

  // Commands printed in the transcript are buttons that run themselves. They
  // were rendered when their entry was made, so they call through a ref to
  // reach the terminal as it is now, not as it was then.
  const submitRef = useRef(submit)
  useEffect(() => {
    submitRef.current = submit
  }, [submit])
  /** Open the glass to its full height, then bring the monitor into view. */
  const openAndReveal = useCallback(() => {
    setOpened(true)
    // The taller glass is laid out by the next frame; measure it then.
    requestAnimationFrame(() => reveal())
  }, [reveal])

  const tap = useCallback(
    (command: string) => {
      setRain(false)
      setLine("")
      submitRef.current(command)
      if (finePointer()) inputRef.current?.focus({ preventScroll: true })
      openAndReveal()
    },
    [openAndReveal, setLine],
  )

  // The words on the paper under the monitor are buttons too (./RunWord.tsx).
  // They live outside this component, so they ask by event.
  useEffect(() => {
    const onRun = (e: Event) => {
      const c = (e as CustomEvent<unknown>).detail
      if (typeof c === "string" && c) tap(c)
    }
    window.addEventListener(RUN_EVENT, onRun)
    return () => window.removeEventListener(RUN_EVENT, onRun)
  }, [tap])

  // ---- Keys -----------------------------------------------------------------

  function hangUp() {
    link.current?.hangup()
  }

  function complete() {
    const before = input.slice(0, caret)
    if (!before.trim() || caret !== input.length) return false
    const m = /^(\S+)\s+(\S*)$/.exec(before)
    let pool: string[]
    let stem: string
    let head = ""
    if (m) {
      pool = resolveCommand(m[1].toLowerCase())?.completes ?? []
      stem = m[2].toLowerCase()
      head = `${m[1]} `
    } else {
      pool = COMMAND_WORDS
      stem = before.toLowerCase()
    }
    const hits = pool.filter((w) => w.toLowerCase().startsWith(stem))
    // Nothing to complete: let Tab do its usual job and move focus on.
    if (hits.length === 0) return false
    if (hits.length === 1) {
      setLine(`${head}${hits[0]}${m ? "" : " "}`)
      return true
    }
    const shared = commonPrefix(hits.map((h) => h.toLowerCase()))
    if (shared.length > stem.length) {
      setLine(`${head}${hits[0].slice(0, shared.length)}`)
      return true
    }
    // Nothing more to add. A second Tab on the same text lists the candidates,
    // as a shell does.
    if (lastTab.current === before) {
      append(
        SHELL_PROMPT,
        input,
        <div className="term__out term__inline">
          {hits.map((h) => (
            <Cmd key={h} c={`${head}${h}`}>
              {h}
            </Cmd>
          ))}
        </div>,
      )
    }
    lastTab.current = before
    return true
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (rain) {
      if (["Shift", "Control", "Alt", "Meta"].includes(e.key)) return
      setRain(false)
      // Tab still moves focus; every other key only stops the rain.
      if (e.key !== "Tab") e.preventDefault()
      return
    }
    const ctrl = e.ctrlKey || e.metaKey
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const h = history.current
      if (h.length === 0) return
      if (hIdx.current === -1) draft.current = input
      hIdx.current = Math.min(hIdx.current + 1, h.length - 1)
      setLine(h[h.length - 1 - hIdx.current])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (hIdx.current === -1) return
      hIdx.current -= 1
      const h = history.current
      setLine(hIdx.current === -1 ? draft.current : h[h.length - 1 - hIdx.current])
    } else if (e.key === "Tab" && !e.shiftKey && !ctrl && !e.altKey) {
      if (mode === "shell" && complete()) e.preventDefault()
    } else if (e.key.toLowerCase() === "l" && ctrl) {
      e.preventDefault()
      setEntries([])
      setWelcome(false)
    } else if (e.key.toLowerCase() === "u" && e.ctrlKey) {
      e.preventDefault()
      setLine("")
    } else if ((e.key.toLowerCase() === "c" && e.ctrlKey) || e.key === "Escape") {
      const el = e.currentTarget
      const selecting = (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)
      if (e.key !== "Escape" && selecting) return // Ctrl+C with a selection is a copy.
      if (mode !== "shell") {
        e.preventDefault()
        hangUp()
      } else if (input) {
        e.preventDefault()
        append(SHELL_PROMPT, `${input}^C`, null)
        setLine("")
      }
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (rain) {
      setRain(false)
      return
    }
    const line = input
    setLine("")
    submit(line)
    openAndReveal()
  }

  function syncCaret(e: SyntheticEvent<HTMLInputElement>) {
    setCaret(e.currentTarget.selectionStart ?? e.currentTarget.value.length)
  }

  function onGlassClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest("a, button, input")) return
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus({ preventScroll: true })
  }

  const prompt = mode === "wopr" ? WOPR_PROMPT : mode === "dialling" ? "" : SHELL_PROMPT
  const at = Math.min(caret, input.length)
  const keys = mode === "wopr" ? WOPR_KEYS : SHELL_KEYS

  return (
    <RunContext.Provider value={tap}>
      <div
        ref={termRef}
        className="term"
        data-phosphor={phosphor}
        data-mode={mode}
        data-open={opened ? "true" : undefined}
        onClick={onGlassClick}
      >
        <div className="term__chrome">
          <div className="term__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="term__title">{mode === "wopr" ? "WOPR" : "bradley@io: ~"}</div>
          <div className="term__status">
            {mode === "wopr" ? "link up" : mode === "dialling" ? "dialling" : data.build.version}
          </div>
        </div>

        <div ref={tubeRef} className="term__tube">
          <div ref={screenRef} className="term__screen" onScroll={measure}>
            <div ref={bodyRef} role="log" aria-live="polite" aria-label="Terminal output">
              {welcome ? <Welcome data={data} /> : null}
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="term__entry"
                  data-last={i === entries.length - 1 ? "true" : undefined}
                >
                  {entry.prompt !== null ? (
                    <div className="term__line">
                      <span className="term__prompt">{entry.prompt}</span>
                      <span className="term__user">{entry.input}</span>
                    </div>
                  ) : null}
                  {entry.output}
                </div>
              ))}
            </div>

            {waitingSince !== null ? (
              <div className="term__wait">
                waiting on the local model<span className="term__wait-dots" aria-hidden="true" /> {waited} s
              </div>
            ) : null}

            <form ref={formRef} className="term__form" onSubmit={onSubmit}>
              <label className="term__line term__input-line">
                <span className="term__prompt">{prompt}</span>
                <span className="term__typed" aria-hidden="true">
                  {input.slice(0, at)}
                  <span className="term__cursor" data-focused={focused ? "true" : "false"}>
                    {input[at] ?? " "}
                  </span>
                  {input.slice(at + 1)}
                </span>
                <input
                  ref={inputRef}
                  className="term__input"
                  type="text"
                  value={input}
                  maxLength={MAX_LINE}
                  onChange={(e) => {
                    setInput(e.target.value)
                    syncCaret(e)
                  }}
                  onSelect={syncCaret}
                  onKeyDown={onKeyDown}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  aria-label={mode === "wopr" ? "Say to WOPR" : "Terminal command"}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="go"
                />
              </label>
            </form>
          </div>

          {below && !rain ? (
            <button type="button" className="term__more" onClick={toBottom}>
              more below <span aria-hidden="true">&darr;</span>
            </button>
          ) : null}

          {rain ? <MatrixRain onDone={() => setRain(false)} /> : null}
        </div>

        <div className="term__keys">
          {keys.map((c) => (
            <button key={c} type="button" className="term__key" onClick={() => tap(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="term__hint">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> history
        </span>
        <span>
          <kbd>Tab</kbd> complete
        </span>
        <span>
          <kbd>Ctrl</kbd>+<kbd>L</kbd> clear
        </span>
        <span>
          <kbd>Esc</kbd> cancel or hang up
        </span>
      </div>
    </RunContext.Provider>
  )
}
