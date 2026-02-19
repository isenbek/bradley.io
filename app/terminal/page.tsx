"use client"

import React, { useState, useEffect, useRef, KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { MatrixRain } from "@/components/ui/matrix-rain"
import type { SiteData } from "@/lib/site-data"
import "./terminal.css"

interface Command {
  input: string
  output: string | React.ReactElement
}

export default function TerminalPage() {
  const [commands, setCommands] = useState<Command[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [matrixMode, setMatrixMode] = useState(false)
  const [siteData, setSiteData] = useState<SiteData | null>(null)
  const [cursorVisible, setCursorVisible] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    fetch("/data/site-data.json")
      .then((res) => res.json())
      .then((data: SiteData) => setSiteData(data))
      .catch(() => {})
  }, [])

  const availableCommands: Record<string, string> = {
    help: "Available commands:\n  about      - Learn about my background\n  skills     - View technical skills\n  projects   - Browse project portfolio\n  repos      - Show GitHub repositories\n  experience - Work experience timeline\n  contact    - Get in touch\n  clear      - Clear terminal\n  resume     - Download resume\n  github     - Visit GitHub profile\n  linkedin   - Visit LinkedIn profile\n  matrix     - Enter the matrix...\n  whoami     - Who am I?\n  ls         - List available sections\n  cat [file] - View specific information",

    whoami: "$ whoami\nbradley\n\n$ groups\ndata-engineers ai-experts edge-computing iot-developers enterprise-architects",

    ls: "Available sections:\n\n\u{1F4C1} experience/\n\u{1F4C1} projects/\n\u{1F4C1} skills/\n\u{1F4C1} certifications/\n\u{1F4C1} blog/\n\u{1F4C4} resume.pdf\n\u{1F4C4} contact.txt\n\nUse 'cat [filename]' to view contents",
  }

  const aboutOutput = () => {
    const bio = siteData?.about?.bio
    return (
      <div className="space-y-2">
        <div style={{ color: "var(--brand-primary)" }}>Bradley.io - Frontier Technologist</div>
        <div style={{ color: "var(--brand-muted)" }}>
          {bio || "Loading..."}
        </div>
        <div style={{ color: "var(--brand-muted)" }} className="text-sm mt-2">
          Type &apos;skills&apos; to see technical expertise or &apos;projects&apos; for case studies.
        </div>
      </div>
    )
  }

  const skillsOutput = () => {
    const skills = siteData?.about?.skills || []
    const chunkSize = 5
    const rows: string[][] = []
    for (let i = 0; i < skills.length; i += chunkSize) {
      rows.push(skills.slice(i, i + chunkSize))
    }

    return (
      <div className="space-y-2">
        <div style={{ color: "var(--brand-primary)" }}>Technical Skills Matrix:</div>
        <div className="ml-4 space-y-1">
          {rows.map((row, i) => (
            <div key={i}>
              <span style={{ color: "var(--brand-warning)" }}>{"\u25B8"} </span>
              <span style={{ color: "var(--brand-muted)" }}>{row.join(", ")}</span>
            </div>
          ))}
        </div>
        <div style={{ color: "var(--brand-muted)" }} className="text-sm mt-2">
          {skills.length} technologies across {siteData?.stats?.totalProjects || 0} projects
        </div>
      </div>
    )
  }

  const projectsOutput = () => {
    const projects = (siteData?.projects || [])
      .filter((p) => p.status === "active" && p.isFeatured)
      .slice(0, 5)

    return (
      <div className="space-y-3">
        <div style={{ color: "var(--brand-primary)" }}>Featured Projects:</div>

        {projects.map((project, i) => (
          <div key={project.slug} className="border-l-2 pl-3" style={{ borderColor: "var(--brand-border-hover)" }}>
            <div style={{ color: "var(--brand-warning)" }}>
              {i + 1}. {project.name}
            </div>
            <div className="text-sm" style={{ color: "var(--brand-muted)" }}>
              {project.description || project.tagline || "No description"}
              {project.sources?.github && (
                <div>{"\u25B8"} {project.sources.github.repo} ({project.sources.github.language})</div>
              )}
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div style={{ color: "var(--brand-muted)" }}>No featured projects found.</div>
        )}

        <div style={{ color: "var(--brand-muted)" }} className="text-sm mt-2">
          Type &apos;github&apos; to explore code repositories
        </div>
      </div>
    )
  }

  const experienceOutput = () => {
    const timeline = siteData?.about?.timeline || []

    return (
      <div className="space-y-3">
        <div style={{ color: "var(--brand-primary)" }}>Professional Experience Timeline:</div>

        {timeline.map((entry) => (
          <div key={entry.year} className="flex items-start gap-3">
            <div style={{ color: "var(--brand-info)" }}>{entry.year}</div>
            <div>
              <div style={{ color: "var(--brand-warning)" }}>{entry.title}</div>
              <div className="text-sm" style={{ color: "var(--brand-muted)" }}>
                {entry.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const contactOutput = () => (
    <div className="space-y-2">
      <div style={{ color: "var(--brand-primary)" }}>Contact Information:</div>
      <div className="ml-4">
        <div>{"\u{1F4E7}"} Email: contact@bradley.io</div>
        <div>{"\u{1F4CD}"} Location: Grand Rapids, Michigan</div>
        <div>{"\u{1F4BC}"} LinkedIn: /in/bradley-io</div>
        <div>{"\u{1F419}"} GitHub: github.com/tinymachines</div>
        <div>{"\u{1F4C5}"} Schedule consultation: bradley.io/contact</div>
      </div>
      <div style={{ color: "var(--brand-muted)" }} className="text-sm mt-2">
        Available for consulting engagements
      </div>
    </div>
  )

  const reposOutput = () => {
    const withGithub = (siteData?.projects || []).filter((p) => p.sources?.github)

    return (
      <div className="space-y-3">
        <div style={{ color: "var(--brand-primary)" }}>GitHub Repositories:</div>

        <div style={{ color: "var(--brand-warning)" }}>{"\u25B8"} TinyMachines & Projects</div>
        <div className="ml-4 space-y-2">
          {withGithub.slice(0, 6).map((p) => (
            <div key={p.slug} className="border-l-2 pl-3" style={{ borderColor: "var(--brand-steel)" }}>
              <div style={{ color: "var(--brand-info)" }}>{p.sources.github!.repo}</div>
              <div className="text-sm" style={{ color: "var(--brand-muted)" }}>
                Language: {p.sources.github!.language} | Stars: {p.sources.github!.stars} | Updated: {p.sources.github!.lastPush}
              </div>
            </div>
          ))}
          {withGithub.length > 6 && (
            <div style={{ color: "var(--brand-muted)" }} className="text-sm">
              + {withGithub.length - 6} more repositories...
            </div>
          )}
        </div>

        <div style={{ color: "var(--brand-muted)" }} className="text-sm mt-3">
          Visit github.com/tinymachines for full repository list
          {"\n"}Type &apos;github&apos; to open in browser
        </div>
      </div>
    )
  }

  const processCommand = (input: string) => {
    const cmd = input.toLowerCase().trim()
    const parts = cmd.split(" ")
    const baseCmd = parts[0]

    let output: string | React.ReactElement = ""

    switch (baseCmd) {
      case "help":
        output = availableCommands.help
        break
      case "about":
        output = aboutOutput()
        break
      case "skills":
        output = skillsOutput()
        break
      case "projects":
        output = projectsOutput()
        break
      case "repos":
        output = reposOutput()
        break
      case "experience":
        output = experienceOutput()
        break
      case "contact":
        output = contactOutput()
        break
      case "whoami":
        output = availableCommands.whoami
        break
      case "ls":
        output = availableCommands.ls
        break
      case "clear":
        output = "CLEAR"
        break
      case "matrix":
        output = "MATRIX"
        break
      case "resume":
        output = "Downloading resume.pdf..."
        setTimeout(() => {
          window.open("/resume.pdf", "_blank")
        }, 500)
        break
      case "github":
        output = "Opening GitHub profile..."
        setTimeout(() => {
          window.open("https://github.com/tinymachines", "_blank")
        }, 500)
        break
      case "linkedin":
        output = "Opening LinkedIn profile..."
        setTimeout(() => {
          window.open("https://linkedin.com", "_blank")
        }, 500)
        break
      case "cat":
        if (parts[1] === "contact.txt") {
          output = contactOutput()
        } else if (parts[1] === "resume.pdf") {
          output = "This is a binary file. Use 'resume' command to download."
        } else {
          output = `cat: ${parts[1] || "missing filename"}: No such file or directory`
        }
        break
      case "":
        return
      default:
        output = `Command not found: ${baseCmd}\nType 'help' for available commands`
    }

    return output
  }

  const handleCommand = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const output = processCommand(currentInput)

      if (output === "CLEAR") {
        setCommands([])
      } else if (output === "MATRIX") {
        setCommands([...commands, { input: currentInput, output: "Entering the matrix..." }])
        setMatrixMode(true)
        setTimeout(() => {
          setMatrixMode(false)
        }, 5000)
      } else if (output) {
        setCommands([...commands, { input: currentInput, output }])
      }

      if (currentInput) {
        setCommandHistory([...commandHistory, currentInput])
        setHistoryIndex(-1)
      }

      setCurrentInput("")
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCurrentInput("")
      }
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [commands])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  useEffect(() => {
    setCommands([
      {
        input: "",
        output: (
          <div style={{ color: "var(--brand-steel)" }}>
            Type <span style={{ color: "var(--brand-warning)" }}>&apos;help&apos;</span> to see available commands
          </div>
        ),
      },
    ])
  }, [])

  return (
    <div
      className="min-h-screen font-mono pt-[4.25rem]"
      style={{ background: "var(--brand-bg)", color: "var(--brand-primary)" }}
    >
      <MatrixRain active={matrixMode} />

      <motion.div
        className="terminal-container h-[calc(100vh-4.25rem)] overflow-hidden flex flex-col relative"
        style={{ background: "var(--brand-bg)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Terminal Body */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-2 max-w-4xl mx-auto w-full"
          onClick={() => inputRef.current?.focus()}
        >
          {commands.map((cmd, index) => (
            <div key={index} className="space-y-1">
              {cmd.input && (
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--brand-primary)" }}>bradley@io:~$</span>
                  <span style={{ color: "var(--brand-text)" }}>{cmd.input}</span>
                </div>
              )}
              <div className="whitespace-pre-wrap" style={{ color: "var(--brand-muted)" }}>
                {typeof cmd.output === "string" ? cmd.output : cmd.output}
              </div>
            </div>
          ))}

          {/* Current Input Line */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleCommand}
              className="absolute opacity-0 w-0 h-0"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <span className="terminal-glow" style={{ color: "var(--brand-primary)" }}>bradley@io:~$</span>
            {" "}
            <span className="terminal-glow" style={{ color: "var(--brand-text)" }}>{currentInput}</span>
            <span
              style={{
                borderBottom: cursorVisible ? "2px solid var(--brand-primary)" : "2px solid transparent",
                width: "0.6em",
                display: "inline-block",
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
