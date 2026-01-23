import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'App Agenda - Sistema de Turnos',
  description: 'Sistema de agendamiento de turnos simple y eficiente',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
