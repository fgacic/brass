import './globals.css'

export const metadata = {
  title: 'Brass: Birmingham',
  description: 'Online multiplayer Brass: Birmingham board game',
}

export default function RootLayout ({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-900 text-stone-100 antialiased">
        {children}
      </body>
    </html>
  )
}
