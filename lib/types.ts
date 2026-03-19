export interface Agent {
  id: string
  name: string
  topic: string
  description: string
  emoji: string
  level: 'pemula' | 'menengah' | 'lanjut' | 'belum diketahui'
  createdAt: string
  lastActive: string
  roadmap?: RoadmapItem[]
  assessmentDone: boolean
  totalSessions: number
  progressNotes: string[]
}

export interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'belum' | 'sedang' | 'selesai'
  estimatedDays: number
  resources?: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentSession {
  agentId: string
  mode: AgentMode
  messages: ChatMessage[]
}

export type AgentMode = 'assess' | 'roadmap' | 'projects' | 'brainstorm' | 'chat'
