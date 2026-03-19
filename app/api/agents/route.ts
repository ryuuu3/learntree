import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAgentSystemPrompt } from '@/lib/prompts'
import { Agent } from '@/lib/types'


export async function POST(req: Request) {
  try {
    const { messages, agent, mode } = await req.json() as {
      messages: { role: string; content: string }[]
      agent: Agent
      mode: string
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash-latest',
      systemInstruction: getAgentSystemPrompt(agent, mode),
    })

    // Convert history: all except the last message
   const rawHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
  role: m.role === 'assistant' ? 'model' : 'user',
  parts: [{ text: m.content }],
}))
    const firstUserIdx = rawHistory.findIndex((m: {role: string}) => m.role === 'user')
    const history = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : []
    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(lastMessage.content)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      }
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  } catch (error) {
    console.error('Agent chat error:', error)
    return new Response(JSON.stringify({ error: 'API error' }), { status: 500 })
  }
}
