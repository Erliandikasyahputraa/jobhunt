'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, Compass } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative px-4 pt-12 pb-16 sm:pt-16 sm:pb-24 overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center">
          {/* Friendly Product Badge */}
          <div className="mb-6 flex justify-center animate-slide-up opacity-0 stagger-1">
            <div className="glass-strong inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium shadow-md">
              <Sparkles className="h-4 w-4 text-brand-primary" />
              <span className="text-foreground/90">
                Catat & pantau semua lamaran kerja di satu tempat
              </span>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 animate-slide-up opacity-0 stagger-2">
            <span className="block text-4xl sm:text-6xl font-extrabold tracking-tight">
              <span className="gradient-brand-text animate-gradient">Anti-Nganggur</span>
            </span>
            <span className="mt-3 block text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Nyari Kerja Boleh Ribet. Nyatet Lamaran Jangan.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-8 max-w-2xl text-base sm:text-xl text-foreground/80 leading-relaxed animate-slide-up opacity-0 stagger-3">
            Simpan lowongan yang kamu incar, catat prosesnya sudah sampai mana, simpan file CV, dan
            tahu kapan harus follow-up. Biar nggak lupa pernah daftar di mana.
          </p>

          {/* Pain-killer Pills */}
          <div className="mb-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-foreground/90 animate-slide-up opacity-0 stagger-3">
            <span className="glass rounded-full px-3.5 py-1.5 font-medium border border-border/40">
              Gak perlu Excel berat
            </span>
            <span className="glass rounded-full px-3.5 py-1.5 font-medium border border-border/40">
              Gak tercecer di WhatsApp & Notes
            </span>
            <span className="glass rounded-full px-3.5 py-1.5 font-medium border border-border/40">
              Gak panik pas ditelepon HRD
            </span>
          </div>

          {/* Dual CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-3.5 sm:flex-row animate-slide-up opacity-0 stagger-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center overflow-hidden rounded-xl btn-brand-gradient px-8 py-4 text-base sm:text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50"
              aria-label="Mulai lacak lamaran gratis"
            >
              <span className="relative z-10 flex items-center gap-2">
                Mulai Gratis
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 btn-brand-gradient-hover opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>

            <a
              href="#cara-kerja"
              className="w-full sm:w-auto glass-strong group inline-flex items-center justify-center rounded-xl px-7 py-4 text-base sm:text-lg font-semibold text-foreground shadow-md transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-brand-primary" />
                Lihat Cara Kerjanya
              </span>
            </a>
          </div>

          {/* Trust points */}
          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-8 flex-wrap text-xs sm:text-sm text-foreground/75 animate-slide-up opacity-0 stagger-5">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              100% Gratis Selamanya
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Data Privat & Aman
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Tinggal Buka di Browser HP / Laptop
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
