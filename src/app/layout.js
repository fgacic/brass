import { DM_Sans, Lora } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
})

export const metadata = {
  title: 'Brass: Birmingham',
  description: 'Online multiplayer Brass: Birmingham board game',
}

export default function RootLayout ({ children }) {
  return (
    <html lang="en" className={lora.variable}>
      <body
        className={`${dmSans.className} min-h-screen antialiased text-[#ece6dc] bg-[#0f0d0b] bg-gradient-to-br from-[#1c1611] via-[#121a15] to-[#0c1012]`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
