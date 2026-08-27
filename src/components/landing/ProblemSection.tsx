'use client'

import {
  HelpCircle,
  FileText,
  Link2,
  Calendar,
  MessageSquare,
  AlertCircle,
  ArrowDown,
} from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function ProblemSection() {
  const problems = [
    {
      icon: HelpCircle,
      quote: '“Aku daftar di sini kemarin sudah sampai tahap apa, ya?”',
      description: 'Lupa progres karena catatan proses seleksi tercecer di mana-mana.',
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30',
    },
    {
      icon: FileText,
      quote: '“CV yang kukirim ke perusahaan ini versi yang mana?”',
      description: 'File resume ada banyak versi, pas dipanggil interview bingung sendiri.',
      color: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
    },
    {
      icon: Link2,
      quote: '“Kemarin nemu info lowongan bagus, tapi link-nya hilang ke mana?”',
      description: 'Tenggelam di bookmark browser, grup WhatsApp, atau screenshot galeri.',
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: Calendar,
      quote: '“Interview-nya kapan dan harus follow-up tanggal berapa?”',
      description: 'Pas ditelepon HRD mendadak, malah gelagapan karena belum siap catatan.',
      color: 'from-purple-500/20 to-indigo-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      icon: MessageSquare,
      quote: '“Lamaran udah banyak banget, tapi numpuk di chat & Notes.”',
      description: 'Semakin rajin kirim CV, semakin pusing nginget status tiap lamaran.',
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: AlertCircle,
      quote: '“Ditelepon HRD tapi lupa pernah apply posisi apa.”',
      description: 'Kehilangan momen penting cuma gara-gara lupa detail lowongannya.',
      color: 'from-rose-500/20 to-pink-500/20',
      borderColor: 'border-rose-500/30',
    },
  ]

  return (
    <AnimatedSection delay={100}>
      <section className="px-4 py-16 sm:py-24" aria-label="Problem statement">
        <div className="container mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="text-center mb-14">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-primary">
              Cerita Klasik Pencari Kerja
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Pernah Ngerasain <span className="gradient-brand-text">Ini?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-foreground/80">
              Apply udah belasan tempat. Tapi pas mau ngecek lagi, bingung sendiri: yang ini sudah
              dibalas belum, ya?
            </p>
          </div>

          {/* Problem Cards Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {problems.map((item, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-border/40 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${item.color} border ${item.borderColor} mb-4 text-brand-primary`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug mb-2">
                    {item.quote}
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Transition Box */}
          <div className="glass-strong rounded-2xl p-7 sm:p-9 text-center max-w-2xl mx-auto border border-brand-primary/30 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary mb-3">
              <ArrowDown className="h-5 w-5 animate-bounce" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2.5">
              Makanya Ada <span className="gradient-brand-text">Anti-Nganggur</span>.
            </h3>
            <p className="text-foreground/85 text-base sm:text-lg leading-relaxed">
              Semua lamaran kerja kamu, taruh di sini. Biar nggak nyari-nyari lagi dan perjalanan
              cari kerjamu jadi lebih tenang.
            </p>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
