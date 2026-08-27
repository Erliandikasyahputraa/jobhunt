'use client'

import { LayoutGrid, CheckCircle2, Bookmark, FolderCheck, History, ShieldCheck } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function PlatformFeaturesSection() {
  const features = [
    {
      icon: LayoutGrid,
      title: 'Semua Lamaran di Satu Tempat',
      description:
        'Nggak perlu lagi buka-buka 10 tab browser, Excel berat, atau nyari chat WhatsApp yang tenggelam.',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: CheckCircle2,
      title: 'Tahu Status Tanpa Nebak',
      description:
        'Langsung kelihatan mana yang baru diincar, sudah dilamar, lagi tahap interview, atau sudah offering.',
      gradient: 'from-amber-500 to-yellow-500',
    },
    {
      icon: Bookmark,
      title: 'Simpan Link & Kontak HRD',
      description:
        'Catat link lowongan asli, kontak recruiter, ekspektasi gaji, sampai catatan khusus yang sudah kamu siapkan.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FolderCheck,
      title: 'CV & Dokumen Nggak Ketuker',
      description:
        'Simpan versi resume dan portfolio yang kamu kirim ke masing-masing perusahaan biar nggak salah bawa.',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      icon: History,
      title: 'Jadwal & Riwayat Rapi',
      description:
        'Tahu kapan tanggal apply dan kapan waktunya follow-up, biar nggak kelupaan atau keburu telat.',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: ShieldCheck,
      title: 'Data Kamu Aman & Privat',
      description:
        'Cuma kamu yang bisa melihat dan mengelola data lamaranmu. Terisolasi aman di database.',
      gradient: 'from-rose-500 to-pink-500',
    },
  ]

  return (
    <AnimatedSection delay={100}>
      <section
        id="fitur"
        className="px-4 py-16 sm:py-24 scroll-mt-20"
        aria-label="Platform features"
      >
        <div className="container mx-auto max-w-5xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-primary">
              Fitur Praktis
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Yang Bisa Kamu <span className="gradient-brand-text">Rapihin di Sini</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-foreground/80">
              Dibuat simpel buat menjawab hal-hal yang sering bikin pusing saat lagi berjuang cari
              kerja.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(feature => (
              <div
                key={feature.title}
                className="glass group rounded-2xl p-6 sm:p-7 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 border border-border/40 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
