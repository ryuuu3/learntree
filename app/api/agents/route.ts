import { getAgentSystemPrompt } from '@/lib/prompts'
import { Agent } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const { messages, agent, mode } = await req.json() as {
      messages: { role: string; content: string }[]
      agent: Agent
      mode: string
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: getAgentSystemPrompt(agent, mode) },
          ...messages.map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          }))
        ],
        stream: true,
        max_tokens: 2048,
      }),
    })

    return new Response(res.body ? transformGroqStream(res.body) : null, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  } catch (error) {
    console.error('Agent chat error:', error)
    return new Response(JSON.stringify({ error: 'API error' }), { status: 500 })
  }
}

function transformGroqStream(body: ReadableStream): ReadableStream {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const text = json.choices?.[0]?.delta?.content
            if (text) controller.enqueue(encoder.encode(text))
          } catch {}
        }
      }
      controller.close()
    }
  })
}
