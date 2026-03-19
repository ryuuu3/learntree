'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Agent, ChatMessage } from '@/lib/types'
import { getAgents, saveAgent, deleteAgent } from '@/lib/storage'

export default function Home() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setAgents(getAgents())
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const startConversation = () => {
    setShowCreate(true)
    setHasStarted(true)
    const welcome: ChatMessage = {
      role: 'assistant',
      content: `Hei! 👋 Aku LearnTree — teman belajarmu.

Aku di sini untuk bantu kamu mulai belajar hal baru, dari nol sampai bisa. Nggak perlu bingung harus mulai dari mana.

**Kamu mau belajar apa?** Ceritain aja, mau detail atau garis besarnya dulu juga boleh. Aku yang akan bantu perjelas dan buatin rencana belajarnya! 🌱`
    }
    setMessages([welcome])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullText += chunk
        setStreamingText(fullText)
      }

      const aiMsg: ChatMessage = { role: 'assistant', content: fullText }
      setMessages([...newMessages, aiMsg])
      setStreamingText('')

      // Check if AI returned agent data
      const match = fullText.match(/<AGENT_DATA>([\s\S]*?)<\/AGENT_DATA>/)
      if (match) {
        try {
          const agentData = JSON.parse(match[1].trim())
          const newAgent: Agent = {
            id: crypto.randomUUID(),
            ...agentData,
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            assessmentDone: false,
            totalSessions: 0,
            progressNotes: []
          }
          saveAgent(newAgent)
          setAgents(getAgents())

          // Add confirmation message
          const confirmMsg: ChatMessage = {
            role: 'assistant',
            content: `✅ Agen **${newAgent.name}** berhasil dibuat! ${newAgent.emoji}\n\nKlik kartu agennya di bawah untuk mulai belajar. Semangat! 🚀`
          }
          setMessages(prev => [...prev, confirmMsg])
          setShowCreate(false)
        } catch (e) {
          console.error('Failed to parse agent data', e)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Hapus agen ini?')) {
      deleteAgent(id)
      setAgents(getAgents())
    }
  }

  const renderMessage = (content: string) => {
    // Simple markdown rendering
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>')
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌳</span>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 300, color: 'var(--color-text)' }}>
                LearnTree
              </h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Tumbuh bersama AI</p>
            </div>
          </div>
          <button
            onClick={() => { setShowCreate(true); if (!hasStarted) startConversation() }}
            className="btn-glow px-4 py-2 rounded-full text-sm font-medium"
          >
            + Agen Baru
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero — shown when no agents */}
        {agents.length === 0 && !showCreate && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-6">🌱</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 300, color: 'var(--color-text)', marginBottom: '1rem' }}>
              Mau belajar apa hari ini?
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
              Ceritain ke AI Ibu, nanti dia yang buatin agen belajar personal buat kamu. Gratis, tak terbatas.
            </p>
            <button
              onClick={startConversation}
              className="btn-glow px-8 py-3 rounded-full text-base font-medium"
            >
              Mulai Sekarang 🚀
            </button>
          </div>
        )}

        {/* Agents Grid */}
        {agents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, color: 'var(--color-text)', fontSize: '1.4rem' }}>
                Agen Belajarmu
              </h2>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{agents.length} agen aktif</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => router.push(`/agent/${agent.id}`)}
                  className="card p-5 cursor-pointer animate-grow"
                  style={{ position: 'relative' }}
                >
                  <button
                    onClick={(e) => handleDelete(e, agent.id)}
                    className="absolute top-3 right-3 opacity-0 hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                  >
                    ✕
                  </button>
                  <div className="flex items-start gap-3 mb-3">
                    <span style={{ fontSize: '2rem' }}>{agent.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 style={{ fontWeight: 500, color: 'var(--color-text)', fontSize: '1rem', marginBottom: '2px' }}>
                        {agent.name}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {agent.topic}
                      </p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {agent.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      background: agent.level === 'pemula' ? 'rgba(74,150,80,0.15)' : agent.level === 'menengah' ? 'rgba(234,179,8,0.15)' : agent.level === 'lanjut' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                      color: agent.level === 'pemula' ? 'var(--color-accent-light)' : agent.level === 'menengah' ? '#fbbf24' : agent.level === 'lanjut' ? '#f87171' : 'var(--color-text-muted)'
                    }}>
                      {agent.level}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {formatDate(agent.lastActive)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Add new card */}
              <div
                onClick={() => { setShowCreate(true); if (!hasStarted) startConversation() }}
                className="card p-5 cursor-pointer flex flex-col items-center justify-center gap-2"
                style={{ minHeight: '160px', borderStyle: 'dashed', opacity: 0.6 }}
              >
                <span style={{ fontSize: '1.5rem' }}>🌱</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Tambah agen baru</span>
              </div>
            </div>
          </div>
        )}

        {/* Mother AI Chat */}
        {showCreate && (
          <div className="card animate-slide-up" style={{ overflow: 'hidden' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
              <span>🌳</span>
              <div>
                <p style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>LearnTree AI</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>● Online</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="ml-auto"
                style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <span className="mr-2 mt-1 flex-shrink-0" style={{ fontSize: '1.2rem' }}>🌳</span>
                  )}
                  <div
                    className="prose-ai"
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-surface-2)',
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                  />
                </div>
              ))}
              {streamingText && (
                <div className="flex justify-start">
                  <span className="mr-2 mt-1 flex-shrink-0" style={{ fontSize: '1.2rem' }}>🌳</span>
                  <div
                    className="prose-ai cursor"
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: '18px 18px 18px 4px',
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMessage(streamingText) }}
                  />
                </div>
              )}
              {isLoading && !streamingText && (
                <div className="flex justify-start">
                  <span className="mr-2 mt-1 flex-shrink-0" style={{ fontSize: '1.2rem' }}>🌳</span>
                  <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface-2)' }}>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', animation: `pulse ${0.6 + i*0.2}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ceritain apa yang ingin kamu pelajari..."
                rows={1}
                style={{
                  flex: 1,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: 'var(--color-text)',
                  fontSize: '0.9rem',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.5,
                  fontFamily: 'var(--font-body)',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-border)')}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="btn-glow px-4 py-2 rounded-xl flex items-center justify-center"
                style={{ opacity: isLoading || !input.trim() ? 0.5 : 1, minWidth: '48px' }}
              >
                →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
