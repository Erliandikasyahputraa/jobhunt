'use client'

import { GraduationCap, Briefcase, Rocket, RefreshCw, CheckCircle2 } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function ValuePropositionsSection() {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Fresh Graduate',
      subtitle: 'Baru lulus kuliah / sekolah',
      description:
        'Baru mulai apply ke sana-sini dan mulai bingung mencatat lowongan? Anti-Nganggur bikin proses melamarmu tetap rapi sejak hari pertama.',
      points: [
        'Tampilan simpel gampang dipahami',
        'Gratis selamanya tanpa biaya apa pun',
        'Bisa langsung dibuka di browser HP',
      ],
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Briefcase,
      title: 'Pencari Kerja Aktif',
      subtitle: 'Lagi rajin-rajinnya kirim CV',
      description:
        'Sudah kirim puluhan lamaran tiap minggu? Pantau status setiap perusahaan biar nggak ada jadwal interview yang terlewat.',
      points: [
        'Kolom tahapan visual yang jelas',
        'Catat kontak HRD & ekspektasi gaji',
        'Bisa download data ke CSV kapan saja',
      ],
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Rocket,
      title: 'Mahasiswa / Magang',
      subtitle: 'Mengejar program internship',
      description:
        'Daftar ke banyak tempat magang sekaligus dengan deadline yang beda-beda? Simpan info dan persyaratannya di satu tempat.',
      points: [
        'Pantau batas waktu pendaftaran',
        'Simpan link asli lowongan',
        'Ringan tanpa perlu install aplikasi',
      ],
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: RefreshCw,
      title: 'Career Switcher',
      subtitle: 'Mencoba jalur karir baru',
      description:
        'Lagi nyiapin portfolio beda untuk tiap bidang yang dituju? Catat versi resume dan kisi-kisi interview untuk masing-masing posisi.',
      points: [
        'Kelola beragam versi resume',
        'Catat catatan khusus tiap peran',
        'Data privat dan terisolasi aman',
      ],
      gradient: 'from-purple-500 to-pink-500',
    },
  ]

  return (
    <AnimatedSection delay={150}>
      <section className="px-4 py-16 sm:py-24" aria-label="Target audience">
        <div className="container mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-brand-primary">
              Bisa Dipakai Siapa Saja
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Cocok Buat <span className="gradient-brand-text">Siapa Aja?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-foreground/80">
              Siapa pun kamu yang lagi berjuang cari kerja atau magang, bisa langsung pakai tanpa
              ribet.
            </p>
          </div>

          {/* Audience Cards Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map(item => (
              <div
                key={item.title}
                className="glass group rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-border/40 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <span className="inline-block text-xs font-semibold text-brand-primary mb-3">
                    {item.subtitle}
                  </span>

                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed mb-5">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/30 space-y-2">
                  {item.points.map((point, pIndex) => (
                    <div key={pIndex} className="flex items-start gap-2 text-xs text-foreground/80">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
