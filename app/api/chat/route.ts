import { GoogleGenerativeAI } from '@google/generative-ai'
import { getMotherPrompt } from '@/lib/prompts'


export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: model: 'gemini-1.5-flash-8b',
      systemInstruction: getMotherPrompt(),
    })

    // Convert messages: history is everything except last, last is the new prompt
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
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: 'API error' }), { status: 500 })
  }
}
