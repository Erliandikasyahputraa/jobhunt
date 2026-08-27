'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function FinalCTASection() {
  return (
    <AnimatedSection delay={200}>
      <section className="px-4 py-16 sm:py-24" aria-label="Call to action">
        <div className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-8 sm:p-14 shadow-2xl">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-medium text-white mb-6 backdrop-blur-xs">
                <Sparkles className="h-4 w-4" />
                <span>Mulai Hari Ini, Bebas Pusing</span>
              </div>

              <h2 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                Biar Cari Kerja Nggak Bikin Tambah Pusing
              </h2>

              <p className="mx-auto mb-9 max-w-2xl text-base sm:text-lg text-orange-100/90 leading-relaxed">
                Mulai sekarang tanpa ribet. 100% gratis, tanpa kartu kredit, dan langsung siap
                dipakai.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base sm:text-lg font-bold text-orange-600 shadow-xl transition-all duration-300 hover:scale-105 hover:bg-orange-50"
                  aria-label="Mulai lacak lamaran gratis"
                >
                  <span className="flex items-center gap-2">
                    Mulai Gratis Sekarang
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-7 py-4 text-base sm:text-lg font-semibold text-white backdrop-blur-xs transition-all duration-300 hover:bg-white/20"
                >
                  Sudah Punya Akun? Masuk di Sini
                </Link>
              </div>

              {/* Badges */}
              <div className="mt-10 flex items-center justify-center gap-6 sm:gap-8 flex-wrap text-xs sm:text-sm text-orange-100">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  100% Gratis Selamanya
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  Tanpa Kartu Kredit
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  Data Aman & Privat
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
