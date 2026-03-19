import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LearnAI — Mulai Belajar Apapun',
  description: 'AI yang membantu kamu belajar dari nol dengan roadmap personal, ide project, dan action plan nyata.',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌱</text></svg>" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
