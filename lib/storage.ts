import { Agent, AgentSession, ChatMessage } from './types'

const AGENTS_KEY = 'learnai_agents'
const SESSIONS_KEY = 'learnai_sessions'

export function getAgents(): Agent[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(AGENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export function saveAgent(agent: Agent): void {
  const agents = getAgents()
  const idx = agents.findIndex(a => a.id === agent.id)
  if (idx >= 0) agents[idx] = agent
  else agents.push(agent)
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
}

export function deleteAgent(id: string): void {
  const agents = getAgents().filter(a => a.id !== id)
  localStorage.setItem(AGENTS_KEY, JSON.stringify(agents))
  const sessions = getSessions().filter(s => s.agentId !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getAgent(id: string): Agent | null {
  return getAgents().find(a => a.id === id) || null
}

export function getSessions(): AgentSession[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(SESSIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch { return [] }
}

export function getSession(agentId: string, mode: string): ChatMessage[] {
  const sessions = getSessions()
  const session = sessions.find(s => s.agentId === agentId && s.mode === mode)
  return session?.messages || []
}

export function saveSession(agentId: string, mode: string, messages: ChatMessage[]): void {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.agentId === agentId && s.mode === mode)
  const session: AgentSession = { agentId, mode: mode as AgentSession['mode'], messages }
  if (idx >= 0) sessions[idx] = session
  else sessions.push(session)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function updateAgentActivity(id: string): void {
  const agent = getAgent(id)
  if (!agent) return
  agent.lastActive = new Date().toISOString()
  agent.totalSessions = (agent.totalSessions || 0) + 1
  saveAgent(agent)
}
