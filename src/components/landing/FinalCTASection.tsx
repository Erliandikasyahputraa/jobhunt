import Link from 'next/link'
import { TrendingUp, Github, ArrowRight } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

/**
 * Final call-to-action section with gradient background
 * Includes dual CTAs, trust signals, and animated background
 */
export function FinalCTASection() {
  return (
    <AnimatedSection delay={600}>
      <section className="px-4 py-16 sm:py-24" aria-label="Final call to action">
        <div className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl gradient-brand p-12 sm:p-16 lg:p-24 shadow-2xl">
            {/* Animated background pattern */}
            <div className="absolute inset-0 gradient-accent-overlay animate-gradient" />

            <div className="relative z-10 text-center">
              <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Mulai Atur Lamaran Kerja Kamu Sekarang
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-xl text-orange-100">
                Gratis, teratur, dan data tersimpan aman. Mulai lacak lamaranmu atau jalankan
                self-host dalam hitungan menit.
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-white/50"
                  aria-label="Mulai lacak lamaran gratis"
                >
                  <span className="flex items-center gap-2">
                    Mulai Gratis Sekarang
                    <TrendingUp className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>

                <Link
                  href="https://github.com/Erliandikasyahputraa/jobhunt"
                  className="group inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
                  aria-label="Lihat source code di GitHub"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Lihat di GitHub
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-12 grid gap-6 sm:grid-cols-3">
                <div className="text-orange-100">
                  <div className="text-3xl font-bold text-white mb-1">100%</div>
                  <div className="text-sm">Open Source (MIT)</div>
                </div>
                <div className="text-orange-100">
                  <div className="text-3xl font-bold text-white mb-1">0 Rp</div>
                  <div className="text-sm">Bebas Biaya Lisensi</div>
                </div>
                <div className="text-orange-100">
                  <div className="text-3xl font-bold text-white mb-1">RLS</div>
                  <div className="text-sm">Privasi Data Terisolasi</div>
                </div>
              </div>

              <p className="mt-8 text-sm text-orange-200">
                Open Source • MIT License • Active Development
              </p>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
