import type { Metadata } from 'next'
import './globals.css'
import SessionProvider from '@/components/ui/SessionProvider'

export const metadata: Metadata = {
  title: 'Trivial Retro — Juego de Preguntas',
  description:
    'Juego de trivia retro con preguntas de Historia, Geografía, Matemáticas y Cine. ¡Demuestra cuánto sabes!',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        {/* Fuentes retro de Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#FDFAF0]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
