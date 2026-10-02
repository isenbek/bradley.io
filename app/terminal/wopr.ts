/**
 * The line to WOPR.
 *
 * WOPR is wargames-server.js at the repo root: a Socket.io server (PM2 process
 * bradley-io-wargames, port 3333) that plays the computer from WarGames (1983).
 * The original site had a whole page for it (git show 63d43d0:app/wargames/page.tsx).
 * That page is gone; the server never stopped running. This module is the
 * client half, and the terminal's `wopr` command is the page.
 *
 * WHAT IS REAL AND WHAT IS SCRIPTED. The server answers a handful of inputs
 * from a script (the greeting, help, status, run simulation, joshua, logout)
 * and hands everything else to a local model through Ollama. Both are the
 * server speaking, and the terminal prints both. Two things it must never do:
 *
 *   1. Invent a reply. If the socket does not connect, the command says the
 *      server is down and stops. Nothing here simulates WOPR.
 *
 *   2. Pass off a canned line as the model. When Ollama fails, the server
 *      picks one of five stock sentences at random and sends it as if WOPR had
 *      answered. CANNED below is that list, copied from wargames-server.js, so
 *      the terminal can recognise one and say what happened instead. The right
 *      fix is in the server (send a typed "model offline" message); until then
 *      this list has to be kept in step with it by hand.
 *
 * WHERE IT CONNECTS. bradley.io's own nginx vhost has no /socket.io location,
 * so the browser talks to the host the old page used: wargames.tinymachines.ai,
 * which proxies /socket.io/ to port 3333 on this box. On a development machine
 * it goes straight to the port. WebSocket transport only: the public vhost
 * sends its CORS header twice (nginx adds one, the server adds one), which a
 * browser rejects on the long-polling transport, and a WebSocket has no such
 * check to fail.
 *
 * socket.io-client is imported on demand, so nobody who does not type `wopr`
 * downloads it.
 */

/** The model wargames-server.js asks for. Named in the terminal's banner. */
export const WOPR_MODEL = "qwen3:8b"

/** How long to wait for the socket before calling the server down. */
export const DIAL_TIMEOUT_MS = 6_000

/** How long to wait for the model before saying it has not answered. */
export const REPLY_TIMEOUT_MS = 60_000

/** The longest line the terminal will send. */
export const MAX_LINE = 240

/** The server's stock sentences for when its model call throws. Not replies. */
const CANNED = new Set([
  "PROCESSING... UNABLE TO COMPUTE AT THIS TIME.",
  "INTERESTING. SHALL WE RUN A SIMULATION?",
  "ANALYSIS COMPLETE. THE PROBABILITY OF SUCCESS IS NEGLIGIBLE.",
  "WOULD YOU LIKE TO PLAY A GAME INSTEAD?",
  "CALCULATING... THE ONLY WINNING MOVE IS NOT TO PLAY.",
])

export function isCanned(text: string): boolean {
  return CANNED.has(text.trim())
}

/**
 * True when the server answers this input from its script and never calls the
 * model. Mirrors the branches in wargames-server.js; used only to decide
 * whether to show "waiting on the model".
 */
export function isScripted(line: string): boolean {
  const c = line.toLowerCase().trim()
  return (
    c === "help" ||
    c === "list games" ||
    c === "joshua" ||
    c === "status" ||
    c === "run simulation" ||
    c === "logout" ||
    c === "exit" ||
    c.includes("global thermonuclear war")
  )
}

/**
 * A reply, set for a teletype. The model writes Markdown and typographic
 * punctuation, and the server upper-cases all of it; a 1983 console has no
 * bold and no long dash. This removes the markup and nothing else: emphasis
 * marks, heading marks, code ticks, curly quotes, long dashes, and the
 * model's scratch work (a <think> block) if the server ever passes one
 * through. No word of the reply itself is added, dropped or reordered.
 */
export function teletype(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*\w])\*([^*\s](?:[^*\n]*[^*\s])?)\*(?![*\w])/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}[ \t]+/gm, "")
    .replace(/[ \t]*[\u2013\u2014][ \t]*/g, " - ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export interface WoprMessage {
  text: string
  /** "wopr" is the machine speaking; "system" is the console around it. */
  type: "wopr" | "system"
}

export type WoprDown =
  /** The socket never opened: the server, or the proxy in front of it, is down. */
  | "no-answer"
  /** socket.io-client itself failed to load. */
  | "no-client"
  /** The line was open and the far end closed it. */
  | "dropped"
  /** This end hung up. */
  | "hangup"

export interface WoprHandlers {
  onUp: () => void
  onMessage: (m: WoprMessage) => void
  onDown: (why: WoprDown) => void
}

export interface WoprLink {
  /** Where it dialled, for the transcript. */
  host: string
  send: (line: string) => void
  hangup: () => void
}

/** The host the browser dials, and the label the terminal prints for it. */
export function woprEndpoint(): { url: string; host: string } {
  const h = window.location.hostname
  if (h === "localhost" || h === "127.0.0.1") {
    return { url: `http://${h}:3333`, host: `${h}:3333` }
  }
  return { url: "https://wargames.tinymachines.ai", host: "wargames.tinymachines.ai" }
}

/**
 * Dial. Returns at once with a link; the handlers say what became of it.
 * `onDown` is called exactly once per link, whatever the cause.
 */
export function dial(handlers: WoprHandlers): WoprLink {
  const { url, host } = woprEndpoint()
  let socket: import("socket.io-client").Socket | null = null
  let finished = false
  let wasUp = false

  const down = (why: WoprDown) => {
    if (finished) return
    finished = true
    socket?.removeAllListeners()
    socket?.disconnect()
    socket = null
    handlers.onDown(why)
  }

  import("socket.io-client")
    .then(({ io }) => {
      if (finished) return
      socket = io(url, {
        path: "/socket.io/",
        transports: ["websocket"],
        reconnection: false,
        timeout: DIAL_TIMEOUT_MS,
      })
      socket.on("connect", () => {
        wasUp = true
        handlers.onUp()
      })
      socket.on("connect_error", () => down("no-answer"))
      socket.on("disconnect", () => down(wasUp ? "dropped" : "no-answer"))
      socket.on("message", (m: unknown) => {
        if (finished || !m || typeof m !== "object") return
        const { text, type } = m as { text?: unknown; type?: unknown }
        if (typeof text !== "string" || !text) return
        handlers.onMessage({ text, type: type === "wopr" ? "wopr" : "system" })
      })
    })
    .catch(() => down("no-client"))

  return {
    host,
    send: (line) => {
      socket?.emit("command", line.slice(0, MAX_LINE))
    },
    hangup: () => down("hangup"),
  }
}
