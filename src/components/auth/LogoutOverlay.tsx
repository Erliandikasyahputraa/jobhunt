'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface LogoutOverlayProps {
  isVisible: boolean
}

export function LogoutOverlay({ isVisible }: LogoutOverlayProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!isVisible || !mounted) {
    return null
  }

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      aria-busy="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in-0"
    >
      <div className="glass-strong border border-border/40 rounded-2xl p-8 max-w-sm w-[90%] text-center shadow-2xl space-y-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl gradient-brand text-white flex items-center justify-center shadow-lg">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-foreground">Keluar dari Anti-Nganggur...</h3>
          <p className="text-sm text-muted-foreground">Sebentar ya.</p>
        </div>
      </div>
    </div>,
    document.body
  )
}
