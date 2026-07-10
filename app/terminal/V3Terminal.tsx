"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import type { SiteData } from "@/lib/site-data"

interface Entry {
  input: string
  output: React.ReactNode
}

const HELP_LINES = [
  ["about", "Background and bio"],
  ["skills", "Technical skills matrix"],
  ["projects", "Featured projects"],
  ["repos", "GitHub repositories"],
  ["experience", "Timeline"],
  ["contact", "How to reach me"],
  ["resume", "Open the resume PDF"],
  ["github", "Open my GitHub profile"],
  ["ls", "List sections"],
  ["whoami", "Who am I?"],
  ["clear", "Clear the screen"],
  ["help", "Show this menu"],
]

const SUGGESTED = ["about", "skills", "projects", "repos", "experience", "contact"]

function Help() {
  return (
    <div>
      <div className="v3-term__accent">Available commands:</div>
      <div style={{ marginTop: 6 }}>
        {HELP_LINES.map(([cmd, desc]) => (
          <div key={cmd}>
            <span className="v3-term__warn">{cmd.padEnd(12)}</span>
            <span className="v3-term__mute">— {desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function About({ data }: { data: SiteData | null }) {
  const bio = data?.about?.bio
  return (
    <div>
      <div className="v3-term__accent">bradley.io: frontier technologist</div>
      <div className="v3-term__mute" style={{ marginTop: 6 }}>
        {bio || "loading bio…"}
      </div>
      <div className="v3-term__mute" style={{ marginTop: 8, fontSize: "0.92em" }}>
        Type <span className="v3-term__warn">skills</span> or{" "}
        <span className="v3-term__warn">projects</span> for more.
      </div>
    </div>
  )
}

function Skills({ data }: { data: SiteData | null }) {
  const skills = data?.about?.skills ?? []
  const chunk = 5
  const rows: string[][] = []
  for (let i = 0; i < skills.length; i += chunk) rows.push(skills.slice(i, i + chunk))
  return (
    <div>
      <div className="v3-term__accent">Technical skills matrix:</div>
      <div style={{ marginLeft: 14, marginTop: 6 }}>
        {rows.map((row, i) => (
          <div key={i}>
            <span className="v3-term__bullet">▸ </span>
            <span className="v3-term__mute">{row.join(", ")}</span>
          </div>
        ))}
      </div>
      {skills.length > 0 ? (
        <div className="v3-term__mute" style={{ marginTop: 8 }}>
          {skills.length} technologies · {data?.stats?.totalProjects ?? 0} projects
        </div>
      ) : null}
    </div>
  )
}

function Projects({ data }: { data: SiteData | null }) {
  const list = (data?.projects ?? [])
    .filter((p) => p.status === "active" && p.isFeatured)
    .slice(0, 5)

  if (list.length === 0) {
    return <div className="v3-term__mute">No featured projects loaded.</div>
  }

  return (
    <div>
      <div className="v3-term__accent">Featured projects:</div>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((p, i) => (
          <div key={p.slug} style={{ borderLeft: "2px solid rgba(255,255,255,0.18)", paddingLeft: 12 }}>
            <div className="v3-term__warn">
              {i + 1}. {p.name}
            </div>
            <div className="v3-term__mute" style={{ fontSize: "0.92em" }}>
              {p.description || p.tagline || "no description"}
            </div>
            {p.sources?.github ? (
              <div className="v3-term__mute" style={{ fontSize: "0.88em" }}>
                ▸ {p.sources.github.repo} ({p.sources.github.language})
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="v3-term__mute" style={{ marginTop: 8 }}>
        Try <span className="v3-term__warn">github</span> to open the profile.
      </div>
    </div>
  )
}

function Repos({ data }: { data: SiteData | null }) {
  const list = (data?.projects ?? []).filter((p) => p.sources?.github)
  if (list.length === 0) return <div className="v3-term__mute">No GitHub repos loaded.</div>
  return (
    <div>
      <div className="v3-term__accent">GitHub repositories:</div>
      <div className="v3-term__bullet" style={{ marginTop: 6 }}>
        ▸ tinymachines & isenbek
      </div>
      <div style={{ marginLeft: 14, marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
        {list.slice(0, 6).map((p) => (
          <div key={p.slug} style={{ borderLeft: "2px solid rgba(255,255,255,0.14)", paddingLeft: 12 }}>
            <div className="v3-term__accent">{p.sources.github!.repo}</div>
            <div className="v3-term__mute" style={{ fontSize: "0.88em" }}>
              {p.sources.github!.language} · ★ {p.sources.github!.stars} · pushed{" "}
              {p.sources.github!.lastPush}
            </div>
          </div>
        ))}
        {list.length > 6 ? (
          <div className="v3-term__mute" style={{ fontSize: "0.9em" }}>
            +{list.length - 6} more repositories…
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Experience({ data }: { data: SiteData | null }) {
  const tl = data?.about?.timeline ?? []
  if (tl.length === 0) return <div className="v3-term__mute">No timeline loaded.</div>
  return (
    <div>
      <div className="v3-term__accent">Professional experience timeline:</div>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        {tl.map((e) => (
          <div key={e.year} className="v3-term__tl-row">
            <div className="v3-term__accent" style={{ fontSize: "0.9em" }}>
              {e.year}
            </div>
            <div>
              <div className="v3-term__warn">{e.title}</div>
              <div className="v3-term__mute" style={{ fontSize: "0.9em" }}>
                {e.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Contact() {
  return (
    <div>
      <div className="v3-term__accent">Contact:</div>
      <div style={{ marginLeft: 14, marginTop: 6 }}>
        <div>email   <span className="v3-term__warn">brad@bradley.io</span></div>
        <div>github  <span className="v3-term__warn">github.com/isenbek</span></div>
        <div>lab     <span className="v3-term__warn">github.com/tinymachines</span></div>
        <div>where   <span className="v3-term__warn">Grand Rapids, MI</span></div>
        <div>book    <span className="v3-term__warn">bradley.io/v3/contact</span></div>
      </div>
      <div className="v3-term__mute" style={{ marginTop: 8 }}>
        Reply window: about 24h on weekdays.
      </div>
    </div>
  )
}

function Ls() {
  return (
    <div className="v3-term__mute">
      <span className="v3-term__accent">drwxr-xr-x</span>  experience/
      {"\n"}
      <span className="v3-term__accent">drwxr-xr-x</span>  projects/
      {"\n"}
      <span className="v3-term__accent">drwxr-xr-x</span>  skills/
      {"\n"}
      <span className="v3-term__accent">drwxr-xr-x</span>  lab/
      {"\n"}
      <span className="v3-term__accent">-rw-r--r--</span>  resume.pdf
      {"\n"}
      <span className="v3-term__accent">-rw-r--r--</span>  contact.txt
      {"\n"}
      <span className="v3-term__accent">-rw-r--r--</span>  README.md
    </div>
  )
}

function Whoami() {
  return (
    <div className="v3-term__mute">
      <span className="v3-term__prompt">$</span> whoami
      {"\n"}bradley
      {"\n\n"}
      <span className="v3-term__prompt">$</span> groups
      {"\n"}data-engineers ai-pilots edge-hackers iot-builders frontier-technologists
    </div>
  )
}

export function V3Terminal() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [hIdx, setHIdx] = useState(-1)
  const [data, setData] = useState<SiteData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((r) => r.json())
      .then((d: SiteData) => setData(d))
      .catch(() => {})
  }, [])

  // Seed welcome message
  useEffect(() => {
    setEntries([
      {
        input: "",
        output: (
          <div>
            <div className="v3-term__accent">bradley.io · interactive terminal</div>
            <div className="v3-term__mute" style={{ marginTop: 4 }}>
              Type <span className="v3-term__warn">help</span> for a list of commands, or use the
              chips below.
            </div>
          </div>
        ),
      },
    ])
  }, [])

  // Auto-scroll on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return
    const parts = cmd.split(/\s+/)
    const base = parts[0]

    let out: React.ReactNode

    switch (base) {
      case "help":
        out = <Help />
        break
      case "about":
        out = <About data={data} />
        break
      case "skills":
        out = <Skills data={data} />
        break
      case "projects":
        out = <Projects data={data} />
        break
      case "repos":
        out = <Repos data={data} />
        break
      case "experience":
        out = <Experience data={data} />
        break
      case "contact":
        out = <Contact />
        break
      case "whoami":
        out = <Whoami />
        break
      case "ls":
        out = <Ls />
        break
      case "clear":
        setEntries([])
        return
      case "resume":
        out = <div className="v3-term__mute">opening resume.pdf…</div>
        setTimeout(() => window.open("/resume.pdf", "_blank"), 400)
        break
      case "github":
        out = <div className="v3-term__mute">opening github.com/isenbek…</div>
        setTimeout(() => window.open("https://github.com/isenbek", "_blank"), 400)
        break
      case "linkedin":
        out = (
          <div className="v3-term__mute">
            I&apos;m not on LinkedIn. Try <span className="v3-term__warn">github</span> or{" "}
            <span className="v3-term__warn">contact</span>.
          </div>
        )
        break
      case "cat":
        if (parts[1] === "contact.txt") out = <Contact />
        else if (parts[1] === "readme.md") out = <Help />
        else if (parts[1] === "resume.pdf")
          out = (
            <div className="v3-term__mute">
              binary file. Try <span className="v3-term__warn">resume</span> instead.
            </div>
          )
        else
          out = (
            <div className="v3-term__mute">
              cat: {parts[1] || "missing filename"}: no such file or directory
            </div>
          )
        break
      default:
        out = (
          <div className="v3-term__mute">
            command not found:{" "}
            <span className="v3-term__warn">{base}</span>. type{" "}
            <span className="v3-term__warn">help</span>.
          </div>
        )
    }

    setEntries((e) => [...e, { input: raw, output: out }])
    setHistory((h) => [...h, raw])
    setHIdx(-1)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(input)
      setInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (history.length === 0) return
      const next = Math.min(hIdx + 1, history.length - 1)
      setHIdx(next)
      setInput(history[history.length - 1 - next])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (hIdx <= 0) {
        setHIdx(-1)
        setInput("")
      } else {
        const next = hIdx - 1
        setHIdx(next)
        setInput(history[history.length - 1 - next])
      }
    } else if (e.key === "Tab") {
      // simple completion across known commands
      e.preventDefault()
      const all = HELP_LINES.map(([c]) => c)
      const matches = all.filter((c) => c.startsWith(input))
      if (matches.length === 1) setInput(matches[0])
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      setEntries([])
    }
  }

  return (
    <div className="v3-term" onClick={() => inputRef.current?.focus()}>
      <div className="v3-term__chrome">
        <div className="v3-term__dots">
          <span className="v3-term__dot v3-term__dot--r" />
          <span className="v3-term__dot v3-term__dot--y" />
          <span className="v3-term__dot v3-term__dot--g" />
        </div>
        <div className="v3-term__title">bradley@io ─ ~/portfolio</div>
        <div className="v3-term__live">
          <span aria-hidden /> live
        </div>
      </div>

      <div ref={scrollRef} className="v3-term__screen">
        {entries.map((entry, i) => (
          <div key={i} className="v3-term__entry">
            {entry.input ? (
              <div className="v3-term__line">
                <span className="v3-term__prompt">bradley@io:~$</span>
                <span className="v3-term__user">{entry.input}</span>
              </div>
            ) : null}
            <div className="v3-term__line">{entry.output}</div>
          </div>
        ))}

        <div className="v3-term__line">
          <span className="v3-term__prompt">bradley@io:~$</span>
          <span className="v3-term__user">{input}</span>
          <span className="v3-term__cursor" aria-hidden />
        </div>

        {/* Hidden real input — captures focus and keystrokes */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Terminal input"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 1,
            height: 1,
          }}
        />
      </div>

      <div className="v3-term__hint">
        <div>
          Try:
          <span className="v3-term__suggest" style={{ marginLeft: 8, display: "inline-flex" }}>
            {SUGGESTED.map((c) => (
              <button
                key={c}
                type="button"
                className="v3-term__chip"
                onClick={() => {
                  run(c)
                  inputRef.current?.focus()
                }}
              >
                {c}
              </button>
            ))}
          </span>
        </div>
        <div>
          <kbd>↑</kbd> history · <kbd>Tab</kbd> complete · <kbd>Ctrl</kbd>+<kbd>L</kbd> clear
        </div>
      </div>
    </div>
  )
}
