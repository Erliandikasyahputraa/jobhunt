'use client'

import { Search, PlusCircle, MoveRight, CheckCircle, ArrowRight } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: Search,
      title: 'Nemu Lowongan Bagus',
      description:
        'Lagi scrolling LinkedIn, Jobstreet, Glints, atau medsos? Catat dan simpan lowongan yang kamu incar ke sini.',
    },
    {
      step: '02',
      icon: PlusCircle,
      title: 'Simpan Detail Penting',
      description:
        'Masukin nama posisi, perkiraan gaji, link asli, kontak HRD, dan upload versi CV yang kamu kirim.',
    },
    {
      step: '03',
      icon: MoveRight,
      title: 'Geser Sesuai Progres',
      description:
        'Tiap ada kabar dari perusahaan, tinggal geser kartu dari Incaran → Dilamar → Interview → Diterima.',
    },
    {
      step: '04',
      icon: CheckCircle,
      title: 'Selalu Siap & Tenang',
      description:
        'Pas tiba-tiba dihubungi recruiter, langsung buka catatanmu. Tahu persis posisi dan detail yang dilamar.',
    },
  ]

  return (
    <AnimatedSection delay={200}>
      <section
        id="cara-kerja"
        className="px-4 py-16 sm:py-24 scroll-mt-20"
        aria-label="How it works"
      >
        <div className="container mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-primary">
              Alur Simpel
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Cara Pakainya <span className="gradient-brand-text">Gampang</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-foreground/80">
              Cuma 4 langkah simpel biar kamu nggak pusing ngatur puluhan lamaran kerja.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
            {steps.map((item, index) => (
              <div
                key={item.step}
                className="glass group rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-border/40 flex flex-col justify-between relative"
              >
                <div>
                  {/* Step Number Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-foreground/20 group-hover:text-brand-primary/40 transition-colors">
                      {item.step}
                    </span>
                    <div className="h-11 w-11 rounded-xl gradient-brand text-white flex items-center justify-center shadow-md">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-foreground/30">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
