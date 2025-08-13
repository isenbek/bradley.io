"use client"

import { useState, useEffect, useRef, KeyboardEvent } from "react"
import { motion } from "framer-motion"
import { MatrixRain } from "@/components/ui/matrix-rain"
import "./terminal.css"

interface Command {
  input: string
  output: string | JSX.Element
}

export default function TerminalPage() {
  const [commands, setCommands] = useState<Command[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [matrixMode, setMatrixMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const availableCommands = {
    help: "Available commands:\n  about      - Learn about my background\n  skills     - View technical skills\n  projects   - Browse project portfolio\n  experience - Work experience timeline\n  contact    - Get in touch\n  clear      - Clear terminal\n  resume     - Download resume\n  github     - Visit GitHub profile\n  linkedin   - Visit LinkedIn profile\n  matrix     - Enter the matrix...\n  whoami     - Who am I?\n  ls         - List available sections\n  cat [file] - View specific information",
    
    about: "Bradley.io - AI Data Engineering & Edge Computing Expert\n\n• 10+ years transforming enterprise data strategies\n• Specialized in edge computing with IoT integration\n• Fortune 500 experience with TransUnion SRG\n• Based in Grand Rapids, Michigan\n• Passionate about bridging enterprise architecture with hands-on innovation\n\nType 'skills' to see technical expertise or 'projects' for case studies.",
    
    whoami: "$ whoami\nbradley\n\n$ groups\ndata-engineers ai-experts edge-computing iot-developers enterprise-architects",
    
    ls: "Available sections:\n\n📁 experience/\n📁 projects/\n📁 skills/\n📁 certifications/\n📁 blog/\n📄 resume.pdf\n📄 contact.txt\n\nUse 'cat [filename]' to view contents",
    
    clear: "CLEAR",
    
    matrix: "MATRIX",
  }

  const skillsOutput = () => (
    <div className="space-y-2">
      <div className="text-green-400">Technical Skills Matrix:</div>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <span className="text-yellow-400">▸ Languages:</span>
          <div className="ml-4 text-sm">Python, TypeScript, SQL, Scala, R</div>
        </div>
        <div>
          <span className="text-yellow-400">▸ Cloud:</span>
          <div className="ml-4 text-sm">AWS, Azure, GCP, Docker, K8s</div>
        </div>
        <div>
          <span className="text-yellow-400">▸ Data Engineering:</span>
          <div className="ml-4 text-sm">Spark, Airflow, Kafka, Databricks</div>
        </div>
        <div>
          <span className="text-yellow-400">▸ Edge/IoT:</span>
          <div className="ml-4 text-sm">Raspberry Pi, Arduino, MQTT</div>
        </div>
        <div>
          <span className="text-yellow-400">▸ AI/ML:</span>
          <div className="ml-4 text-sm">TensorFlow, PyTorch, MLflow</div>
        </div>
        <div>
          <span className="text-yellow-400">▸ Visualization:</span>
          <div className="ml-4 text-sm">D3.js, Tableau, Power BI</div>
        </div>
      </div>
      <div className="text-gray-400 text-sm mt-2">
        Proficiency: ████████░░ Expert in Edge Computing & Data Architecture
      </div>
    </div>
  )

  const projectsOutput = () => (
    <div className="space-y-3">
      <div className="text-green-400">Featured Projects:</div>
      
      <div className="border-l-2 border-primary pl-3">
        <div className="text-yellow-400">1. Commission Calculation System - TransUnion</div>
        <div className="text-sm text-gray-300">
          • Processed $2B+ in annual transactions
          • Reduced calculation time by 78%
          • Built with: Python, Spark, AWS, Kafka
        </div>
      </div>
      
      <div className="border-l-2 border-primary pl-3">
        <div className="text-yellow-400">2. Predictive Maintenance Platform - Manufacturing</div>
        <div className="text-sm text-gray-300">
          • 35% reduction in equipment downtime
          • IoT sensors with edge processing
          • Built with: Raspberry Pi, TensorFlow Lite, MQTT
        </div>
      </div>
      
      <div className="border-l-2 border-primary pl-3">
        <div className="text-yellow-400">3. Real-time Patient Monitoring - Healthcare</div>
        <div className="text-sm text-gray-300">
          • HIPAA-compliant edge architecture
          • Sub-200ms alert response time
          • Built with: Arduino, Edge AI, Azure IoT
        </div>
      </div>
      
      <div className="text-gray-400 text-sm mt-2">
        Type 'github' to explore code repositories
      </div>
    </div>
  )

  const experienceOutput = () => (
    <div className="space-y-3">
      <div className="text-green-400">Professional Experience Timeline:</div>
      
      <div className="flex items-start gap-3">
        <div className="text-primary">2018-2023</div>
        <div>
          <div className="text-yellow-400">Senior Data Architect @ TransUnion SRG</div>
          <div className="text-sm text-gray-300">
            • Led data architecture for commission systems
            • Managed team of 8 engineers
            • Designed real-time data pipelines
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-3">
        <div className="text-primary">2016-2018</div>
        <div>
          <div className="text-yellow-400">Data Engineering Consultant @ NYC Headhunter</div>
          <div className="text-sm text-gray-300">
            • Built predictive talent matching algorithms
            • Automated recruitment analytics
            • Improved placement rates by 45%
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-3">
        <div className="text-primary">2014-2016</div>
        <div>
          <div className="text-yellow-400">Data Engineer @ Startup Ecosystem</div>
          <div className="text-sm text-gray-300">
            • Early-stage data infrastructure
            • Built ETL pipelines from scratch
            • Scaled systems from 0 to millions of records
          </div>
        </div>
      </div>
    </div>
  )

  const contactOutput = () => (
    <div className="space-y-2">
      <div className="text-green-400">Contact Information:</div>
      <div className="ml-4">
        <div>📧 Email: contact@bradley.io</div>
        <div>📍 Location: Grand Rapids, Michigan</div>
        <div>💼 LinkedIn: /in/bradley-io</div>
        <div>🐙 GitHub: github.com/tinymachines</div>
        <div>📅 Schedule consultation: bradley.io/contact</div>
      </div>
      <div className="text-gray-400 text-sm mt-2">
        Available for consulting engagements: $150-275/hour
      </div>
    </div>
  )

  const processCommand = (input: string) => {
    const cmd = input.toLowerCase().trim()
    const parts = cmd.split(" ")
    const baseCmd = parts[0]
    
    let output: string | JSX.Element = ""
    
    switch (baseCmd) {
      case "help":
        output = availableCommands.help
        break
      case "about":
        output = availableCommands.about
        break
      case "skills":
        output = skillsOutput()
        break
      case "projects":
        output = projectsOutput()
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
        output = availableCommands.clear
        break
      case "matrix":
        output = availableCommands.matrix
        break
      case "resume":
        output = "Downloading resume.pdf..."
        // In real implementation, trigger download
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
    // Initial welcome message
    setCommands([
      {
        input: "",
        output: (
          <div className="space-y-2">
            <pre className="text-green-400 text-xs sm:text-sm">
{`
██████╗ ██████╗  █████╗ ██████╗ ██╗     ███████╗██╗   ██╗   ██╗ ██████╗ 
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║     ██╔════╝╚██╗ ██╔╝   ██║██╔═══██╗
██████╔╝██████╔╝███████║██║  ██║██║     █████╗   ╚████╔╝    ██║██║   ██║
██╔══██╗██╔══██╗██╔══██║██║  ██║██║     ██╔══╝    ╚██╔╝     ██║██║   ██║
██████╔╝██║  ██║██║  ██║██████╔╝███████╗███████╗   ██║   ██╗██║╚██████╔╝
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚═╝╚═╝ ╚═════╝ 
`}
            </pre>
            <div className="text-gray-300">
              Welcome to Bradley.io Interactive Terminal v1.0.0
            </div>
            <div className="text-gray-400">
              Type <span className="text-yellow-400">'help'</span> to see available commands
            </div>
          </div>
        )
      }
    ])
  }, [])

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <MatrixRain active={matrixMode} />
      
      <motion.div 
        className="terminal-container max-w-4xl mx-auto h-[calc(100vh-10rem)] bg-gray-900 rounded-lg border border-green-800 overflow-hidden flex flex-col relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Terminal Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2 border-b border-green-800">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center text-sm text-gray-400">
            bradley@io:~/terminal
          </div>
        </div>
        
        {/* Terminal Body */}
        <div 
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-4 space-y-2"
          onClick={() => inputRef.current?.focus()}
        >
          {commands.map((cmd, index) => (
            <div key={index} className="space-y-1">
              {cmd.input && (
                <div className="flex items-center gap-2">
                  <span className="text-primary">bradley@io:~$</span>
                  <span className="text-white">{cmd.input}</span>
                </div>
              )}
              <div className="text-gray-300 whitespace-pre-wrap">
                {typeof cmd.output === "string" ? cmd.output : cmd.output}
              </div>
            </div>
          ))}
          
          {/* Current Input Line */}
          <div className="flex items-center gap-2">
            <span className="text-primary terminal-glow">bradley@io:~$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleCommand}
              className="flex-1 bg-transparent outline-none text-white caret-green-400 terminal-glow"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
            <motion.span
              className="inline-block w-2 h-4 bg-green-400"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}