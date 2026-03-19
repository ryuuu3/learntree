'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Agent, ChatMessage, AgentMode } from '@/lib/types'
import { getAgent, saveAgent, getSession, saveSession, updateAgentActivity } from '@/lib/storage'

const MODES: { id: AgentMode; label: string; labelEn: string; emoji: string; desc: string }[] = [
  { id: 'assess', label: 'Ukur Kemampuan', labelEn: 'Assess', emoji: '🎯', desc: 'Test your current level' },
  { id: 'roadmap', label: 'Roadmap', labelEn: 'Roadmap', emoji: '🗺️', desc: 'Get your learning path' },
  { id: 'projects', label: 'Ide Project', labelEn: 'Project Ideas', emoji: '🛠️', desc: 'Build real things' },
  { id: 'brainstorm', label: 'Brainstorm → Aksi', labelEn: 'Brainstorm → Action', emoji: '⚡', desc: 'Ideas into real steps' },
  { id: 'chat', label: 'Chat Bebas', labelEn: 'Free Chat', emoji: '💬', desc: 'Ask anything' },
]

const MODE_STARTERS: Record<AgentMode, string> = {
  assess: 'Mulai asesmen kemampuanku di topik ini.',
  roadmap: 'Buatkan roadmap belajar yang personal untukku.',
  projects: 'Berikan ide project yang bisa aku bangun untuk belajar topik ini.',
  brainstorm: 'Aku mau brainstorm dan ubah ide menjadi action steps.',
  chat: 'Hei! Aku mau belajar dan diskusi tentang topik ini.',
}

export default function AgentPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [mode, setMode] = useState<AgentMode>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const a = getAgent(agentId)
    if (!a) { router.push('/'); return }
    setAgent(a)
    loadMode('chat', a)
  }, [agentId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const loadMode = (newMode: AgentMode, agentData?: Agent) => {
    const a = agentData || agent
    if (!a) return
    setMode(newMode)
    const saved = getSession(agentId, newMode)
    if (saved.length > 0) {
      setMessages(saved)
    } else {
      setMessages([])
      // Auto-start the mode
      setTimeout(() => triggerModeStart(newMode, a), 100)
    }
  }

  const triggerModeStart = async (m: AgentMode, a: Agent) => {
    const starter = MODE_STARTERS[m]
    await sendToAgent(starter, [], m, a)
  }

  const sendToAgent = async (
    text: string,
    currentMessages: ChatMessage[],
    currentMode: AgentMode = mode,
    currentAgent: Agent | null = agent
  ) => {
    if (!currentAgent) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...currentMessages, userMsg]
    setMessages(newMessages)
    setIsLoading(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, agent: currentAgent, mode: currentMode })
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        setStreamingText(fullText)
      }

      const aiMsg: ChatMessage = { role: 'assistant', content: fullText }
      const finalMessages = [...newMessages, aiMsg]
      setMessages(finalMessages)
      setStreamingText('')
      saveSession(agentId, currentMode, finalMessages)

      // Detect level from assessment
      if (currentMode === 'assess') {
        const levelMatch = fullText.match(/LEVEL TERDETEKSI:\s*(pemula|menengah|lanjut)/i)
        if (levelMatch && currentAgent) {
          const newLevel = levelMatch[1].toLowerCase() as Agent['level']
          const updated = { ...currentAgent, level: newLevel, assessmentDone: true }
          saveAgent(updated)
          setAgent(updated)
        }
      }

      updateAgentActivity(agentId)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    await sendToAgent(text, messages)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const saveNote = () => {
    if (!noteText.trim() || !agent) return
    const updated = {
      ...agent,
      progressNotes: [...(agent.progressNotes || []), `${new Date().toLocaleDateString('id-ID')} — ${noteText.trim()}`]
    }
    saveAgent(updated)
    setAgent(updated)
    setNoteText('')
    setShowNote(false)
  }

  const renderMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-accent-light);font-weight:500">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(74,150,80,0.15);color:var(--color-accent-light);padding:1px 5px;border-radius:3px;font-size:0.85em">$1</code>')
      .replace(/^#{3}\s+(.+)$/gm, '<h3 style="font-family:var(--font-display);font-weight:400;font-size:1.05rem;color:var(--color-text);margin:12px 0 4px">$1</h3>')
      .replace(/^#{2}\s+(.+)$/gm, '<h2 style="font-family:var(--font-display);font-weight:400;font-size:1.2rem;color:var(--color-text);margin:14px 0 6px">$1</h2>')
      .replace(/^- (.+)$/gm, '<li style="margin-left:1.2rem;list-style:disc;margin-bottom:3px">$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li style="margin-left:1.2rem;list-style:decimal;margin-bottom:3px">$2</li>')
      .replace(/\n\n/g, '</p><p style="margin-bottom:8px">')
      .replace(/\n/g, '<br/>')
  }

  if (!agent) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="shimmer" style={{ width: 200, height: 20, borderRadius: 8 }} />
    </div>
  )

  const currentMode = MODES.find(m => m.id === mode)!

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/')} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
            ←
          </button>
          <span style={{ fontSize: '1.5rem' }}>{agent.emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 style={{ fontWeight: 500, fontSize: '1rem', color: 'var(--color-text)' }}>{agent.name}</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.topic}</p>
          </div>
          <span style={{
            fontSize: '0.7rem', padding: '3px 10px', borderRadius: '20px',
            background: agent.level === 'pemula' ? 'rgba(74,150,80,0.15)' : agent.level === 'menengah' ? 'rgba(234,179,8,0.15)' : agent.level === 'lanjut' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
            color: agent.level === 'pemula' ? 'var(--color-accent-light)' : agent.level === 'menengah' ? '#fbbf24' : agent.level === 'lanjut' ? '#f87171' : 'var(--color-text-muted)'
          }}>
            {agent.level}
          </span>
          <button
            onClick={() => setShowNote(!showNote)}
            style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
          >
            📝 Catat
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 py-4 gap-4">
        {/* Mode Sidebar */}
        <aside className="flex-shrink-0 w-48 hidden md:block">
          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mode / Mode
          </p>
          <div className="flex flex-col gap-2">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => loadMode(m.id)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', border: 'none',
                  background: mode === m.id ? 'rgba(74,150,80,0.15)' : 'var(--color-surface)',
                  borderLeft: mode === m.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '1rem', marginBottom: '2px' }}>{m.emoji}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: mode === m.id ? 'var(--color-accent-light)' : 'var(--color-text)' }}>{m.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{m.labelEn}</div>
              </button>
            ))}
          </div>

          {/* Progress Notes */}
          {agent.progressNotes && agent.progressNotes.length > 0 && (
            <div className="mt-4">
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Progress Notes
              </p>
              <div className="tree-line pl-3 space-y-2">
                {agent.progressNotes.slice(-5).map((note, i) => (
                  <p key={i} style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{note}</p>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0" style={{ minHeight: 0 }}>
          {/* Mode header */}
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: '1.1rem' }}>{currentMode.emoji}</span>
            <span style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '0.9rem' }}>{currentMode.label}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>/ {currentMode.labelEn}</span>
            <button
              onClick={() => { saveSession(agentId, mode, []); loadMode(mode) }}
              style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--color-text-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>

          {/* Mobile mode tabs */}
          <div className="flex gap-2 mb-3 overflow-x-auto md:hidden pb-1">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => loadMode(m.id)}
                style={{
                  flexShrink: 0, padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem',
                  background: mode === m.id ? 'rgba(74,150,80,0.2)' : 'var(--color-surface)',
                  color: mode === m.id ? 'var(--color-accent-light)' : 'var(--color-text-muted)',
                }}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto space-y-4 pr-1"
            style={{ minHeight: '300px', maxHeight: 'calc(100vh - 280px)' }}
          >
            {messages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-32">
                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Memulai sesi...</div>
              </div>
            )}
            {messages.map((msg, i) => {
              if (msg.role === 'user' && Object.values(MODE_STARTERS).includes(msg.content)) return null
              return (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {msg.role === 'assistant' && (
                    <span className="mr-2 mt-1 flex-shrink-0" style={{ fontSize: '1.1rem' }}>{agent.emoji}</span>
                  )}
                  <div
                    className="prose-ai"
                    style={{
                      maxWidth: msg.role === 'user' ? '75%' : '85%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-surface)',
                      border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                      lineHeight: 1.65,
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                  />
                </div>
              )
            })}
            {streamingText && (
              <div className="flex justify-start animate-fade-in">
                <span className="mr-2 mt-1 flex-shrink-0" style={{ fontSize: '1.1rem' }}>{agent.emoji}</span>
                <div
                  className="prose-ai cursor"
                  style={{
                    maxWidth: '85%', padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)', fontSize: '0.88rem', lineHeight: 1.65,
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMessage(streamingText) }}
                />
              </div>
            )}
            {isLoading && !streamingText && (
              <div className="flex justify-start">
                <span className="mr-2 mt-1 flex-shrink-0" style={{ fontSize: '1.1rem' }}>{agent.emoji}</span>
                <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex gap-1 items-center">
                    {[0,1,2].map(j => (
                      <div key={j} style={{
                        width: 5, height: 5, borderRadius: '50%', background: 'var(--color-accent)',
                        animation: `pulse ${0.5 + j * 0.15}s ease-in-out infinite`
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="mt-3 flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Tanya atau ceritakan sesuatu... / Ask anything...`}
              rows={2}
              style={{
                flex: 1, background: 'var(--color-surface)',
                border: '1px solid var(--color-border)', borderRadius: '12px',
                padding: '10px 14px', color: 'var(--color-text)',
                fontSize: '0.88rem', resize: 'none', outline: 'none',
                lineHeight: 1.5, fontFamily: 'var(--font-body)',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
              onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="btn-glow rounded-xl flex items-center justify-center"
              style={{ opacity: isLoading || !input.trim() ? 0.5 : 1, width: 48, alignSelf: 'stretch' }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showNote && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', zIndex: 50 }}
          onClick={() => setShowNote(false)}
        >
          <div
            className="card p-6 w-full max-w-md animate-grow"
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, marginBottom: '12px', color: 'var(--color-text)' }}>
              📝 Catat Progress / Progress Note
            </h3>
            {agent.progressNotes?.length > 0 && (
              <div className="mb-4 space-y-1">
                {agent.progressNotes.map((n, i) => (
                  <p key={i} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', borderLeft: '2px solid var(--color-accent)', paddingLeft: '8px' }}>{n}</p>
                ))}
              </div>
            )}
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Apa yang kamu pelajari hari ini? / What did you learn today?"
              rows={3}
              style={{
                width: '100%', background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)', borderRadius: '10px',
                padding: '10px', color: 'var(--color-text)',
                fontSize: '0.88rem', resize: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', marginBottom: '12px',
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNote(false)} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                Batal
              </button>
              <button onClick={saveNote} className="btn-glow px-4 py-2 rounded-lg text-sm">
                Simpan / Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
