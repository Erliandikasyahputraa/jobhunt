'use client'

import { Building2, Calendar, DollarSign, FileText, Clock, Sparkles } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

interface ShowcaseCard {
  company: string
  role: string
  location: string
  salary?: string
  appliedDate?: string
  interviewDate?: string
  note?: string
  doc?: string
  highlight?: boolean
  success?: boolean
}

interface ShowcaseColumn {
  title: string
  count: number
  badgeColor: string
  cards: ShowcaseCard[]
}

export function ProductShowcaseSection() {
  const columns: ShowcaseColumn[] = [
    {
      title: 'Incaran',
      count: 2,
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      cards: [
        {
          company: 'Tokopedia',
          role: 'Frontend Engineer',
          location: 'Jakarta (Hybrid)',
          salary: 'Rp 12 - 18 Jt',
          note: 'Batas lamaran 30 Agustus',
          doc: 'CV_Frontend_2026.pdf',
        },
        {
          company: 'Gojek',
          role: 'Product Designer',
          location: 'Remote',
          salary: 'Rp 10 - 15 Jt',
          note: 'Kontak HRD: Mbak Sarah',
          doc: 'Portfolio_Design.pdf',
        },
      ],
    },
    {
      title: 'Dilamar',
      count: 2,
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      cards: [
        {
          company: 'Traveloka',
          role: 'Software Engineer',
          location: 'Tangerang',
          appliedDate: '24 Agustus 2026',
          note: 'Apply via LinkedIn',
          doc: 'Resume_Terbaru.pdf',
        },
        {
          company: 'Shopee',
          role: 'Product Operations',
          location: 'Jakarta',
          appliedDate: '26 Agustus 2026',
          note: 'Referral dari Mas Budi',
          doc: 'Cover_Letter_Shopee.pdf',
        },
      ],
    },
    {
      title: 'Interview',
      count: 1,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      cards: [
        {
          company: 'Blibli',
          role: 'React Developer',
          location: 'Jakarta Pusat',
          interviewDate: 'Besok, 14:00 WIB (Google Meet)',
          note: 'Persiapan studi kasus coding test',
          doc: 'CV_Tech_2026.pdf',
          highlight: true,
        },
      ],
    },
    {
      title: 'Diterima',
      count: 1,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      cards: [
        {
          company: 'Bank Mandiri',
          role: 'Digital Banking Specialist',
          location: 'Jakarta',
          salary: 'Rp 14 - 19 Jt',
          note: 'Offering letter sudah masuk email 🎉',
          doc: 'Kontrak_Kerja.pdf',
          success: true,
        },
      ],
    },
  ]

  return (
    <AnimatedSection delay={150}>
      <section className="px-4 py-16 sm:py-24" aria-label="Product showcase">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-primary">
              Tampilan Papan Lamaran
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Biar Nggak Nyari-Nyari Lagi,{' '}
              <span className="gradient-brand-text">Semua Rapi di Sini</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-foreground/80">
              Tinggal geser kartu saat ada kabar dari HRD. Dari yang baru diincar sampai tawaran
              kerja masuk.
            </p>
          </div>

          {/* Kanban Board Mockup Container */}
          <div className="glass-strong rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-border/50 overflow-hidden">
            {/* Top Toolbar Mockup */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-border/40">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
                <span className="text-xs sm:text-sm font-semibold text-foreground ml-2">
                  Papan Lamaran Saya (6 Lowongan)
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-foreground/75">
                <span className="glass px-3 py-1.5 rounded-lg border border-border/40 hidden sm:inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                  Filter & Urutkan
                </span>
                <span className="glass px-3 py-1.5 rounded-lg border border-border/40">
                  + Tambah Lamaran
                </span>
              </div>
            </div>

            {/* Columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {columns.map(col => (
                <div
                  key={col.title}
                  className="glass rounded-xl p-3.5 flex flex-col gap-3 border border-border/40 bg-background/40"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 py-1">
                    <span className="font-bold text-sm sm:text-base text-foreground">
                      {col.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold border ${col.badgeColor}`}
                    >
                      {col.count}
                    </span>
                  </div>

                  {/* Cards inside Column */}
                  <div className="flex flex-col gap-3">
                    {col.cards.map((card, cardIndex) => (
                      <div
                        key={cardIndex}
                        className={`rounded-xl p-4 transition-all duration-300 hover:shadow-lg border ${
                          card.highlight
                            ? 'glass-heavy border-amber-500/40 shadow-amber-500/10'
                            : card.success
                              ? 'glass-heavy border-emerald-500/40 shadow-emerald-500/10'
                              : 'glass border-border/50'
                        }`}
                      >
                        {/* Company & Role */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-sm text-foreground leading-snug">
                              {card.role}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80 mt-0.5">
                              <Building2 className="h-3.5 w-3.5 text-brand-primary shrink-0" />
                              <span>{card.company}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details / Badges */}
                        <div className="space-y-1.5 text-[11px] text-foreground/75 mt-3 pt-2.5 border-t border-border/30">
                          {card.salary && (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                              <DollarSign className="h-3 w-3 shrink-0" />
                              <span>{card.salary}</span>
                            </div>
                          )}

                          {card.interviewDate && (
                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>{card.interviewDate}</span>
                            </div>
                          )}

                          {card.appliedDate && (
                            <div className="flex items-center gap-1.5 text-foreground/70">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Dilamar: {card.appliedDate}</span>
                            </div>
                          )}

                          {card.note && (
                            <p className="text-foreground/75 line-clamp-1 italic">
                              &ldquo;{card.note}&rdquo;
                            </p>
                          )}

                          {card.doc && (
                            <div className="flex items-center gap-1.5 text-brand-primary/90 font-mono text-[10px] pt-1">
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate">{card.doc}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Proof Note */}
            <div className="mt-5 pt-4 text-center text-xs text-foreground/70 border-t border-border/30">
              💡 <span className="font-medium text-foreground">Gampang Banget:</span> Tinggal geser
              kartu saat tahapan lamaranmu berubah.
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
