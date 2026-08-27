'use client'

import { ChevronRight, HelpCircle } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

export function FAQSection() {
  const faqs = [
    {
      question: 'Anti-Nganggur itu sebenarnya aplikasi apa?',
      answer:
        'Anti-Nganggur itu tempat buat nyatet, merapikan, dan memantau semua lamaran kerja kamu. Jadi kamu tahu persis mana lowongan yang baru diincar, sudah dikirimi CV, lagi nunggu interview, sampai yang sudah ngasih tawaran kerja (offering).',
    },
    {
      question: 'Apakah beneran gratis atau ada biaya langganan?',
      answer:
        'Beneran 100% gratis! Nggak ada biaya langganan tersembunyi, nggak ada fitur yang dikunci, dan kami sama sekali nggak minta info kartu kredit.',
    },
    {
      question: 'Harus download aplikasi dari Play Store / App Store?',
      answer:
        'Nggak perlu download apa-apa! Anti-Nganggur adalah aplikasi web yang bisa langsung kamu buka lewat browser di HP (Chrome, Safari, dll.) maupun laptop.',
    },
    {
      question: 'Enak gak kalau dipakai lewat layar HP?',
      answer:
        'Enak dan ringan! Tampilannya sudah disesuaikan agar nyaman dibuka di layar HP, jadi kamu bisa langsung update status lamaran pas lagi bepergian.',
    },
    {
      question: 'Orang lain bisa ngintip data lamaran saya gak?',
      answer:
        'Nggak bisa sama sekali. Akun kamu terisolasi aman di database. Cuma kamu yang punya akses untuk melihat dan ngatur daftar lamaranmu sendiri.',
    },
    {
      question: 'Bisa download data lamaran ke Excel atau CSV?',
      answer:
        'Bisa banget! Kamu bisa unduh seluruh rekap lamaranmu ke file CSV kapan saja dengan sekali klik untuk dibuka di Microsoft Excel atau Google Sheets.',
    },
    {
      question: 'Aku baru pertama kali cari kerja (Fresh Graduate), gampang gak pakainya?',
      answer:
        'Gampang banget! Tampilannya dibuat sangat simpel dan bersih, jadi kamu bisa langsung paham cara pakainya dalam hitungan menit tanpa ribet.',
    },
    {
      question: 'Gimana cara mulainya?',
      answer:
        'Tinggal klik tombol "Mulai Gratis", buat akun pakai nama dan email kamu, terus kamu bisa langsung masukin daftar lowongan kerja pertamamu!',
    },
  ]

  return (
    <AnimatedSection delay={200}>
      <section
        id="faq"
        className="px-4 py-16 sm:py-24 scroll-mt-20"
        aria-label="Frequently asked questions"
      >
        <div className="container mx-auto max-w-3xl">
          {/* Section Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary mb-3">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Masih Bingung? <span className="gradient-brand-text">Coba Cek Ini.</span>
            </h2>
            <p className="mt-3 text-base sm:text-lg text-foreground/80">
              Pertanyaan yang paling sering ditanyain seputar Anti-Nganggur.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="glass group rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg border border-border/40"
              >
                <summary className="cursor-pointer p-5 sm:p-6 font-semibold text-foreground text-base sm:text-lg flex items-center justify-between hover:text-brand-primary select-none">
                  <span>{faq.question}</span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-open:rotate-90 shrink-0 ml-4" />
                </summary>
                <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-foreground/80 leading-relaxed border-t border-border/20 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  )
}
