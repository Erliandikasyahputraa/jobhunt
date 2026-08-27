import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Anti-Nganggur — Biar Cari Kerja Nggak Berantakan',
  description:
    'Tempat menyimpan, mengatur, dan memantau semua lamaran kerja kamu dalam satu tempat. Gratis dan mudah digunakan.',
  metadataBase: new URL('https://anti-nganggur.vercel.app'),
  openGraph: {
    title: 'Anti-Nganggur — Biar Cari Kerja Nggak Berantakan',
    description:
      'Tempat menyimpan, mengatur, dan memantau semua lamaran kerja kamu dalam satu tempat. Gratis dan mudah digunakan.',
    url: 'https://anti-nganggur.vercel.app',
    siteName: 'Anti-Nganggur',
    locale: 'id_ID',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider defaultTheme="system">
          {children}
          <Toaster
            theme="system"
            toastOptions={{
              className: 'glass text-label-primary border-border-primary',
            }}
          />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
